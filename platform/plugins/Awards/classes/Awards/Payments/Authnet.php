<?php
/**
 * @module Awards
 */
/**
 * Adapter implementing Authorize.net support for Awards_Payments functions
 *
 * @class Awards_Payments_Authnet
 * @implements Awards_Payments
 */

use net\authorize\api\contract\v1 as AnetAPI;
use net\authorize\api\controller as AnetController;
use net\authorize\util\LogFactory as LogFactory;

class Awards_Payments_Authnet extends Awards_Payments implements iAwards_Payments
{
	/**
	 * @constructor
	 * @param {array} [$options=array()] Any initial options
	 */
	function __construct($options = array())
	{
		Q::includeFile(implode(DS, array(
			Q_PLUGINS_DIR, 'Awards', 'classes', 'Composer', 'vendor', 'autoload.php'
		)));
		$options['authname'] = Q_Config::expect('Awards', 'payments', 'authorize.net', 'name');
		$options['authkey'] = Q_Config::expect('Awards', 'payments', 'authorize.net', 'transactionKey');
		$options['server'] = net\authorize\api\constants\ANetEnvironment::SANDBOX;
		$options += array(
			'service' => 'authorize.net',
			'currency' => 'usd',
			'subscription' => ''
		);
		$this->options = $options;
	}
	
	/**
	 * Executes some API calls and obtains a customer id
	 * @method customerId
	 * @return {string} The customer id
	 */
	function customerId()
	{
		$options = $this->options;
		$sub = $options;
		$sub['amount'] = (int) $options['amount'];

		// Common Set Up for API Credentials
		$merchantAuthentication = new AnetAPI\MerchantAuthenticationType();
		$merchantAuthentication->setName($options['authname']);
		$merchantAuthentication->setTransactionKey($options['authkey']);
		$refId = 'ref' . time();

		// TODO: check if customer with corresponding e-mail exists before creating new one

		$merchantCustomerId = Users::loggedInUser(true)->id;

		$customerprofile = new AnetAPI\CustomerProfileType();
		$customerprofile->setMerchantCustomerId($merchantCustomerId);
		$customerprofile->setDescription("Customer registered for hosted form payments");
		$customerprofile->setEmail(Users::loggedInUser()->emailAddress);

		$request = new AnetAPI\CreateCustomerProfileRequest();
		$request->setMerchantAuthentication($merchantAuthentication);
		$request->setRefId($refId);
		$request->setProfile($customerprofile);

		$controller = new AnetController\CreateCustomerProfileController($request);

		$response = $controller->executeWithApiResponse($options['server']);

		if ($response != null && $response->getMessages()->getResultCode() == "Ok") {
			return $response->getCustomerProfileId();
		}
		
		$messages = $response->getMessages()->getMessage();
		$message = reset($messages);
		
		if (!isset($response) or ($message->getCode() == "E00039")) {
			// workaround to get customerProfileId
			// https://community.developer.authorize.net/t5/Integration-and-Testing/How-to-lookup-customerProfileId-and-paymentProfileId-by/td-p/52501
			$parts = explode(' ', $message->getText());
			return $parts[5];
		}
		
		throw new Awards_Exception_InvalidResponse(array(
			'response' => $message->getCode() . ' ' . $message->getText()
		));
	}
	
	/**
	 * Executes some API calls and obtains a payment profile id
	 * @method paymentProfileId
	 * @return {string} The payment profile id
	 */
	function paymentProfileId($customerId)
	{
		$options = $this->options;
		
		$merchantAuthentication = new AnetAPI\MerchantAuthenticationType();
		$merchantAuthentication->setName($options['authname']);
		$merchantAuthentication->setTransactionKey($options['authkey']);

		$request = new AnetAPI\GetCustomerProfileRequest();
		$request->setMerchantAuthentication($merchantAuthentication);
		$request->setCustomerProfileId($customerId);
		$controller = new AnetController\GetCustomerProfileController($request);
		$response = $controller->executeWithApiResponse($options['server']);
		if (!isset($response) or $response->getMessages()->getResultCode() != "Ok") {
			$messages = $response->getMessages()->getMessage();
			$message = reset($messages);
			throw new Awards_Exception_InvalidResponse(array(
				'response' => $message->getCode() . ' ' . $message->getText()
			));
		}
		$profileSelected = $response->getProfile();
		$paymentProfilesSelected = $profileSelected->getPaymentProfiles();
		if ($paymentProfilesSelected == null) {
			throw new Awards_Exception_PaymentMethodRequired();
		}
		return $paymentProfilesSelected[0]->getCustomerPaymentProfileId();
	}
	
	/**
	 * Make a one-time charge using the payments processor
	 * @method charge
	 * @param {string} [$customerId=null] specify a customer id
	 * @param {string} [$paymentProfileId=null] specify a payment profile
	 * @throws Awards_Exception_DuplicateTransaction
	 * @throws Awards_Exception_HeldForReview
	 * @throws Awards_Exception_ChargeFailed
	 * @return {Awards_Charge} the saved database row corresponding to the charge
	 */
	function charge($customerId = null, $paymentProfileId = null)
	{
		if (!isset($customerId)) {
			$customerId = $this->customerId();
		}
		if (!isset($paymentProfileId)) {
			$paymentProfileId = $this->paymentProfileId($customerId);
		}
		
		$options = $this->options;
		
		// Common setup for API credentials
		$merchantAuthentication = new AnetAPI\MerchantAuthenticationType();
		$merchantAuthentication->setName($options['authname']);
		$merchantAuthentication->setTransactionKey($options['authkey']);
		$refId = 'ref' . time();

		$paymentProfile = new AnetAPI\PaymentProfileType();
		$paymentProfile->setPaymentProfileId($paymentProfileId);

		$profileToCharge = new AnetAPI\CustomerProfilePaymentType();
		$profileToCharge->setCustomerProfileId($customerId);
		$profileToCharge->setPaymentProfile($paymentProfile);

		$transactionRequestType = new AnetAPI\TransactionRequestType();
		$transactionRequestType->setTransactionType("authCaptureTransaction");
		$transactionRequestType->setAmount($options['amount']);
		$transactionRequestType->setProfile($profileToCharge);

		$request = new AnetAPI\CreateTransactionRequest();
		$request->setMerchantAuthentication($merchantAuthentication);
		$request->setRefId($refId);
		$request->setTransactionRequest($transactionRequestType);
		$controller = new AnetController\CreateTransactionController($request);

		$response = $controller->executeWithApiResponse($options['server']);
		if (!isset($response)) {
			throw new Awards_Exception_InvalidResponse(array(
				'response' => 'empty response'
			));
		}
		
		$tresponse = $response->getTransactionResponse();
		if (!isset($tresponse)) {
			throw new Awards_Exception_ChargeFailed();
		}
		switch ($tresponse->getResponseCode()) {
		case '1':
			$charge = new Awards_Charge();
			//$charge->insert($fields);
			$charge->save();
			return $charge;
		case '3': 
			throw new Awards_Exception_DuplicateTransaction();
		case '4':
			throw new Awards_Exception_HeldForReview();
		default:
			throw new Awards_Exception_ChargeFailed();
		}
	}
	
	function authToken($customerId = null)
	{
		if (!isset($customerId)) {
			$customerId = $this->customerId();
		}
		
		$options = $this->options;

		$sub = $options;
		$sub['amount'] = (int) $options['amount'];

		// Common Set Up for API Credentials
		$merchantAuthentication = new AnetAPI\MerchantAuthenticationType();
		$merchantAuthentication->setName($options['authname']);
		$merchantAuthentication->setTransactionKey($options['authkey']);
		$refId = 'ref' . time();

		$setting = new AnetAPI\SettingType();

		// 2do: fix domain name and path for iframe popup

		$setting->setSettingName("hostedProfileIFrameCommunicatorUrl");
		$setting->setSettingValue(Q_Html::themedUrl('plugins/Awards/authnet_iframe_communicator.html'));

		$setting->setSettingName("hostedProfilePageBorderVisible");
		$setting->setSettingValue("false");

		$frequest = new AnetAPI\GetHostedProfilePageRequest();
		$frequest->setMerchantAuthentication($merchantAuthentication);
		$frequest->setCustomerProfileId($customerId);
		$frequest->addToHostedProfileSettings($setting);

		$controller = new AnetController\GetHostedProfilePageController($frequest);
		$fresponse = $controller->executeWithApiResponse($options['server']);

		if (!isset($fresponse) or ($fresponse->getMessages()->getResultCode() != "Ok")) {
			$messages = $response->getMessages()->getMessage();
			$message = reset($messages);
			throw new Awards_Exception_InvalidResponse(array(
				'response' => $message->getCode() . ' ' . $message->getText()
			));
		}
		return $fresponse->getToken();
	}
	
	public $options = array();

}
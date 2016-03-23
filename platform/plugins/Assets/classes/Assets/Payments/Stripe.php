<?php
/**
 * @module Assets
 */
/**
 * Adapter implementing Stripe support for Assets_Payments functions
 *
 * @class Assets_Payments_Stripe
 * @implements Assets_Payments
 */

class Assets_Payments_Stripe extends Assets_Payments implements iAssets_Payments
{
	/**
	 * @constructor
	 * @param {array} $options=array() Any initial options
	 * @param {string} $options.secret
	 * @param {string} $options.publishableKey
	 * @param {string} $options.token If provided, allows us to create a customer and charge them
 	 * @param {Users_User} [$options.user=Users::loggedInUser()] Allows us to set the user to charge
	 */
	function __construct($options = array())
	{
		if (!isset($options['user'])) {
			$options['user'] = Users::loggedInUser(true);
		}
		$this->options = array_merge(array(
			'secret' => Q_Config::expect('Assets', 'payments', 'stripe', 'secret'),
			'publishableKey' => Q_Config::expect('Assets', 'payments', 'stripe', 'publishableKey'),
		), $options);
	}
	
	/**
	 * Executes some API calls and obtains a customer id
	 * @method customerId
	 * @return {string} The customer id
	 */
	function customerId()
	{
		$options = $this->options;
	}
	
	/**
	 * Executes some API calls and obtains a payment profile id
	 * @method paymentProfileId
	 * @return {string} The payment profile id
	 */
	function paymentProfileId($customerId)
	{
		$options = $this->options;
	}
	
	/**
	 * Make a one-time charge using the payments processor
	 * @method charge
	 * @param {double} $amount specify the amount (optional cents after the decimal point)
	 * @param {string} [$currency='USD'] set the currency, which will affect the amount
	 * @param {array} [$options=array()] Any additional options
	 * @param {string} [$options.token=null] required unless the user is an existing customer
	 * @param {string} [$options.description=null] description of the charge, to be sent to customer
	 * @param {string} [$options.metadata=null] any additional metadata to store with the charge
	 * @param {string} [$options.subscription=null] if this charge is related to a subscription stream
	 * @param {string} [$options.subscription.publisherId]
	 * @param {string} [$options.subscription.streamName]
	 * @throws \Stripe\Error\Card
	 * @return {string} The customerId of the Assets_Customer that was successfully charged
	 */
	function charge($amount, $currency = 'USD', $options = array())
	{
		$options = array_merge($this->options, $options);
		Q_Valid::requireFields(array('secret', 'user'), $options, true);
		\Stripe\Stripe::setApiKey($options['secret']);
		$user = $options['user'];
		$customer = new Assets_Customer();
		$customer->userId = $user->id;
		$customer->payments = 'stripe';
		if (!$customer->retrieve()) {
			Q_Valid::requireFields(array('token'), $options, true);
			$sc = \Stripe\Customer::create(array(
				"source" => $options['token']["id"],
				"description" => $options['user']->displayName()
			));
			$customer->customerId = $sc->id;
			$customer->save();
		}
		$params = array(
			"amount" => $amount * 100, // in cents
			"currency" => $currency,
			"customer" => $customer->customerId
		);
		Q::take($options, array('description', 'metadata'), $params);
		\Stripe\Charge::create($params); // can throw some exception
		return $customer->customerId;
	}
	
	function authToken($customerId = null)
	{
		if (!isset($customerId)) {
			$customerId = $this->customerId();
		}
		
		$options = $this->options;

		// Common Set Up for API Credentials
		$merchantAuthentication = new AnetAPI\MerchantAuthenticationType();
		$merchantAuthentication->setName($options['authname']);
		$merchantAuthentication->setTransactionKey($options['authkey']);
		$refId = 'ref' . time();

		$setting = new AnetAPI\SettingType();

		// 2do: fix domain name and path for iframe popup

		$setting->setSettingName("hostedProfileIFrameCommunicatorUrl");
		$setting->setSettingValue(Q_Html::themedUrl('plugins/Assets/authnet_iframe_communicator.html'));

		$setting->setSettingName("hostedProfilePageBorderVisible");
		$setting->setSettingValue("false");

		$frequest = new AnetAPI\GetHostedProfilePageRequest();
		$frequest->setMerchantAuthentication($merchantAuthentication);
		$frequest->setCustomerProfileId($customerId);
		$frequest->addToHostedProfileSettings($setting);

		$controller = new AnetController\GetHostedProfilePageController($frequest);
		$fresponse = $controller->executeWithApiResponse($options['server']);

		if (!isset($fresponse) or ($fresponse->getMessages()->getResultCode() != "Ok")) {
			$messages = $fresponse->getMessages()->getMessage();
			$message = reset($messages);
			throw new Assets_Exception_InvalidResponse(array(
				'response' => $message->getCode() . ' ' . $message->getText()
			));
		}
		return $fresponse->getToken();
	}
	
	public $options = array();

}
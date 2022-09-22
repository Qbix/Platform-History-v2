<?php
require ASSETS_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';

/**
 * @module Assets
 */
/**
 * Adapter implementing Stripe support for Assets_Payments functions
 *
 * @class Assets_Payments_Stripe
 * @implements Assets_Payments
 */

class Assets_Payments_Stripe extends Assets_Payments implements Assets_Payments_Interface
{

	public $options = array();

	/**
	 * @constructor
	 * @param {array} $options=array() Any initial options
	 * @param {string} $options.secret
	 * @param {string} $options.publishableKey
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
		\Stripe\Stripe::setApiKey($this->options['secret']);
	}
	
	/**
	 * Make a one-time charge using the payments processor
	 * @method charge
	 * @param {double} $amount specify the amount (optional cents after the decimal point)
	 * @param {string} [$currency='USD'] set the currency, which will affect the amount
	 * @param {array} [$options=array()] Any additional options
	 * @param {string} [$options.description=null] description of the charge, to be sent to customer
	 * @param {string} [$options.metadata=null] any additional metadata to store with the charge
	 * @param {string} [$options.subscription=null] if this charge is related to a subscription stream
	 * @param {string} [$options.subscription.publisherId]
	 * @param {string} [$options.subscription.streamName]
	 * @throws \Stripe\Exception\CardException
	 * @return {string} The customerId of the Assets_Customer that was successfully charged
	 */
	function charge($amount, $currency = 'USD', $options = array())
	{
		$options = array_merge($this->options, $options);
		Q_Valid::requireFields(array('user'), $options, true);
		$user = $options['user'];

		// get or create stripe customer
		$customer = new Assets_Customer();
		$customer->userId = $user->id;
		$customer->payments = 'stripe';
		if (!$customer->retrieve()) {
			$stripeCustomer = self::createCustomer($user);
			$customer->customerId = $stripeCustomer->id;
			$customer->save();
		}

		$params = array(
			"amount" => $amount * 100, // in cents
			"currency" => $currency,
			"customer" => $customer->customerId,
			"metadata" => !empty($options['metadata']) ? $options['metadata'] : null,
			'off_session' => true,
			'confirm' => true,
		);
		Q::take($options, array('description', 'metadata'), $params);

		$stripeClient = new \Stripe\StripeClient($this->options['secret']);
		$paymentMethods = $stripeClient->paymentMethods->all(['customer' => $customer->customerId, 'type' => 'card']);
		if (empty($paymentMethods->data)) {
			$err_mesage = "Offline payment methods not found for userId=".$user->id." with customerId=".$customer->customerId;
			self::log('Stripe.charges', $err_mesage);
			throw new Exception($err_mesage);
		}
		$params['payment_method'] = end($paymentMethods->data)->id;

		try {
			\Stripe\PaymentIntent::create($params);
		} catch (\Stripe\Exception\CardException $e) {
			// Error code will be authentication_required if authentication is needed
			$payment_intent_id = $e->getError()->payment_intent->id;
			$payment_intent = \Stripe\PaymentIntent::retrieve($payment_intent_id);
			self::log('Stripe.charges', 'Failed charge for userId='.$user->id.' customerId='.$customer->customerId.' with error code:' . $e->getError()->code, $payment_intent);
			exit;
		}

		return $customer->customerId;
	}
	/**
	 * Create stripe customer.
	 * Allow you to perform recurring charges, and to track multiple charges, that are associated with the same customer
	 * @method createCustomer
	 * @param {Users_User} $user
	 * @param {array} [$params] Additional params.
	 * @return {object} The customer object
	 */
	function createCustomer($user, $params = array())
	{
		$avatar = Streams_Avatar::fetch($user->id, $user->id);
		$params["name"] = $avatar->displayName();
		if ($user->emailAddress) {
			$params['email'] = $user->emailAddress;
		}
		if ($user->mobileNumber) {
			$params['phone'] = $user->mobileNumber;
		}

		return \Stripe\Customer::create($params);
	}

	/**
	 * Create a payment intent
	 * @method createPaymentIntent
	 * @param {double} $amount specify the amount (optional cents after the decimal point)
	 * @param {string} [$currency='USD'] set the currency, which will affect the amount
	 * @param {array} [$options=array()] Any additional options
	 * @param {string} [$options.metadata=null] any additional metadata to store with the charge
	 * @throws \Stripe\Exception\CardException
	 * @return object
	 */
	function createPaymentIntent($amount, $currency = 'USD', $options = array())
	{
		$options = array_merge($this->options, $options);

		$options['metadata'] = Q::ifset($options, 'metadata', array());
		$options['metadata']['userId'] = $options['user']->id;

		$amount = $amount * 100; // in cents

		// get or create stripe customer
		$customer = new Assets_Customer();
		$customer->userId = $options['user']->id;
		$customer->payments = 'stripe';
		if (!$customer->retrieve()) {
			$stripeCustomer = self::createCustomer($options['user']);
			$customer->customerId = $stripeCustomer->id;
			$customer->save();
		}

		Q_Valid::requireFields(array('user'), $options, true);
		$params = array(
			'customer' => $customer->customerId,
			'setup_future_usage' => 'off_session',
			'automatic_payment_methods' => array('enabled' => true),
			'amount' => $amount,
			'currency' => $currency,
			'metadata' => !empty($options['metadata']) ? $options['metadata'] : null
		);

		// get connected account
		$connectedAccount = new Assets_Connected();
		$connectedAccount->merchantUserId = Q::app();
		$connectedAccount->payments = 'stripe';
		if ($connectedAccount->retrieve()) {
			// get commission percents
			$commission = (int)Q_Config::expect("Assets", "commission");

			$params['application_fee_amount'] = ceil($amount - $amount/100 * $commission);
			$params['transfer_data'] = array(
				'destination' => $connectedAccount->accountId
			);
		}

		$intent = \Stripe\PaymentIntent::create($params); // can throw some exception

		return $intent;
	}

	static function log ($key, $title, $message=null) {
		Q::log('______________________________________________', $key);
		Q::log(date('Y-m-d H:i:s').': '.$title, $key);
		if ($message) {
			Q::log($message, $key, array(
				"maxLength" => 10000
			));
		}
	}
}
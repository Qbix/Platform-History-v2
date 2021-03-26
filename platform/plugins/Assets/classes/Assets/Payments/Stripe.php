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

class Assets_Payments_Stripe extends Assets_Payments implements Assets_Payments_Interface
{

	public $options = array();

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
	 * @throws \Stripe\Exception\CardException
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
			$stripeCustomer = self::createCustomer($user, array(
				"source" => $options['token']["id"]
			));
			$customer->customerId = $stripeCustomer->id;
			$customer->save();
		}
		$params = array(
			"amount" => $amount * 100, // in cents
			"currency" => $currency,
			"customer" => $customer->customerId,
			"metadata" => !empty($options['metadata']) ? $options['metadata'] : null
		);
		Q::take($options, array('description', 'metadata'), $params);
		$res = \Stripe\Charge::create($params); // can throw some exception
		return $customer->customerId;
	}
	/**
	 * Create stripe customer.
	 * Allow you to perform recurring charges, and to track multiple charges, that are associated with the same customer
	 * @method createCustomer
	 * @param {Users_User} $user
	 * @param {array} [$params] Additional params. For example 'source' passed with token id.
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

		Q_Valid::requireFields(array('secret', 'user'), $options, true);
		\Stripe\Stripe::setApiKey($options['secret']);
		$params = array(
			'payment_method_types' => ['card'],
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
}
<?php
/**
 * Assets model
 * @module Assets
 * @main Assets
 */
/**
 * Static methods for the Assets models.
 * @class Assets
 * @extends Base_Assets
 */

abstract class Assets extends Base_Assets
{
	/**
	 * Get the official currency name (e.g. "US Dollar") and symbol (e.g. $)
	 * @method currency
	 * @static
	 * @param {string} $code The three-letter currency code
	 * @return {array} Returns an array of ($currencyName, $symbol)
	 * @throws Q_Exception_BadValue
	 */
	static function currency($code)
	{
		$config = Q_Config::get('Assets', 'currencies', array());
        $json = Q::readFile(ASSETS_PLUGIN_CONFIG_DIR.DS.'currencies.json',
		Q::take($config, array(
			'ignoreCache' => true,
			'dontCache' => true,
			'duration' => 3600
		)));
		$code = strtoupper($code);
		$currencies = Q::json_decode($json, true);
		if (!isset($currencies['symbols'][$code])) {
			throw new Q_Exception_BadValue(array(
				'internal' => 'currency', 
				'problem' => "no symbol found for $code"
			), 'currency');
		}
		if (!isset($currencies['names'][$code])) {
			throw new Q_Exception_BadValue(array(
				'internal' => 'currency', 
				'problem' => "no name found for $code"
			), 'currency');
		}
		$symbol = $currencies['symbols'][$code];
		$currencyName = $currencies['names'][$code];
		return array($currencyName, $symbol);
	}
	
	/**
	 * Get the official currency name (e.g. "US Dollar") and symbol (e.g. $)
	 * @method display
	 * @static
	 * @param {string} $code The three-letter currency code
	 * @param {double} $amount The amount of money in that currency
	 * @return {string} The display, in the current locale
	 */
	static function display($code, $amount)
	{
		list($currencyName, $symbol) = self::currency($code);
		return "$code$amount"; // TODO: make it fit the locale better
	}
	
	/**
	 * Get the official currency name (e.g. "US Dollar") and symbol (e.g. $)
	 * @method display
	 * @static
	 * @param {string} $format The format to pass to money_format
	 * @param {double} $amount The amount of money in the currency of that locale
	 * @param {string} [$locale] Can be used to override the locale
	 * @return {string} The display, in the current locale
	 */
	static function formatted($format = "%=(n", $amount, $locale = null)
	{
		if (is_callable('money_format')) {
			$ob = new Q_OutputBuffer(null, $locale);
			echo money_format($format, $amount);
			return $ob->getClean();
		}
	}
	
	/**
	 * Makes a one-time charge on a customer account using a payments processor
	 * @method charge
	 * @static
	 * @param {string} $payments The type of payments processor, could be "Authnet" or "Stripe"
	 * @param {string} $amount specify the amount
	 * @param {string} [$currency='USD'] set the currency, which will affect the amount
	 * @param {array} [$options=array()] Any additional options
 	 * @param {Users_User} [$options.user=Users::loggedInUser()] Allows us to set the user to charge
	 * @param {Streams_Stream} [$options.stream=null] if this charge is related to an Assets/product, Assets/service or Assets/subscription stream
	 * @param {string} [$options.token=null] required for stripe unless the user is an existing customer
	 * @param {string} [$options.description=null] description of the charge, to be sent to customer
	 * @param {string} [$options.metadata=null] any additional metadata to store with the charge
	 * @throws \Stripe\Error\Card
	 * @throws Assets_Exception_DuplicateTransaction
	 * @throws Assets_Exception_HeldForReview
	 * @throws Assets_Exception_ChargeFailed
	 * @return {Assets_Charge} the saved database row corresponding to the charge
	 */
	static function charge($payments, $amount, $currency = 'USD', $options = array())
	{
		$currency = strtoupper($currency);
		$user = Q::ifset($options, 'user', Users::loggedInUser(false));
		$className = 'Assets_Payments_' . ucfirst($payments);
		$adapter = new $className($options);
		$communityId = Users::communityId();
		/**
		 * @event Assets/charge {before}
		 * @param {Assets_Payments} adapter
		 * @param {array} options
		 */
		Q::event('Assets/charge', compact('adapter', 'options'), 'before');
		$customerId = $adapter->charge($amount, $currency, $options);
		$charge = new Assets_Charge();
		$charge->userId = $user->id;
		$charge->publisherId = Q::ifset($options, 'stream', 'publisherId', '');
		$charge->streamName = Q::ifset($options, 'stream', 'name', '');
		$charge->description = Q::ifset($options, 'description', '');
		$attributes = array(
			"payments" => $payments,
			"customerId" => $customerId,
			"amount" => sprintf("%0.2f", $amount),
			"currency" => $currency,
			"communityId" => $communityId
		);
		$charge->attributes = Q::json_encode($attributes);
		$charge->save();
		/**
		 * @event Assets/charge {after}
		 * @param {Assets_charge} charge
		 * @param {Assets_Payments} adapter
		 * @param {array} options
		 */
		Q::event('Assets/charge', compact(
			'payments', 'amount', 'currency', 'user', 'charge', 'adapter', 'options'
		), 'after');

		return $charge;
	}

	/**
	 * Starts a recurring subscription
	 * @param {Streams_Stream} $plan The subscription plan stream
	 * @param {string} [$payments=null] The type of payments processor, could be "authnet" or "stripe". If omitted, the subscription proceeds without any payments.
	 * @param {array} [$options=array()] Options for the subscription
	 * @param {date} [$options.startDate=today] The start date of the subscription
	 * @param {date} [$options.endDate=today+year] The end date of the subscription
 	 * @param {Users_User} [$options.user=Users::loggedInUser()] Allows us to set the user to subscribe
	 * @param {Users_User} [$options.publisherId=Users::communityId()] Allows us to override the publisher to subscribe to
	 * @param {string} [$options.description=null] description of the charge, to be sent to customer
	 * @param {string} [$options.metadata=null] any additional metadata to store with the charge
	 * @param {string} [$options.subscription=null] if this charge is related to a subscription stream
	 * @param {string} [$options.subscription.publisherId]
	 * @param {string} [$options.subscription.streamName]
	 * @throws Assets_Exception_DuplicateTransaction
	 * @throws Assets_Exception_HeldForReview
	 * @throws Assets_Exception_ChargeFailed
	 * @return {Streams_Stream} A stream of type 'Assets/subscription' representing this subscription
	 */
	static function startSubscription($plan, $payments = null, $options = array())
	{
		if (!isset($options['user'])) {
			$options['user'] = Users::loggedInUser(true);
		}
		
		$app = Q::app();
		$user = Q::ifset($options, 'user', Users::loggedInUser(true));
		$currency = 'USD'; // TODO: may want to implement support for currency conversion
		$startDate = Q::ifset($options, 'startDate', date("Y-m-d"));
		$startDate = date('Y-m-d', strtotime($startDate));
		$months = $plan->getAttribute('months', 12);
		$amount = $plan->getAttribute('amount');
		$endDate = date("Y-m-d", strtotime("-1 day", strtotime("+$months month", strtotime($startDate))));
		$endDate = date('Y-m-d', strtotime($endDate));

		$publisherId = Q::ifset($options, 'publisherId', Users::communityId());
		$publisher = Users_User::fetch($publisherId);
		$streamName = "Assets/subscription/{$user->id}/{$plan->name}";
		if ($subscription = Streams::fetchOne($publisherId, $publisherId, $streamName)) {
			return $subscription; // it already started
		}
		$attributes = Q::json_encode(array(
			'payments' => $payments,
			'planPublisherId' => $plan->publisherId,
			'planStreamName' => $plan->name,
			'startDate' => $startDate,
			'endDate' => $endDate,
			'months' => $months,
			'amount' => $amount, // lock it in, in case plan changes later
			'currency' => $currency
		));
		$stream = Streams::create(
			$publisherId,
			$publisherId,
			"Assets/subscription",
			array(
				'name' => $streamName,
				'title' => $plan->title,
				'readLevel' => Streams::$READ_LEVEL['none'],
				'writeLevel' => Streams::$WRITE_LEVEL['none'],
				'adminLevel' => Streams::$ADMIN_LEVEL['none'],
				'attributes' => $attributes
			)
		);
		$access = new Streams_Access(array(
			'publisherId' => $publisherId,
			'streamName' => $streamName,
			'ofUserId' => $user->id,
			'grantedByUserId' => $app,
			'readLevel' => Streams::$READ_LEVEL['max'],
			'writeLevel' => -1,
			'adminLevel' => -1
		));
		$access->save();
		$amount = $plan->getAttribute('amount', null);
		if (!is_numeric($amount)) {
			throw new Q_Exception_WrongValue(array(
				'field' => 'amount',
				'range' => 'an integer'
			));
		}
		$options['stream'] = $stream;
		if ($payments) {
			Assets::charge($payments, $amount, $currency, $options);
		}
		
		/**
		 * @event Assets/startSubscription {before}
		 * @param {Streams_Stream} plan
		 * @param {Streams_Stream} subscription
		 * @param {string} startDate
		 * @param {string} endDate
		 * @return {Users_User}
		 */
		Q::event('Assets/startSubscription', compact(
			'plan', 'user', 'publisher', 'stream', 'startDate', 'endDate', 'months', 'currency'
		), 'after');

		return $stream;
	}

	static function stopSubscription($stream, $options = array())
	{
		// call this if we learn that a subscription has stopped, so we mark it as inactive.
		// the customer could use the credit card info to start a new subscription.
		$stream->setAttribute('stopped', true);
		$stream->save();
	}

	static function checkPaid(& $stream, $user) {
		$communityId = $stream->getAttribute("communityId");
		$roles = Users::roles($communityId, array(Q::app()."/admins", "Calendars/admins"));

		// if current user is a publisher or participant of app/admins or Calendars/admin
		if ($stream->publisherId === $user->id || count($roles)) {
			return;
		}

		$payment = $stream->getAttribute('payment');
		if (!$payment || $payment['type'] !== 'required') {
			return;
		}
		$assets = new Assets_Charge();
		$assets->publisherId = $stream->publisherId;
		$assets->streamName = $stream->name;
		$assets->userId = $user->id;
		$assets = $assets->retrieve();
		if (!$assets) {
			throw new Q_Exception_PaymentRequired(array(
				'message'=> $stream->name,
			));
		}
	}
};
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

		$amount = number_format($amount, 2, '.', ',');

		return "$amount $code"; // TODO: make it fit the locale better
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
	static function formatted($amount, $format = "%=(n", $locale = null)
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
	 * @param {string} [$options.chargeId] Payment id to set as id field of Assets_Charge table, If this defined it means
	 * that payment already processed and hence no need to call $adapter->charge
 	 * @param {Users_User} [$options.user=Users::loggedInUser()] Allows us to set the user to charge
	 * @param {Streams_Stream} [$options.stream=null] if this charge is related to an Assets/product, Assets/service or Assets/subscription stream
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
		$communityId = Users::communityId();
		$chargeId = Q::ifset($options, "chargeId", null);
		$className = 'Assets_Payments_' . ucfirst($payments);

		/**
		 * @event Assets/charge {before}
		 * @param {Assets_Payments} adapter
		 * @param {array} options
		 */
		Q::event('Assets/charge', @compact('adapter', 'options'), 'before');

		// if charge id defined it means already paid, for example from webhook
		if ($chargeId) {
			$customerId = Q::ifset($options, "customerId", null);
		} else {
			$adapter = new $className((array)$options);
			$customerId = $adapter->charge($amount, $currency, $options);
		}

		$charge = new Assets_Charge();
		$charge->userId = $user->id;
		if ($chargeId) {
			$charge->id = $chargeId;
			// check if charge with this id already exists
			if ($charge->retrieve()) {
				return null;
			}
		}
		$charge->description = 'BoughtCredits';
		$attributes = array(
			"payments" => $payments,
			"customerId" => $customerId,
			"amount" => sprintf("%0.2f", $amount),
			"currency" => $currency,
			"communityId" => $communityId,
			"credits" =>  Assets_Credits::convert($amount, $currency, "credits")
		);
		$charge->attributes = Q::json_encode($attributes);
		$charge->save();

		/**
		 * @event Assets/charge {after}
		 * @param {Assets_charge} charge
		 * @param {Assets_Payments} adapter
		 * @param {array} options
		 */
		Q::event('Assets/charge', @compact(
			'payments', 'amount', 'currency', 'user', 'charge', 'options', 'adapter'
		), 'after');

		return $charge;
	}

	static function checkPaid(& $stream, $user) {
		$communityId = $stream->getAttribute("communityId");
		$allowed = Q_Config::expect('Assets', 'canCheckPaid');
		$roles = Users::roles($communityId, $allowed);

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

	/**
	 * 
	 * @method canPayForStreams
	 * @static
	 * @param {Streams_Stream} $stream
	 * @return {array} Array of array(publisherId, streamName) arrays
	 */
	static function canPayForStreams(Streams_Stream $stream)
	{
		$types = Q_Config::get('Assets', 'canPayForStreams', 'types', array());
		if (!$types || !$stream->inheritAccess) {
			return array();
		}
		$ia = Q::json_decode($stream->inheritAccess, true);
		$result = array();
		foreach ($ia as $pn) {
			list($publisherId, $streamName) = $pn;
			foreach ($types as $type) {
				if (Q::startsWith($streamName, $type.'/')) {
					$result[] = compact("publisherId", "streamName");
				}
			}
		}
		return $result;
	}

	static $columns = array();
	static $options = array();
	const PAYMENT_TO_USER = 'PaymentToUser';
	const JOINED_PAID_STREAM = 'JoinedPaidStream';
	const LEFT_PAID_STREAM = 'LeftPaidStream';
	const CREATED_COMMUNITY = 'CreaterCommunity';
};
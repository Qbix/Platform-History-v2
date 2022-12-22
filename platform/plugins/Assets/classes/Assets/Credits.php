<?php

/**
 * @module Assets
 */
/**
 * Class for manipulating credits
 * @class Assets_Credits
 */
class Assets_Credits extends Base_Assets_Credits
{
	const DEFAULT_AMOUNT = 0;

	/**
	 * @method getAllAttributes
	 * @return {array} The array of all attributes set in the stream
	 */
	function getAllAttributes()
	{
		return empty($this->attributes) ? array() : json_decode($this->attributes, true);
	}
	/**
	 * @method getAttribute
	 * @param {string} $attributeName The name of the attribute to get
	 * @param {mixed} $default The value to return if the attribute is missing
	 * @return {mixed} The value of the attribute, or the default value, or null
	 */
	function getAttribute($attributeName, $default = null)
	{
		$attr = $this->getAllAttributes();
		return isset($attr[$attributeName]) ? $attr[$attributeName] : $default;
	}
	/**
	 * @method setAttribute
	 * @param {string|array} $attributeName The name of the attribute to set,
	 *  or an array of $attributeName => $attributeValue pairs
	 * @param {mixed} $value The value to set the attribute to
	 * @return Assets_Credits
	 */
	function setAttribute($attributeName, $value = null)
	{
		$attr = $this->getAllAttributes();
		if (is_array($attributeName)) {
			foreach ($attributeName as $k => $v) {
				$attr[$k] = $v;
			}
		} else {
			$attr[$attributeName] = $value;
		}
		$this->attributes = Q::json_encode($attr);

		return $this;
	}
	/**
	 * Get the logged-in user's credits stream
	 * @method userStream
	 * @param {string} [$userId=null]
	 *   The id of the user for which the stream is obtained. Defaults to logged-in user.
	 * @param {string} [$asUserId=null]
	 *   The id of the user who is trying to obtain it. Defaults to logged-in user.
	 * @param {boolean} [$throwIfNotLoggedIn=false]
	 *   Whether to throw a Users_Exception_NotLoggedIn if no user is logged in.
	 * @return {Streams_Stream|null}
	 * @throws {Users_Exception_NotLoggedIn} If user is not logged in and
	 *   $throwIfNotLoggedIn is true
	 */
	static function userStream($userId = null, $asUserId = null, $throwIfNotLoggedIn = false)
	{
		if (!isset($userId)) {
			$user = Users::loggedInUser($throwIfNotLoggedIn, false);
			if (!$user) {
				return null;
			}
		} else {
			$user = Users_User::fetch($userId, true);
		}
		$userId = $user->id;
		$streamName = 'Assets/user/credits';
		$stream = Streams::fetchOneOrCreate($asUserId, $userId, $streamName, array(
			'subscribe' => true
		), $results);
		if ($results['created']) {
			$amount = Q_Config::get('Assets', 'credits', 'grant', 'Users/insertUser', self::DEFAULT_AMOUNT);
			if ($amount > 0) {
				self::grant($amount, 'YouHaveCreditsToStart', $userId, array(
					'communityId' => Users::communityId()
				));
			}
		}
		return $stream;
	}
	
	/**
	 * Amount of credits
	 * @method amount
	 * @static
	 * @param {string} [$userId = null] User which credits to return. Null = logged user.
	 * @return {string} The amount of credits
	 * @throws {Users_Exception_NotLoggedIn} If user is not logged in
	 */
	static function amount($userId = null)
	{
		$stream = self::userStream($userId, $userId);
		if ($stream instanceof Streams_Stream) {
			return (int)$stream->getAttribute('amount');
		}
		return 0;
	}
	/**
	 * Check if payment details amounts sum equal to general amount
	 * @method checkAmount
	 * @static
	 * @param {integer} $amount The amount of credits to spend.
	 * @param {array} [$more.items] an array of items, each with "amount" key, and perhaps other data
	 * @param {boolean} [$throwIfNotEqual=false]
	 * @throws {Exception} If not equal
	 */
	static function checkAmount ($amount, $items, $throwIfNotEqual = false) {
		if (!is_array($items)) {
			return true;
		}
		$checkSum = 0;
		foreach ($items as $item) {
			$checkSum += $item['amount'];
		}

		if ($amount != $checkSum) {
			if ($throwIfNotEqual) {
				throw new Q_Exception_WrongValue(array(
					'field' => 'amount',
					'range' => $checkSum
				));
			}
			return false;
		}
		return true;
	}
	/**
	 * Make a user spend credits. Use the $more array to send credits to a publisher of a stream, instead.
	 * @method spend
	 * @static
	 * @param {integer} $amount The amount of credits to spend.
	 * @param {string} $reason Identifies the reason for spending. Can't be null.
	 * @param {string} [$userId=null] User which is spendings the credits. Defaults to logged-in user.
	 * @param {array} [$more] An array supplying more info, including
	 * @param {string} [$more.toPublisherId] The publisher of the valuable stream for which payment is being made
	 * @param {string} [$more.toStreamName] The name of the valuable stream for which payment is being made
	 * @param {array} [$more.items] an array of items, each with "publisherId", "streamName" and "amount"
	 * @throws {Users_Exception_NotLoggedIn} If user is not logged in
	 */
	static function spend($amount, $reason, $userId = null, $more = array())
	{
		$amount = (int)$amount;
		if ($amount <= 0) {
			throw new Q_Exception_WrongType(array(
				'field' => 'amount',
				'type' => 'positive integer'
			));
		}

		if (empty($reason)) {
			throw new Q_Exception_RequiredField(array('field' => 'reason'));
		}

		$userId = Q::ifset($userId, Users::loggedInUser(true)->id);

		$toPublisherId = Q::ifset($more, "toPublisherId", null);
		$toStreamName = Q::ifset($more, "toStreamName", null);
		$items = Q::ifset($more, "items", null);

		// make sure the amount is consistent
		self::checkAmount($amount, $items, true);

		// if user spend credits to stream, make it send credits to stream publisher
		if ($toPublisherId && $toStreamName) {
			self::transfer($amount, $reason, $toPublisherId, $userId, $more);

			/**
			 * @event Assets/credits/spend {after}
			 */
			Q::event('Assets/credits/spent', @compact(
				'toPublisherId', 'toStreamName', 'amount', 'userId'
			), 'after');

			return;
		}

		$stream = self::userStream($userId, $userId);
		$existing_amount = $stream->getAttribute('amount');
		if ($existing_amount < $amount) {
			throw new Assets_Exception_NotEnoughCredits(array(
				'missing' => $amount - $existing_amount
			));
		}

		if (is_array($items)) {
			foreach ($items as $item) {
				$more['fromPublisherId'] = $item['publisherId'];
				$more['fromStreamName'] = $item['streamName'];
				$assets_credits = self::createRow($item['amount'], $reason, null, $userId, $more);
			}
		} else {
			$assets_credits = self::createRow($amount, $reason, null, $userId, $more);
		}

		// decrease credits only after credit rows created
		$stream->setAttribute('amount', $existing_amount - $amount);
		$stream->changed();

		$more['amount'] = $amount;
		$more['toStreamTitle'] = $assets_credits->getAttribute("toStreamTitle");
		$more['fromStreamTitle'] = $assets_credits->getAttribute("fromStreamTitle");
		$more['toUserId'] = $toPublisherId;
		$more['items'] = $items;

		$instructions_json = Q::json_encode(array_merge(
			array(
				'app' => Q::app(),
				'operation' => '-',
				'reason' => self::reasonToText($reason, $more)
			),
			$more
		));

		$text = Q_Text::get('Assets/content');
		$type = 'Assets/credits/spent';
		$content = Q::ifset($text, 'messages', $type, 'content', "Spent {{amount}} credits");
		$stream->post($userId, array(
			'type' => $type,
			'content' => $content,
			'byClientId' => Q::ifset($more, 'publisherId', null),
			'instructions' => $instructions_json
		));
	}
	/**
	 * Grant credits to a user
	 * @method grant
	 * @static
	 * @param {integer} $amount The amount of credits to grant.
	 * @param {string} $reason Identifies the reason for granting the credits. Can't be null.
	 * @param {string} [$userId=null] User who is granted the credits. Null = logged user.
	 * @param {array} [$more=array()] An array supplying more optional info, including
	 * @param {string} [$more.publisherId] The publisher of the stream representing the purchase
	 * @param {string} [$more.streamName] The name of the stream representing the purchase
	 * @param {string} [$more.fromUserId=Q::app()] Consider passing Users::communityId() here instead
	 * @throws
	 */
	static function grant($amount, $reason, $userId = null, $more = array())
	{
		$amount = (int)$amount;
		if ($amount <= 0) {
			throw new Q_Exception_WrongType(array(
				'field' => 'amount',
				'type' => 'integer'
			));
		}

		$more['amount'] = $amount;

		if (empty($reason)) {
			throw new Q_Exception_RequiredField(array('field' => 'reason'));
		}

		if (empty($userId)) {
			$userId = Users::loggedInUser(true)->id;
		}

		$stream = self::userStream($userId, $userId);
		$stream->setAttribute('amount', $stream->getAttribute('amount') + $amount);
		$stream->changed(Users::currentCommunityId(true));

		$fromUserId = Q::ifset($more, 'fromUserId', Q::app());

		$assets_credits = self::createRow($amount, $reason, $userId, $fromUserId, $more);
		$more = self::fillInstructions($assets_credits, $more);

		// Post that this user granted $amount credits by $reason
		$text = Q_Text::get('Assets/content');
		$instructions = array(
			'app' => Q::app(),
			'operation' => '+',
			'amount' => $amount
		);
		if ($reason == 'BoughtCredits') {
			$type = 'Assets/credits/bought';
			$instructions['charge'] = $more["charge"];
			$instructions['token'] = $more["token"];
		} elseif ($reason == 'BonusCredits') {
			$type = 'Assets/credits/bonus';
		} else {
			$type = 'Assets/credits/granted';
			$instructions = array_merge($instructions, $more);
			$instructions['reason'] = self::reasonToText($reason, $more);
		}

		$content = Q::ifset($text, 'messages', $type, "content", "Granted {{amount}} credits");
		$stream->post($userId, array(
			'type' => $type,
			'content' => Q::interpolate($content, @compact('amount')),
			'byClientId' => Q::ifset($more, 'publisherId', null),
			'instructions' => Q::json_encode($instructions)
		));

		// check Assets/credits/bonus
		if ($reason == 'BoughtCredits') {
			self::payBonus($amount, $userId);
		}
	}
	
	/**
	 * Transfer credits, as the logged-in user, to another user
	 * @method transfer
	 * @static
	 * @param {integer} $amount The amount of credits to transfer.
	 * @param {string} $toUserId The id of the user to whom you will transfer the credits
	 * @param {string} $reason Identifies the reason for transfer. Can't be null.
	 * @param {string} [$fromUserId=null] null = logged user
	 * @param {array} [$more] An array supplying more information
	 * @param {array} [$more.items] an array of items, each with "publisherId", "streamName" and "amount"
	 * @param {array} [$more.forcePayment=false] If true and not enough credits, try to charge credits
	 */
	static function transfer($amount, $reason, $toUserId, $fromUserId = null, $more = array())
	{
		$amount = (int)$amount;
		if ($amount <= 0) {
			throw new Q_Exception_WrongType(array(
				'field' => 'amount',
				'type' => 'integer'
			));
		}

		if (empty($reason)) {
			throw new Q_Exception_RequiredField(array('field' => 'reason'));
		}

		$fromUserId = Q::ifset($fromUserId, Users::loggedInUser(true)->id);

		if ($toUserId == $fromUserId) {
			throw new Q_Exception_WrongValue(array('field' => 'fromUserId', 'range' => 'you can\'t transfer to yourself'));
		}

		$more['amount'] = $amount;

		$payments = Q::ifset($more, "payments", "stripe");
		$from_stream = self::userStream($fromUserId, $fromUserId);
		$existing_amount = $from_stream->getAttribute('amount');
		if ($existing_amount < $amount) {
			// if forcePayment true, try to change funds for credits
			if (Q::ifset($more, "forcePayment", false)) {
				try {
					Assets::charge($payments, Assets_Credits::convert($amount, "credits", "USD"));
				} catch (Exception $e) {

				}

				// if charge success, turn off forcePayment and try again
				$more["forcePayment"] = false;
				return self::transfer($amount, $reason, $toUserId, $fromUserId, $more);
			}

			throw new Assets_Exception_NotEnoughCredits(array(
				'missing' => $amount - $existing_amount
			));
		}

		$items = Q::ifset($more, "items", null);

		// make sure the amount is consistent
		self::checkAmount($amount, $items, true);

		if (is_array($items)) {
			foreach ($items as $item) {
				$more['fromPublisherId'] = $item['publisherId'];
				$more['fromStreamName'] = $item['streamName'];
				$assets_credits = self::createRow($item['amount'], $reason, $toUserId, $fromUserId, $more);
			}
		} else {
			$assets_credits = self::createRow($amount, $reason, $toUserId, $fromUserId, $more);
		}

		// decrease credits only after credits rows created
		$from_stream->setAttribute('amount', $existing_amount - $amount);
		$from_stream->changed();

		$more = self::fillInstructions($assets_credits, $more);

		$instructions = array_merge(
			array(
				'app' => Q::app(),
				'reason' => self::reasonToText($reason, $more)
			),
			$more
		);

		$instructions['operation'] = '-';
		$text = Q_Text::get('Assets/content');
		$type = 'Assets/credits/sent';
		$content = Q::ifset($text, 'messages', $type, 'content', "Sent {{amount}} credits");
		$from_stream->post($fromUserId, array(
			'type' => $type,
			'byClientId' => $toUserId,
			'content' => Q::interpolate($content, $more),
			'instructions' => Q::json_encode($instructions)
		));
		
		// TODO: add journaling system
		// Because if the following fails, then someone will lose credits
		// without the other person getting them. For now we will rely on the user complaining.
		$to_stream = self::userStream($toUserId, $toUserId, true);
		$to_stream->setAttribute('amount', $to_stream->getAttribute('amount') + $amount);
		$to_stream->changed();
		$instructions['operation'] = '+';
		$text = Q_Text::get('Assets/content');
		$type = 'Assets/credits/received';
		$content = Q::ifset($text, 'messages', $type, 'content', "Received {{amount}} credits");
		$to_stream->post($toUserId, array(
			'type' => $type,
			'byClientId' => $fromUserId,
			'content' => Q::interpolate($content, $more),
			'instructions' => Q::json_encode($instructions)
		));
	}
	/**
	 * Fill message instructions with needed info
	 * @method fillInstructions
	 * @static
	 * @param {Assets_Credits} $assetsCredits Assets credits row.
	 * @param {array} [$more=array()] Predefined instructions array.
	 * @return {Array}
	 */
	private static function fillInstructions ($assetsCredits, $more = array()) {
		$more['messageId'] = $assetsCredits->id;
		$more['toStreamTitle'] = $assetsCredits->getAttribute("toStreamTitle");
		$more['fromStreamTitle'] = $assetsCredits->getAttribute("fromStreamTitle");
		$more['toUserId'] = $assetsCredits->toUserId;
		$more['fromUserId'] = $assetsCredits->fromUserId;
		$more['fromPublisherId'] = $assetsCredits->fromPublisherId;
		$more['fromUserName'] = $assetsCredits->getAttribute("fromUserName");
		$more['fromStreamName'] = $assetsCredits->fromStreamName;
		$more['toPublisherId'] = $assetsCredits->toPublisherId;
		$more['toUserName'] = $assetsCredits->getAttribute("toUserName");
		$more['toStreamName'] = $assetsCredits->toStreamName;

		return $more;
	}
	/**
	 * Create row in Assets_Credits table
	 * @method createRow
	 * @static
	 * @param {int} $amount Amount of credits. Required,
	 * @param {string} $reason Identifies the reason for the transfer. Required.
	 * @param {string} $toUserId User id who gets the credits.
	 * @param {string} $fromUserId User id who transfer the credits.
	 * @param {array} [$more] An array supplying more optional info, including things like
	 * @param {string} [$more.toPublisherId] The publisher of the value-producing stream for which the payment is made
	 * @param {string} [$more.toStreamName] The name of the stream value-producing for which the payment is made
	 * @param {string} [$more.fromPublisherId] The publisher of the value-consuming stream on whose behalf the payment is made
	 * @param {string} [$more.fromStreamName] The name of the value-consuming stream on whose behalf the payment is made
	 * @return {Assets_Credits} Assets_Credits row
	 */
	private static function createRow ($amount, $reason, $toUserId = null, $fromUserId = null, $more = array()) {
		$toPublisherId = null;
		$toStreamName = null;
		$fromPublisherId = null;
		$fromStreamName = null;
		if (Q::ifset($more, "toPublisherId", null)) {
			$toPublisherId = $more['toPublisherId'];
		}
		if (Q::ifset($more, "toStreamName", null)) {
			$toStreamName = $more['toStreamName'];
		}
		if (Q::ifset($more, "fromPublisherId", null)) {
			$fromPublisherId = $more['fromPublisherId'];
		}
		if (Q::ifset($more, "fromStreamName", null)) {
			$fromStreamName = $more['fromStreamName'];
		}

		unset($more['fromPublisherId']);
		unset($more['fromStreamName']);
		unset($more['toPublisherId']);
		unset($more['toStreamName']);

		if ($toPublisherId && $toStreamName) {
			$more['toStreamTitle'] = Streams_Stream::fetch($toPublisherId, $toPublisherId, $toStreamName)->title;
			$more['toUserName'] = Streams::displayName($toPublisherId);
		}

		if ($fromPublisherId && $fromStreamName) {
			$more['fromStreamTitle'] = Streams_Stream::fetch($fromPublisherId, $fromPublisherId, $fromStreamName, true)->title;
			$more['fromUserName'] = Streams::displayName($fromPublisherId);
		}

		$assets_credits = new Assets_Credits();
		$assets_credits->id = uniqid();
		$assets_credits->fromUserId = $fromUserId;
		$assets_credits->toUserId = $toUserId;
		$assets_credits->toPublisherId = $toPublisherId;
		$assets_credits->toStreamName = $toStreamName;
		$assets_credits->fromPublisherId = $fromPublisherId;
		$assets_credits->fromStreamName = $fromStreamName;
		$assets_credits->reason = $reason;
		$assets_credits->credits = $amount;
		$assets_credits->attributes = Q::json_encode($more);
		$assets_credits->save();

		return $assets_credits;
	}
	/**
	 * Convert amount from one currency to another
	 * @method convert
	 * @static
	 * @param {number} $amount
	 * @param {string} $fromCurrency
	 * @param {string} $toCurrency
	 * @return {string}
	 */
	static function convert($amount, $fromCurrency, $toCurrency)
	{
		$amount = (float)$amount;
		if ($fromCurrency == $toCurrency) {
			return $amount;
		} elseif ($fromCurrency == "credits") {
			$rate = Q_Config::expect('Assets', 'credits', 'exchange', $toCurrency);
			$amount = ceil($amount / $rate);
		} else {
			$rate = Q_Config::expect('Assets', 'credits', 'exchange', $fromCurrency);
			$amount = ceil($amount * $rate);
		}

		return $amount;
	}
	/**
	 * Convert reason to readable text.
	 * @method reasonToText
	 * @static
	 * @param {string} $key json key to search in Assets/content/credits.
	 * @param {array} $more additional data needed to interpolate json with.
	 * @return {string}
	 */
	static function reasonToText($key, $more = array())
	{
		$texts = Q_Text::get('Assets/content');
		$text = Q::ifset($texts, 'credits', $key, null);

		if ($text && $more) {
			$text = Q::interpolate($text, $more);
		}

		return $text;
	}
	/**
	 * Check if user paid to join some stream.
	 * @method checkJoinPaid
	 * @static
	 * @param {string} $userId user tested paid stream
	 * @param {Streams_Stream|array} $toStream Stream or array('publisherId' => ..., 'streamName' => ...)
	 * @param {Streams_Stream|array} [$fromStream] Stream or array('publisherId' => ..., 'streamName' => ...)
	 * @throws
	 * @return {Boolean|Object}
	 */
	static function checkJoinPaid($userId, $toStream, $fromStream = null)
	{
		if (is_array($toStream)) {
			$toPublisherId = $toStream['publisherId'];
			$toStreamName = $toStream['streamName'];
		} elseif ($toStream instanceof Streams_Stream) {
			$toPublisherId = $toStream->publisherId;
			$toStreamName = $toStream->name;
		} else {
			throw new Q_Exception_WrongValue(array(
				'field' => 'stream',
				'range' => 'array or Streams_Stream'
			));
		}

		$fromPublisherId = null;
		$fromStreamName = null;
		if (is_array($fromStream)) {
			$fromPublisherId = $fromStream['publisherId'];
			$fromStreamName = $fromStream['streamName'];
		} elseif ($fromStream instanceof Streams_Stream) {
			$fromPublisherId = $fromStream->publisherId;
			$fromStreamName = $fromStream->name;
		}

		$joined_assets_credits = Assets_Credits::select()
		->where(array(
			'fromUserId' => $userId,
			'toPublisherId' => $toPublisherId,
			'toStreamName' => $toStreamName,
			'fromPublisherId' => $fromPublisherId,
			'fromStreamName' => $fromStreamName,
			'reason' => 'JoinedPaidStream'
		))
		->ignoreCache()
		->options(array("dontCache" => true))
		->orderBy('insertedTime', false)
		->limit(1)
		->fetchDbRow();

		if ($joined_assets_credits) {
			$left_assets_credits = Assets_Credits::select()
			->where(array(
				'toUserId' => $userId,
				'toPublisherId' => $toPublisherId,
				'toStreamName' => $toStreamName,
				'fromPublisherId' => $fromPublisherId,
				'fromStreamName' => $fromStreamName,
				'reason' => 'LeftPaidStream'
			))
			->ignoreCache()
			->options(array("dontCache" => true))
			->orderBy('insertedTime', false)
			->limit(1)
			->fetchDbRow();

			if ($left_assets_credits && $left_assets_credits->insertedTime > $joined_assets_credits->insertedTime) {
				return false;
			}

			return $joined_assets_credits;
		}

		return false;
	}

	/**
	 * Pay bonus to user if credits amount
	 * @method payBonus
	 * @static
	 * @param {string|number} $amount Amount of credits to pay bonus from
	 * @param {string} [$userId] User id to pay bonus. If empty - logged in user.
	 */
	static function payBonus ($amount, $userId=null) {
		$amount = (int)$amount;

		if (!$userId) {
			$userId = Users::loggedInUser(true)->id;
		}

		$bonuses = Q_Config::get("Assets", "credits", "bonus", "bought", null);
		if (!is_array($bonuses) || empty($bonuses)) {
			return;
		}

		krsort($bonuses, SORT_NUMERIC);
		foreach ($bonuses as $key => $bonus) {
			if ($amount >= $key) {
				self::grant($bonus, "BonusCredits", $userId);
				return;
			}
		}
	}
};
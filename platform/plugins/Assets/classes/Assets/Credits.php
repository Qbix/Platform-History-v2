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
	const DEFAULT_AMOUNT = 20;
	
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
			$user = Users::loggedInUser($throwIfNotLoggedIn);
			if (!$user) {
				return null;
			}
		} else {
			$user = Users_User::fetch($userId, true);
		}
		$userId = $user->id;
		$streamName = 'Assets/user/credits';
		$stream = Streams::fetchOne($asUserId, $userId, $streamName);
		if (!$stream) {
			$stream = Streams::create($userId, $userId, 'Assets/credits', array(
				'name' => 'Assets/user/credits',
				'title' => "Credits",
				'icon' => '{{Assets}}/img/credits.png',
				'content' => '',
				'attributes' => Q::json_encode(array('amount' => 0))
			));

			$amount = Q_Config::get('Assets', 'credits', 'amounts', 'Users/insertUser', self::DEFAULT_AMOUNT);
			self::earn($amount, 'YouHaveCreditsToStart', $userId, array(
				'publisherId' => Users::communityId()
			));
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
	 * Spend credits
	 * @method spend
	 * @static
	 * @param {integer} $amount The amount of credits to spend.
	 * @param {string} $reason Identifies the reason for spending. Can't be null.
	 * @param {string} [$userId=null] User which spend credits. Null = logged user.
	 * @param {array} $more An array supplying more info, including
	 * @param {string} [$more.publisherId] The publisher of the stream representing the purchase
	 * @param {string} [$more.streamName] The name of the stream representing the purchase
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

		$publisherId = Q::ifset($more, "publisherId", null);
		$streamName = Q::ifset($more, "streamName", null);

		// if user spend credits to stream, make it send credits to stream publisher
		if ($publisherId && $streamName) {
			self::send($amount, $reason, $publisherId, $userId, $more);
			return;
		}

		$stream = self::userStream($userId, $userId);
		$existing_amount = $stream->getAttribute('amount');
		if ($existing_amount < $amount) {
			throw new Assets_Exception_NotEnoughCredits(array(
				'missing' => $amount - $existing_amount
			));
		}
		$stream->setAttribute('amount', $existing_amount - $amount);
		$stream->changed();

		// add row to assets_credits
		$assets_credits = new Assets_Credits();
		$assets_credits->id = uniqid();
		$assets_credits->fromUserId = $userId;
		$assets_credits->reason = $reason;
		$assets_credits->credits = $amount;
		$assets_credits->attributes = Q::json_encode($more);
		$assets_credits->save();

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
	 * Earn credits
	 * @method earn
	 * @static
	 * @param {integer} $amount The amount of credits to earn.
	 * @param {string} [$userId=null] User which earn. Null = logged user.
	 * @param {array} $more An array supplying more info, including
	 * @param {string} $reason Identifies the reason for earn. Can't be null.
	 * @param {string} [$more.publisherId] The publisher of the stream representing the purchase
	 * @param {string} [$more.streamName] The name of the stream representing the purchase
	 * @throws
	 */
	static function earn($amount, $reason, $userId = null, $more = array())
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
		$stream->changed();

		// add row to assets_credits
		$assets_credits = new Assets_Credits();
		$assets_credits->id = uniqid();
		$assets_credits->toUserId = $userId;
		$assets_credits->reason = $reason;
		$assets_credits->credits = $amount;
		$assets_credits->attributes = Q::json_encode($more);
		$assets_credits->save();

		// Post that this user earned $amount credits by $reason
		$text = Q_Text::get('Assets/content');
		$type = 'Assets/credits/earned';
		$content = Q::ifset($text, 'messages', $type, "content", "Earned {{amount}} credits");
		$stream->post($userId, array(
			'type' => $type,
			'content' => Q::interpolate($content, compact('amount')),
			'byClientId' => Q::ifset($more, 'publisherId', null),
			'instructions' => Q::json_encode(array_merge(
				array(
					'app' => Q::app(),
					'operation' => '+',
					'amount' => $amount,
					'reason' => self::reasonToText($reason, $more)
				),
				$more
			))
		));
	}
	
	/**
	 * Send credits, as the logged-in user, to another user
	 * @method send
	 * @static
	 * @param {integer} $amount The amount of credits to send.
	 * @param {string} $toUserId The id of the user to whom you will send the credits
	 * @param {string} $reason Identifies the reason for send. Can't be null.
	 * @param {string} [$fromUserId=null] null = logged user
	 * @param {array} $more An array supplying more info
	 */
	static function send($amount, $reason, $toUserId, $fromUserId = null, $more = array())
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
			throw new Q_Exception_WrongValue(array('field' => 'fromUserId', 'range' => 'you can\'t send to yourself'));
		}

		$from_stream = self::userStream($fromUserId, $fromUserId);
		$existing_amount = $from_stream->getAttribute('amount');
		if ($existing_amount < $amount) {
			throw new Assets_Exception_NotEnoughCredits(array(
				'missing' => $amount - $existing_amount
			));
		}
		
		$from_stream->setAttribute('amount', $existing_amount - $amount);
		$from_stream->changed();

		$publisherId = Q::ifset($more, "publisherId", null);
		$streamName = Q::ifset($more, "streamName", null);
		if ($publisherId && $streamName) {
			$more['streamTitle'] = Streams::fetchOne($publisherId, $publisherId, $streamName)->title;
		} elseif ($toUserId) {
			$more['userName'] = Users::fetch($toUserId, true)->displayName();
		}

		// add row to assets_credits
		$assets_credits = new Assets_Credits();
		$assets_credits->id = uniqid();
		$assets_credits->fromUserId = $fromUserId;
		$assets_credits->toUserId = $toUserId;
		$assets_credits->publisherId = $publisherId;
		$assets_credits->streamName = $streamName;
		$assets_credits->reason = $reason;
		$assets_credits->credits = $amount;
		$assets_credits->attributes = Q::json_encode($more);
		$assets_credits->save();

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
			'content' => Q::interpolate($content, compact("amount")),
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
			'content' => Q::interpolate($content, compact("amount")),
			'instructions' => Q::json_encode($instructions)
		));
	}
	/**
	 * Convert reason to readable text.
	 * @method reasonToText
	 * @static
	 * @param {string} $key json key to search in Assets/content/credits.
	 * @param {array} $more additional data need to interpolate json with.
	 * @return {string}
	 */
	static function convertToCredits($amount, $currency)
	{
		$rate = Q_Config::expect('Assets', 'credits', 'exchange', $currency);
		$credits = $amount * $rate;

		return $credits;
	}
	/**
	 * Convert reason to readable text.
	 * @method reasonToText
	 * @static
	 * @param {string} $key json key to search in Assets/content/credits.
	 * @param {array} $more additional data need to interpolate json with.
	 * @return {string}
	 */
	static function reasonToText($key, $more = array())
	{
		$tests = Q_Text::get('Assets/content');
		$text = Q::ifset($tests, 'credits', $key, null);

		if ($text && $more) {
			$text = Q::interpolate($text, $more);
		}

		return $text;
	}
	/**
	 * Check if user paid for some stream.
	 * @method checkPaid
	 * @static
	 * @param {string} $userId user tested paid stream
	 * @param {Streams_Stream|array} $stream Stream or array('publisherId' => ..., 'streamName' => ...)
	 * @throws
	 * @return {Boolean|Object}
	 */
	static function checkPaid($userId, $stream)
	{
		if (is_array($stream)) {
			$publisherId = $stream['publisherId'];
			$streamName = $stream['streamName'];
		} elseif ($stream instanceof Streams_Stream) {
			$publisherId = $stream->publisherId;
			$streamName = $stream->name;
		} else {
			throw new Q_Exception_WrongValue(array(
				'field' => 'stream',
				'range' => 'array or Streams_Stream'
			));
		}

		$joined_assets_credits = Assets_Credits::select()
		->where(array(
			'fromUserId' => $userId,
			'publisherId' => $publisherId,
			'streamName' => $streamName,
			'reason' => 'JoinPaidStream'
		))
		->orderBy('insertedTime', false)
		->limit(1)
		->fetchDbRow();

		if ($joined_assets_credits) {
			$left_assets_credits = Assets_Credits::select()
			->where(array(
				'toUserId' => $userId,
				'publisherId' => $publisherId,
				'streamName' => $streamName,
				'reason' => 'LeftPaidStream'
			))
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
};
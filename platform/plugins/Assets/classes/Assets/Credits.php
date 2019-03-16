<?php

/**
 * @module Assets
 */
/**
 * Class for manipulating credits
 * @class Assets_Credits
 */
class Assets_Credits
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
			$amount = Q_Config::get(
				'Assets', 'credits', 'amounts', 'Users/insertUser', self::DEFAULT_AMOUNT
			);
			$stream = Streams::create($userId, $userId, 'Assets/credits', array(
				'name' => 'Assets/user/credits',
				'title' => "Credits",
				'icon' => '{{Assets}}/img/credits.png',
				'content' => '',
				'attributes' => Q::json_encode(compact('amount'))
			));
		}
		return $stream;
	}
	
	/**
	 * Amount of credits for logged-in user
	 * @method amount
	 * @static
	 * @return {string} The amount of credits
	 * @throws {Users_Exception_NotLoggedIn} If user is not logged in
	 */
	static function amount()
	{
		return self::userStream(null, null, true)->getAttribute('amount');
	}
	
	/**
	 * Spend credits as the logged-in user
	 * @method spend
	 * @static
	 * @param {integer} $amount The amount of credits to spend.
	 * @param {array} $more An array supplying more info, including
	 * @param {string} [$more.reason] Identifies the reason for spending, if any
	 * @param {string} [$more.publisherId] The publisher of the stream representing the purchase
	 * @param {string} [$more.streamName] The name of the stream representing the purchase
	 * @throws {Users_Exception_NotLoggedIn} If user is not logged in
	 */
	static function spend($amount, $more = array())
	{
		if (!is_int($amount) or $amount <= 0) {
			throw new Q_Exception_WrongType(array(
				'field' => 'amount',
				'type' => 'positive integer'
			));
		}
		$stream = self::userStream(null, null, true);
		$existing_amount = $stream->getAttribute('amount');
		if ($existing_amount < $amount) {
			throw new Assets_Exception_NotEnoughCredits(array(
				'missing' => $amount - $existing_amount
			));
		}
		$stream->setAttribute('amount', $stream->getAttribute('amount') - $amount);
		$stream->save();
		
		$instructions_json = Q::json_encode(array_merge(
			array('app' => Q::app()),
			$more
		));
		$stream->post($user->id, array(
			'type' => 'Assets/credits/spent',
			'content' => $amount,
			'instructions' => $instructions_json
		));
	}
	
	/**
	 * Earn credits as the logged-in user
	 * @method earn
	 * @static
	 * @param {integer} $amount The amount of credits to earn.
	 * @param {string} $reason Identifies the reason you earned them.
	 */
	static function earn($amount, $reason = 'Assets/purchased')
	{
		if (!is_int($amount) or $amount <= 0) {
			throw new Q_Exception_WrongType(array(
				'field' => 'amount',
				'type' => 'integer'
			));
		}
		$stream = self::userStream(null, null, true);
		$stream->setAttribute('amount', $stream->getAttribute('amount') + $amount);
		$stream->save();
		
		// Post that this user earned $amount credits by $reason
		$app = Q::app();
		$stream->post($user->id, array(
			'type' => 'Assets/credits/earned',
			'content' => $amount,
			'instructions' => Q::json_encode(compact('app', 'reason'))
		));
	}
	
	/**
	 * Send credits, as the logged-in user, to another user
	 * @method send
	 * @static
	 * @param {integer} $amount The amount of credits to send.
	 * @param {string} $toUserId The id of the user to whom you will send the credits
	 * @param {array} $more An array supplying more info, including
 	 *  "reason" => Identifies the reason for sending, if any
	 */
	static function send($amount, $toUserId, $more = array())
	{
		if (!is_int($amount) or $amount <= 0) {
			throw new Q_Exception_WrongType(array(
				'field' => 'amount',
				'type' => 'integer'
			));
		}
		$instructions_json = Q::json_encode(array_merge(
			array('app' => Q::app()),
			$more
		));
		$from_stream = self::userStream(null, null, true);
		$existing_amount = $from_stream->getAttribute('amount');
		if ($existing_amount < $amount) {
			throw new Assets_Exception_NotEnoughCredits(array(
				'missing' => $amount - $existing_amount
			));
		}
		
		$from_stream->setAttribute('amount', $from_stream->getAttribute('amount') - $amount);
		$from_stream->save();
		$from_stream->post($user->id, array(
			'type' => 'Assets/credits/sent',
			'content' => $amount,
			'instructions' => $instructions_json
		));
		
		// TODO: add journaling system
		// Because if the following fails, then someone will lose credits
		// without the other person getting them. For now we will rely on the user complaining.
		$to_stream = self::userStream($toUserId, $toUserId, true);
		$to_stream->setAttribute('amount', $to_stream->getAttribute('amount') + $amount);
		$to_stream->save();
		$to_stream->post($user->id, array(
			'type' => 'Assets/credits/received',
			'content' => $amount,
			'instructions' => $instructions_json
		));
	}
};
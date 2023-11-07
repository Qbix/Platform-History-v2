<?php
/**
 * Assets model
 * @module Assets
 * @main Assets
 */
/**
 * Static methods for the Assets_Subscription
 * @class Assets_Subscription
 */

abstract class Assets_Subscription
{
	public static $streamType = "Assets/subscription";
	public static $relationType = "Assets/subscription/related";

	/**
	 * Starts a recurring subscription
	 * @method start
	 * @static
	 * @param {Streams_Stream|array} $plan - The subscription plan stream or array with "publisherId", "streamName".
	 * @param {Users_User|String} [$user] - User or user id. If null - logged in user.
 	 * @param {Users_User} [$options.user=Users::loggedInUser()] Allows us to set the user to subscribe
	 * @return {Streams_Stream} A stream of type 'Assets/subscription' representing this subscription
	 * @param {array} [$options=array()] - Options for the subscription
	 */
	static function start($plan, $user=null, $options=array())
	{
		if (!($plan instanceof Streams_Stream)) {
			$plan = Streams::fetchOne(null, $plan["publisherId"], $plan["streamName"], true);
		}

		if (empty($user)) {
			$user = Users::loggedInUser(true);
		} elseif (gettype($user) == "string") {
			$user = Users::fetch($user, true);
		}

		$currency = $plan->getAttribute("currency", "USD");
		
		$stream = self::getStream($plan, $user);

		if (!$stream) {
			$attributes = Q::json_encode(array(
				'planPublisherId' => $plan->publisherId,
				'planStreamName' => $plan->name,
				'period' => $plan->getAttribute("period"),
				'amount' => $plan->getAttribute('amount'), // lock it in, in case plan changes later
				'currency' => $currency
			));
			$stream = Streams::create($user->id, $user->id, self::$streamType,
				array(
					'title' => $plan->title,
					'attributes' => $attributes,
					'skipAccess' => true
				),
				array(
					'publisherId' => $plan->publisherId,
					'streamName' => $plan->name,
					'type' => self::$streamType
				)
			);

		}

		$stream->setAttribute('stopped', false);
		$stream->setAttribute('lastChargeTime', time());
		$stream->changed();

		/**
		 * @event Assets/startSubscription {before}
		 * @param {Streams_Stream} plan
		 * @param {Streams_Stream} subscription
		 * @return {Users_User}
		 */
		Q::event('Assets/startSubscription', @compact('plan', 'user', 'publisher', 'stream', 'months', 'currency'), 'after');

		return $stream;
	}

	/**
	 * Stops a recurring subscription
	 * @method stop
	 * @static
	 * @param {Streams_Stream} $stream
	 */
	static function stop($stream)
	{
		// call this if we learn that a subscription has stopped, so we mark it as inactive.
		// the customer could use the credit card info to start a new subscription.
		$stream->setAttribute('stopped', true);
		$stream->changed();
	}

	/**
	 * Check if subscription stopped
	 * @method isStopped
	 * @static
	 * @param {Streams_Stream} $stream
	 */
	static function isStopped($stream)
	{
		return $stream->getAttribute('stopped');
	}

	/**
	 * Gets the plan stream from subscription stream
	 * @method getPlan
	 * @param {Streams_Stream} $stream The subscription stream
	 * @return {Streams_Stream}
	 * @throws {Q_Exception_MissingRow} If the stream is missing
	 */
	static function getPlan($subscriptionStream)
	{
		return Streams::fetchOne(
			null,
			$subscriptionStream->getAttribute('planPublisherId'),
			$subscriptionStream->getAttribute('planStreamName'),
			true
		);
	}

	/**
	 * Get users subscription stream by subscription plan
	 * @method getStream
	 * @static
	 * @param {array|Streams_Stream} $plan - The subscription plan stream. Can be array with "publisherId", "streamsName" indexes.
	 * @param {String|Users_User} [$user] - User or user id. Null - means currently logged in user.
	 */
	static function getStream ($plan, $user=null) {
		if (!($plan instanceof Streams_Stream)) {
			$plan = Streams::fetchOne(null, $plan["publisherId"], $plan["streamName"], true);
		}

		if (empty($user)) {
			$user = Users::loggedInUser(true);
		}

		$relation = Streams_RelatedTo::select("srt.*, ss.*", "srt")->where(array(
			'srt.toPublisherId' => $plan->publisherId,
			'srt.toStreamName' => $plan->name,
			'srt.type' => self::$streamType,
			'srt.fromPublisherId' => $user->id,
			'ss.type' => self::$streamType
		))->join(Streams_Stream::table(true, "ss"), array(
			"srt.fromPublisherId" => "ss.publisherId",
			"srt.fromStreamName" => "ss.name"
		), "LEFT")->fetchDbRow();

		if ($relation) {
			return Streams::fetchOne($relation->fromPublisherId, $relation->fromPublisherId, $relation->fromStreamName, true);
		}

		return null;
	}

	/**
	 * Check if user subscribed to plan
	 * @method isSubscribed
	 * @static
	 * @param {array|Streams_Stream} $plan - The subscription plan stream. Can be array with "publisherId", "streamsName" indexes.
	 * @param {String|Users_User} [$user] - User or user id. Null - means currently logged in user.
	 */
	static function isSubscribed ($plan, $user=null) {
		if (!($plan instanceof Streams_Stream)) {
			$plan = Streams::fetchOne(null, $plan["publisherId"], $plan["streamName"], true);
		}

		if (empty($user)) {
			$user = Users::loggedInUser(true);
		}

		$subscriptionStream = self::getStream($plan, $user);
		if (!($subscriptionStream instanceof Streams_Stream)) {
			return false;
		}

		if (!self::isCurrent($subscriptionStream)) {
			return false;
		}

		return true;
	}

	/**
	 * Check if subscription is currently valid
	 * @method isCurrent
	 * @param {Streams_Stream} $stream The subscription stream
	 * @return {boolean}
	 */
	static function isCurrent($stream)
	{
		$lastChargeTime = $stream->getAttribute('lastChargeTime');
		if (!$lastChargeTime) {
			return false;
		}
		$plan = self::getPlan($stream);
		$time = time();
		$period = $plan->getAttribute('period', null);
		switch ($period) {
			case "annually":
				$earliestTime = strtotime("-1 year", $time);
				break;
			case "monthly":
				$earliestTime = strtotime("-1 month", $time);
				break;
			case "weekly":
				$earliestTime = strtotime("-1 week", $time);
				break;
			case "daily":
				$earliestTime = strtotime("-1 day", $time);
				break;
			default:
				throw new Q_Exception_RequiredField(array('field' => 'annually, months, weeks, days'));
		}
		return $lastChargeTime >= $earliestTime;
	}

	/**
	 * Check if stream related to some subscription plans
	 * @method checkStreamRelated
	 * @param {Streams_Stream} $stream The stream need to check
	 * @return {boolean|Array}
	 */
	static function checkStreamRelated ($stream) {
		$relations = Streams_RelatedTo::select()->where(array(
			'type' => self::$relationType,
			'fromPublisherId' => $stream->publisherId,
			'fromStreamName' => $stream->name
		))->fetchDbRows();

		if (empty($relations)) {
			return false;
		}

		$assetsPlans = [];
		foreach ($relations as $relation) {
			$assetsPlans[] = Streams::fetchOne(null, $relation->toPublisherId, $relation->toStreamName, true);
		}

		return $assetsPlans;
	}

	/**
	 * Check if stream under some subscription plans and paid by user
	 * @method checkStreamPaid
	 * @param {Streams_Stream} $stream The stream need to check
	 * @param {Users_User|String} [$user] User which need to check. If null use logged in user.
	 * @param {Boolean} [$throwIfNotPaid] If true throw exception if stream under some subscription plan and didn't paid
	 * @return {Boolean}
	 * @throws Exception
	 */
	static function checkStreamPaid ($stream, $user, $throwIfNotPaid=false) {
		if ($user) {
			if (is_string($user)) {
				$user = Users_User::fetch($user, true);
			}
		} else {
			$user = Users::loggedInUser(true);
		}

		// admins have access
		$adminLabels = Q_Config::get("Streams", "types", "Assets/plan", "canCreate", null);
		if ((bool)Users::roles(null, $adminLabels, array(), $user->id)) {
			return true;
		}

		$assetsPlans = self::checkStreamRelated($stream);
		if (!(boolean)$assetsPlans) {
			return true;
		}

		foreach ($assetsPlans as $assetsPlan) {
			$subscriptionStream = self::getStream($assetsPlan, $user);
			if (!$subscriptionStream) {
				continue;
			}

			if (self::isCurrent($subscriptionStream)) {
				return true;
			}
		}

		if ($throwIfNotPaid) {
			$text = Q_Text::get("Assets/content");
			throw new Exception(Q::interpolate($text['errors']['SubscriptionStreamNotPaid'], array(
				"subscriptionUrl" => '<a href="'.Q_Uri::url("Assets/subscription").'">here</a>'
			)));
		}

		return false;
	}
};
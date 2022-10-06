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

	/**
	 * Starts a recurring subscription
	 * @method start
	 * @static
	 * @param {Streams_Stream|array} $plan - The subscription plan stream or array with "publisherId", "streamName".
	 * @param {Users_User|String} [$user] - User or user id. If null - logged in user.
 	 * @param {Users_User} [$options.user=Users::loggedInUser()] Allows us to set the user to subscribe
	 * @return {Streams_Stream} A stream of type 'Assets/subscription' representing this subscription
	 * @param {array} [$options=array()] - Options for the subscription
	 * @param {date} [$options.startDate=today] - The start date of the subscription
	 * @param {date} [$options.endDate=today+year] - The end date of the subscription
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
			$startDate = Q::ifset($options, 'startDate', date("Y-m-d"));
			$startDate = date('Y-m-d', strtotime($startDate));
			if ($months = $plan->getAttribute('months', null)) {
				$endDate = date("Y-m-d", strtotime("-1 day", strtotime("+$months month", strtotime($startDate))));
			} else if ($weeks = $plan->getAttribute('weeks', null)) {
				$endDate = date("Y-m-d", strtotime("-1 day", strtotime("+$weeks week", strtotime($startDate))));
			} else if ($days = $plan->getAttribute('days', null)) {
				$endDate = date("Y-m-d", strtotime("-1 day", strtotime("+$days day", strtotime($startDate))));
			} else {
				$endDate = date("Y-m-d", strtotime("+1 year", strtotime($startDate)));
			}

			$attributes = Q::json_encode(array(
				'planPublisherId' => $plan->publisherId,
				'planStreamName' => $plan->name,
				'startDate' => $startDate,
				'endDate' => $endDate,
				'period' => $plan->getAttribute("period"),
				'amount' => $plan->getAttribute('amount'), // lock it in, in case plan changes later
				'currency' => $currency
			));
			$stream = Streams::create($user->id, $user->id, self::$streamType,
				array(
					'title' => $plan->title,
					'attributes' => $attributes
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
		 * @param {string} startDate
		 * @param {string} endDate
		 * @return {Users_User}
		 */
		Q::event('Assets/startSubscription', @compact(
			'plan', 'user', 'publisher', 'stream', 'startDate', 'endDate', 'months', 'currency'
		), 'after');

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
	 * Check if subscription is currently valid
	 * @method isCurrent
	 * @param {Streams_Stream} $stream The subscription stream
	 * @param {boolean} [$compareByDate=false] Whether to compare by date, rather than seconds
	 * @return {boolean}
	 */
	static function isCurrent($stream, $compareByDate = false)
	{
		$lastChargeTime = $stream->getAttribute('lastChargeTime');
		if (!$lastChargeTime) {
			return false;
		}
		$plan = self::getPlan($stream);
		$endDate = $stream->getAttribute('endDate');
		$endTime = strtotime($endDate);
		$time = time();
		$period = $plan->getAttribute('period', null);
		if ($period == "monthly") {
			$earliestTime = strtotime("-1 month", $time);
		} else if ($period == "weekly") {
			$earliestTime = strtotime("-1 week", $time);
		} else if ($period == "daily") {
			$earliestTime = strtotime("-1 day", $time);
		} else {
			throw new Q_Exception_RequiredField(array('field' => 'months or weeks or days'));
		}
		if ($compareByDate) {
			return (date("Y-m-d", $lastChargeTime) >= date("Y-m-d", $earliestTime))
			and (date("Y-m-d", $time) <= $endDate);
		} else {
			return ($lastChargeTime >= $earliestTime and $time <= $endTime);
		}
	}
};
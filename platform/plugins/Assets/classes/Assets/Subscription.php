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
	/**
	 * Starts a recurring subscription
	 * @method start
	 * @static
	 * @param {Streams_Stream} $plan The subscription plan stream
	 * @param {string} [$payments=null] The type of payments processor, could be "authnet" or "stripe". If omitted, the subscription proceeds without any payments.
	 * @param {array} [$options=array()] Options for the subscription
	 * @param {date} [$options.startDate=today] The start date of the subscription
	 * @param {date} [$options.endDate=today+year] The end date of the subscription
 	 * @param {Users_User} [$options.user=Users::loggedInUser()] Allows us to set the user to subscribe
	 * @param {Users_User} [$options.publisherId=Users::communityId()] Allows us to override the publisher to subscribe to
	 * @param {string} [$options.token=null] required for stripe unless the user is an existing customer
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
	static function start($plan, $payments = null, $options = array())
	{
		if (!isset($options['user'])) {
			$options['user'] = Users::loggedInUser(true);
		}
		
		$app = Q::app();
		$user = Q::ifset($options, 'user', Users::loggedInUser(true));
		$currency = 'USD'; // TODO: may want to implement support for currency conversion
		$startDate = Q::ifset($options, 'startDate', date("Y-m-d"));
		$startDate = date('Y-m-d', strtotime($startDate));
		if ($months = $plan->getAttribute('months', null)) {
			$endDate = date("Y-m-d", strtotime("-1 day", strtotime("+$months month", strtotime($startDate))));
		} else if ($weeks = $plan->getAttribute('weeks', null)) {
			$endDate = date("Y-m-d", strtotime("-1 day", strtotime("+$weeks week", strtotime($startDate))));
		} else if ($days = $plan->getAttribute('days', null)) {
			$endDate = date("Y-m-d", strtotime("-1 day", strtotime("+$days day", strtotime($startDate))));
		} else {
			throw new Q_Exception_RequiredField(array('field' => 'months or weeks or days'));
		}
		$amount = $plan->getAttribute('amount');
		$endDate = date("Y-m-d", strtotime("-1 day", strtotime("+$months month", strtotime($startDate))));
		$endDate = date('Y-m-d', strtotime($endDate));

		$publisherId = Q::ifset($options, 'publisherId', Users::communityId());
		$publisher = Users_User::fetch($publisherId);
		$streamName = "Assets/subscription/{$user->id}/{$plan->name}";
		if ($subscription = Streams_Stream::fetch($publisherId, $publisherId, $streamName)) {
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
	 * @param {array} [$options=array()]
	 */
	static function stop($stream, $options = array())
	{
		// call this if we learn that a subscription has stopped, so we mark it as inactive.
		// the customer could use the credit card info to start a new subscription.
		$stream->setAttribute('stopped', true);
		$stream->changed();
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
		return Streams_Stream::fetch(
			$stream->getAttribute('planPublisherId'),
			$stream->getAttribute('planPublisherId'),
			$stream->getAttribute('planStreamName'),
			true
		);
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
		$startDate = $stream->getAttribute('startDate');
		$secondsInDay = 60 * 60 * 24;
		$time = time();
		if ($months = $plan->getAttribute('months', null)) {
			$endTime = strtotime("-1 day", strtotime("+$months month", strtotime($startDate)));
			$earliestTime = strtotime("-1 month", $time);
		} else if ($weeks = $plan->getAttribute('weeks', null)) {
			$endTime = strtotime("-1 day", strtotime("+$weeks week", strtotime($startDate)));
			$earliestTime = strtotime("-1 week", $time);
		} else if ($days = $plan->getAttribute('days', null)) {
			$endTime = strtotime("-1 day", strtotime("+$days day", strtotime($startDate)));
			$earliestTime = strtotime("-1 day", $time);
		} else {
			throw new Q_Exception_RequiredField(array('field' => 'months or weeks or days'));
		}
		if ($compareByDate) {
			return (date("Y-m-d", $lastChargeTime) >= date("Y-m-d", $earliestTime))
			and (date("Y-m-d", $time) <= date("Y-m-d", $endTime));
		} else {
			return ($lastChargeTime >= $earliestTime and $time <= $endTime);
		}
	}
};
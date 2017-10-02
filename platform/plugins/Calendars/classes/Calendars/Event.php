<?php
/**
 * @module Calendars
 */
/**
 * Class for dealing with calendar events
 * 
 * @class Calendars_Event
 */
class Calendars_Event
{
	static function defaultDuration()
	{
		return Q_Config::expect('Calendars', 'events', 'defaults', 'duration');
	}
	
	static function defaultListingDuration()
	{
		return Q_Config::expect('Calendars', 'events', 'listing', 'duration');
	}
	
	/**
	 * Gets the eventId from the request
	 * @method requestedId
	 * @return {string}
	 */
	static function requestedId()
	{
		$uri = Q_Dispatcher::uri();
		return Q::ifset($_REQUEST, 'eventId', Q::ifset($uri, 'eventId', null));
	}

	/**
	 * Get all the Calendars/event streams the user is participating in,
	 * as related to their "Calendars/participating/events" category stream.
	 * @method participating
	 * @param {string} $userId
	 * @param {integer} $fromTime The earliest endTime of the stream
	 * @param {integer} $untilTime The earliest startTime of the stream
	 * @param {string|array} [$going] Filter by either "yes" or "no" or "maybe"
	 * @return {array} The streams, filtered by the above parameters
	 */
	static function participating(
		$userId = null,
		$fromTime = null,
		$untilTime = null,
		$going = null,
		$options = array()
	) {
		if (!isset($userId)) {
			$userId = Users::loggedInUser(true)->id;
		}
		if (is_string($going)) {
			$going = array($going);
		}
		$options = array_merge($options, array(
			'filter' => function ($relations) use ($going, $fromTime, $untilTime) {
				$result = array();
				foreach ($relations as $r) {
					$startTime = $r->getExtra('startTime');
					$duration = Calendars_Event::defaultDuration();
					$endTime = $r->getExtra('endTime', $startTime + $duration);
					if (($fromTime and $endTime < $fromTime)
					or ($untilTime and $startTime > $untilTime)
					or ($going !== null and !in_array($r->getExtra('going', 'no'), $going))) {
						continue;
					}
					$result[] = $r;
				}
				return $result;
			}
		));
		return Streams::participating("Calendars/participating/events", $options);
	}
	
	/**
	 * Used to start a new group
	 *
	 * @param {array} $options 
	 * @param {string} [$options.interestTitle] Required. Title of an interest that exists in the system.
	 * @param {string} [$options.placeId] Required. Pass the id of a location where people will gather.
	 * @param {string} [$options.startTime] Required. When the people should gather at the location.
	 * @param {string} [$options.timezone=null] Optional. The timezone offset on the browser of the user who created the group.
	 * @param {string} [$options.labels=''] Optional. You can specify a tab-delimited string of labels to which access is granted. Otherwise access is public.
	 * @param {string} [$options.publisherId] Optional. The user who would publish the group. Defaults to the logged-in user.
	 * @param {string} [$options.communityId] Optional. The user who would publish the group. Defaults to the app's name.
	 * @return void
	 */
	static function create($options)
	{
		$publisherId = Streams::requestedPublisherId();
		if (empty($publisherId)) {
			$user = Users::loggedInUser(true);
			$publisherId = $user->id;
		}
		$r = Q::take($_REQUEST, array(
			'interestTitle' => null,
			'placeId' => null,
			'startTime' => null,
			'timezone' => null,
			'labels' => null,
			'communityId' => null,
			'peopleMin' => null,
			'peopleMax' => null
		));
		$required = array('interestTitle', 'placeId', 'startTime');
		foreach ($required as $field) {
			if (!$r[$field]) {
				Q_Response::addError(new Q_Exception_RequiredField(compact('field')));
			}
		}
		if (Q_Response::getErrors()) {
			return;
		}
	
		$defaults = Q_Config::expect('Calendars', 'events', 'defaults');
		$peopleMin = Q::ifset($r, 'peopleMin', $defaults['peopleMin']);
		$peopleMax = Q::ifset($r, 'peopleMax', $defaults['peopleMax']);
		if (!is_numeric($peopleMin) or floor($peopleMin) != $peopleMin) {
			throw new Q_Exception("Min event size must be a number");
		}
		if (!is_numeric($peopleMax) or floor($peopleMax) != $peopleMax) {
			throw new Q_Exception("Max event size must be a number");
		}
		$peopleMin = (integer)$peopleMin;
		$peopleMax = (integer)$peopleMax;
		if ($peopleMin >= $peopleMax) {
			throw new Q_Exception("Max event size can't be less than $peopleMin");
		}
	
		$communityId = $r['communityId'];
		if (!$communityId) {
			$communityId = Users::communityId();
		}
	
	
		// validate labels
		$labelTitles = array('People');
		$labels = null;
		if (!empty($r['labels'])) {
			$labelTitles = array();
			$labels = explode("\t", $r['labels']);
			$rows = Users_Label::fetch($publisherId, $labels, array(
				'checkContacts' => true
			));
			foreach ($labels as $label) {
				if (!isset($rows[$label])) {
					throw new Q_Exception("No contacts found with label $label");
				}
				$labelTitles[] = $rows[$label]->title;
			}
		}
	
		// interest
		$interest = new Streams_Stream();
		$interest->publisherId = $communityId;
		$normalizedInterestTitle = Q_Utils::normalize($r['interestTitle']);
		$interest->name = "Streams/interest/$normalizedInterestTitle";
		if (!$interest->retrieve()) {
			throw new Q_Exception_MissingRow(array(
				'table' => 'Interest',
				'criteria' => 'name ' . $interest->name
			));
		}
	
		// location
		$location = Places_Location::stream($communityId, $r['placeId'], true);
		$locationVenue = $location->getAttribute('title');
		$locationAddress = $location->getAttribute('address');
	
		// save the event in the database
		$event = Streams::create(null, $publisherId, 'Calendars/event', array(
			'icon' => $interest->icon,
			'title' => $locationVenue,
			'attributes' => array(
				'communityId' => $communityId,
				'interest' => $interest->name,
				'interestTitle' => $interest->title,
				'location' => $location->name,
				'venue' => $locationVenue,
				'address' => $locationAddress,
				'latitude' => $location->getAttribute('latitude'),
				'longitude' => $location->getAttribute('longitude'),
				'startTime' => $r['startTime'],
				'timezone' => $r['timezone'],
				'peopleMin' => $peopleMin,
				'peopleMax' => $peopleMax,
				'labels' => $labels,
				'labelTitles' => $labelTitles
			),
			'readLevel' => Streams::$READ_LEVEL[empty($r['labels']) ? 'max' : 'none'],
			'writeLevel' => Streams::$WRITE_LEVEL[empty($r['labels']) ? 'post' : 'none'],
			'adminLevel' => Streams::$ADMIN_LEVEL[empty($r['labels']) ? 'invite' : 'none']
		));
	
		// save any access labels
		if (!empty($labels)) {
			foreach ($labels as $label) {
				$access = new Streams_Access();
				$access->publisherId = $event->publisherId;
				$access->streamName = $event->name;
				$access->ofContactLabel = $label;
				$access->readLevel = Streams::$READ_LEVEL['max'];
				$access->writeLevel = Streams::$WRITE_LEVEL['post'];
				$access->adminLevel = Streams::$ADMIN_LEVEL['invite'];
				$access->save();
			}
		}
	
		// now, fetch it and relate it to a few streams
		$event->relateTo($location, 'Calendars/events', null, array('skipAccess' => true));
		$event->relateTo($interest, 'Calendars/events', null, array('skipAccess' => true));
		$latitude = $location->getAttribute('latitude');
		$longitude = $location->getAttribute('longitude');
		$streamNames = array();
		Places_Interest::streams(
			$communityId,
			$latitude,
			$longitude,
			$r['interestTitle'],
			array('skipAccess' => true),
			$streamNames
		);
		Places_Nearby::streams(
			$communityId,
			$location->getAttribute('latitude'),
			$location->getAttribute('longitude'),
			array('skipAccess' => true),
			$streamNames
		);
		Streams::relate(
			null,
			$communityId,
			$streamNames,
			'Calendars/events',
			$event->publisherId,
			$event->name,
			array(
				'skipAccess' => true,
				'weight' => $r['startTime']
			)
		);
		
	//	$meters = Q_Config::get('Places', 'nearby', 'meters', array());
	//	$min = Q_Config::get('Places', 'nearby', 'minSubscribeMeters', null);
	//	$max = Q_Config::get('Places', 'nearby', 'maxSubscribeMeters', null);
	
		// Since you created the event, it is assumed you're going
		$event->subscribe(array(
			'types' => array('Streams/chat/message', 'Calendars/reminder', 'Calendars/going')
		));
		$participant = new Streams_Participant();
		$participant->publisherId = $publisherId;
		$participant->streamName = $group->name;
		$participant->userId = $user->id;
		$participant->retrieve();
		$going = 'yes';
		$startTime = $group->getAttribute('startTime');
		$participant->setExtra(compact('going', 'startTime'));
		$participant->save();
	
		Q_Response::setSlot('stream', $group);
		Q_Response::setSlot('participant', $participant);
	}
	
	/**
	 * Become a waiting passenger. Check trip peopleMax and detourMax conditions.
	 * @method join
	 * @static
	 * @param {Streams_Stream} The Travel/trip stream
	 * @param {string} $passengerId should be passenger user id
	 * @param {array} $coordinates The coordinates of the pickup point
	 * @param {double} $coordinates.latitude
	 * @param {double} $coordinates.longitude
	 * @return {boolean} whether any action was taken
	 */
	static function join($stream, $passengerId, $coordinates = array())
	{
		if ($passengerId == $stream->publisherId) {
			// this action is only for passengers
			throw new Users_Exception_NotAuthorized();
		}
		if ($stream->getAttribute("state") == "started") {
			// for now, passengers can't join a strip that has already started
			throw new Travel_Exception_TripAlreadyStarted();
		}

		// check if we would exceed max number of people
		$peopleMax = $stream->getAttribute('peopleMax', 0);
		$publisherId = $stream->publisherId;
		$streamName = $stream->name;
		$state = 'participating';
		$participants = Streams_Participant::select('*')
			->where(compact('publisherId', 'streamName', 'state'))
			->fetchDbRows();
		$yesCount = 0;
		$already = false;
		$waypoints = array();
		foreach ($participants as $p) {
			$s = $p->getExtra('state');
			if (!in_array($s, array('waiting', 'riding', 'planning', 'driving'))) {
				continue;
			}
			++$yesCount;
			if ($p->userId === $passengerId) {
				$already = true;
				break;
			}
			if ($p->getExtra('state') !== 'driver') {
				$waypoints[] = array("userId" => $p->userId);
			}
		}
		if ($already) {
			return false;
		}
		
		if ($peopleMax and $yesCount >= $peopleMax) {
			throw new Streams_Exception_Full(array('type' => 'trip'));
		}

		// now check if we would exceed trip's detour max
		$startTime = (int)$stream->getAttribute('startTime');
		$endTime = (int)$stream->getAttribute('endTime');
		$detourMax = (int)$stream->getAttribute('detourMax', 0);
		if ($detourMax and $startTime and $endTime) {
			$duration = $endTime - $startTime;
			$waypoints[] = array("userId" => $passengerId);
			$newRoute = self::route($stream, $waypoints);
			$seconds = 0;
			if (empty($newRoute['routes'][0]['legs'])) {
				$message = "Route seems to be empty";
				throw new Travel_Exception_Routing(compact('message'));
			}
			foreach ($newRoute["routes"][0]["legs"] as $leg){
				$seconds += (int)$leg["duration"]["value"];
			}
			if ($seconds > $duration + $detourMax){
				throw new Travel_Exception_TripDuration();
			}
		}
		if ($coordinates) {
			self::setCoordinates($stream, $passengerId, $coordinates);
		}
		$stream->changed();
		$options = array('filter' => array(
			"types" => array(
				"^Travel/trip/.*",
				"Streams/relatedTo",
				"Streams/chat/message",
			),
			"notifications" => 0
		));
		$stream->subscribe($options); // now the passenger will receive notifications
		$state = 'waiting';
		$extra = compact('state', 'startTime', 'endTime');
		self::setState($passengerId, $publisherId, $streamName, 'waiting', $extra);
		return true;
	}
	
	/**
	 * Leave the trip and stop getting notifications about it
	 * @method leave
	 * @static
	 * @param {Streams_Stream} The Travel/trip stream
	 * @param {string} $passengerId should be passenger user id
	 */
	static function leave($stream, $passengerId)
	{
		if ($passengerId == $stream->publisherId) {
			// this action is only for passengers
			throw new Users_Exception_NotAuthorized();
		}
		$participant = self::participant($stream, $passengerId);
		$stream = Streams::fetchOne($passengerId, $stream->publisherId, $stream->name, true, array(
			'withParticipant' => true
		));
		if ($participant = self::participant($stream)) {
			$state = $participant->getExtra('state');
			$transitions = array(
				'riding' => 'expelled',
				'waiting' => 'canceled'
			);
			if (!isset($transitions[$state])) {
				$newState = $transitions[$state];
				self::setState($passengerId, $stream->publisherId, $stream->name, $newState);
			}
		}
		$stream->leave(); // leave the stream, won't get any more notifications
	}
}
<?php
	
class Places_Location
{
	/**
	 * Get the logged-in user's location stream
	 * @method userStream
	 * @param {boolean} [$throwIfNotLoggedIn=false]
	 *   Whether to throw a Users_Exception_NotLoggedIn if no user is logged in.
	 * @return {Streams_Stream|null}
	 * @throws {Users_Exception_NotLoggedIn} If user is not logged in and
	 *   $throwIfNotLoggedIn is true
	 */
	static function userStream($throwIfNotLoggedIn = false)
	{
		$user = Users::loggedInUser($throwIfNotLoggedIn);
		if (!$user) {
			return null;
		}
		$streamName = "Places/user/location";
		$stream = Streams::fetchOne($user->id, $user->id, $streamName);
		if (!$stream) {
			$stream = Streams::create($user->id, $user->id, 'Places/location', array(
				'name' => $streamName
			));
			$stream->join();
		}
		return $stream;
	}
	
	/**
	 * Get a Places/location stream published by a publisher for a given placeId.
	 * This is used to cache information from the Google Places API.
	 * @method stream
	 * @static
	 * @param {string} $asUserId
	 * @param {string} $publisherId
	 * @param {string} $placeId The id of the place in Google Places
	 * @param {boolean} $throwIfBadValue
	 *  Whether to throw Q_Exception if the result contains a bad value
	 * @return {Streams_Stream|null}
	 * @throws {Q_Exception} if a bad value is encountered and $throwIfBadValue is true
	 */
	static function stream($asUserId, $publisherId, $placeId, $throwIfBadValue = false)
	{
		if (empty($placeId)) {
			if ($throwIfBadValue) {
				throw new Q_Exception_RequiredField(array('field' => 'id'));
			}
			return null;
		}
		
		// sanitize the ID
		$characters = '/[^A-Za-z0-9]+/';
		$result = preg_replace($characters, '_', $placeId);
		
		// see if it's already in the system
		$streamName = "Places/location/$result";
		$location = Streams::fetchOne($asUserId, $publisherId, $streamName);
		if ($location) {
			$ut = $location->updatedTime;
			if (isset($ut)) {
				$db = $location->db();
				$ut = $db->fromDateTime($ut);
				$ct = $db->getCurrentTimestamp();
				$cd = Q_Config::get('Places', 'cache', 'duration', 60*60*24*30);
				if ($ct - $ut < $cd) {
					// there is a cached location stream that is still viable
					return $location;
				}
			}
		}
		
		$key = Q_Config::expect('Places', 'google', 'keys', 'server');
		$query = http_build_query(array('key' => $key, 'placeid' => $placeId));
		$url = "https://maps.googleapis.com/maps/api/place/details/json?$query";
		$json = Places::getRemoteContents($url);
		$response = json_decode($json, true);
		if (empty($response['result'])) {
			throw new Q_Exception("Places_Location::stream: Couldn't obtain place information for $placeId");
		}
		if (!empty($response['error_message'])) {
			throw new Q_Exception("Places_Location::stream: ".$response['error_message']);
		}
		$result = $response['result'];
		$attributes = array(
			'title' => $result['name'],
			'latitude' => $result['geometry']['location']['lat'],
			'longitude' => $result['geometry']['location']['lng'],
			'viewport' => $result['geometry']['viewport'],
			// 'icon' => $result['icon'],
			'phoneNumber' => Q::ifset($result, 'international_phone_number', null),
			'phoneFormatted' => Q::ifset($result, 'formatted_phone_number', null),
			'types' => $result['types'],
			'rating' => Q::ifset($result, 'rating', null),
			'address' => Q::ifset($result, 'formatted_address', null),
			'website' => Q::ifset($result, 'website', null),
			'placeId' => $placeId
		);
		if ($location) {
			$location->title = $result['name'];
			$location->setAttribute($attributes);
			$location->changed();
		} else {
			$location = Streams::create($asUserId, $publisherId, 'Places/location', array(
				'name' => $streamName,
				'title' => $result['name'],
				'attributes' => Q::json_encode($attributes)
			));
		}
		return $location;
	}
	
	/**
	 * Adds a stream to represent an area within a location.
	 * Also may add streams to represent the floor and column.
	 * @method addArea
	 * @static
	 * @param {Streams_Stream} $location The location stream
	 * @param {string} $title The title of the area 
	 * @param {string} [$floor] The number of the floor on which the area is located
	 * @param {string} [$column] The name of the column on which the area is located
	 * @param {array} [$options=array()] Any options to pass to Streams::create. Also can include:
	 * @param {array} [$options.asUserId=null] Override the first parameter to Streams::create
	 * @return {array} An array of ($area, $floor, $column)
	 */
	static function addArea($location, $title, $floor=null, $column=null, $options=array())
	{
		$locationName = $location->name;
		$parts = explode('/', $locationName);
		$placeId = $parts[2];
		$asUserId = Q::ifset($options, 'asUserId', null);
		$publisherId = $location->publisherId;
		$skipAccess = Q::ifset($options, 'skipAccess', true);
		$floorName = isset($floor)
			? "Places/floor/$placeId/".Q_Utils::normalize($floor)
			: null;
		$columnName = isset($column)
			? "Places/column/$placeId/".Q_Utils::normalize($column)
			: null;
		$areaName = Q_Utils::normalize(
			$floor && $column ? $floor.$column : $title
		);
		$name = "Places/area/$placeId/$areaName";
		$area = Streams::fetchOne($asUserId, $publisherId, $name, $options);
		if (!$area) {
			$attributes = array(
				'locationName' => $locationName,
				'locationTitle' => $location->title,
				'locationAddress' => $location->getAttribute('address'),
				'floorName' => $floorName,
				'columnName' => $columnName
			);
			$area = Streams::create($asUserId, $publisherId, 'Places/area',
				compact('name', 'title', 'skipAccess', 'attributes')
			);
			$area->relateTo($location, 'Places/location', $asUserId, $options);
			if ($floorName) {
				$name = $floorName;
				$title = $location->title." floor $floor";
				if (!($floor = Streams::fetchOne($asUserId, $publisherId, $name))) {
					$floor = Streams::create($asUserId, $publisherId, 'Places/floor',
						compact('name', 'title', 'skipAccess')
					);
				}
				$area->relateTo($floor, 'Places/floor', $asUserId, $options);
			}
			if ($columnName) {
				$name = $columnName;
				$title = $location->title." column $column";
				if (!($column = Streams::fetchOne($asUserId, $publisherId, $name))) {
					$column = Streams::create($asUserId, $publisherId, 'Places/column',
						compact('name', 'title', 'skipAccess')
					);
				}
				$area->relateTo($column, 'Places/column', $asUserId, $options);
			}
		} else {
			$column = $columnName
				? Streams::fetchOne($asUserId, $publisherId, $columnName)
				: null;
			$floor = $floorName
				? Streams::fetchOne($asUserId, $publisherId, $floorName)
				: null;
		}
		return array($area, $floor, $column);
	}
}
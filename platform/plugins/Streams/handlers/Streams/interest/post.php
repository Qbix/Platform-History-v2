<?php

/**
 * @module Streams
 */

/**
 * Used by HTTP clients to create a new interest in the system.
 * @class HTTP Streams interest
 * @method post
 *
 * @param {array} $_REQUEST 
 * @param {string} [$_REQUEST.title] Required. The title of the interest.
 * @param {string} [$_REQUEST.publisherId] Optional. Defaults to the current community's id.
 * @param {string} [$_REQUEST.subscribe] Optional. Defauls to false. Whether to subscribe rather than just join the interest stream.
 * @return {void}
 */
function Streams_interest_post()
{
	$user = Users::loggedInUser(true);
	$title = Q::ifset($_REQUEST, 'title', null);
	if (!isset($title)) {
		throw new Q_Exception_RequiredField(array('field' => 'title'));
	}
	$publisherId = Q::ifset($_REQUEST, 'publisherId', Users::communityId());
	$name = 'Streams/interest/' . Q_Utils::normalize($title);
	$stream = Streams::fetchOne(null, $publisherId, $name);
	if (!$stream) {
		$stream = Streams::create($publisherId, $publisherId, 'Streams/interest', array(
			'name' => $name,
			'title' => $title
		));
		if (is_dir(APP_WEB_DIR.DS."plugins".DS."Streams".DS."img".DS."icons".DS.$name)) {
			$stream->icon = $name;
		} else {
			$parts = explode(': ', $title, 2);
			$keywords = implode(' ', $parts);
			$tries = array($keywords, $parts[1]);
			$data = null;
			foreach ($tries as $t) {
				try {
					$data = Q_Image::pixabay($t, array(
						'orientation' => 'horizontal',
						'min_width' => '500',
						'safesearch' => 'true',
						'image_type' => 'photo'
					), true);
				} catch (Exception $e) {
					Q::log("Exception during Streams/interest post: " . $e->getMessage());
					$data = null;
				}
				if ($data) {
					break;
				}
			}
			if ($data) {
				$sizes = Q_Config::expect('Streams', 'icons', 'sizes');
				ksort($sizes);
				$params = array(
					'data' => $data,
					'path' => "{{Streams}}/img/icons",
					'subpath' => $name,
					'save' => $sizes,
					'skipAccess' => true
				);
				Q_Image::save($params);
				$stream->icon = $name;
			}
		}
		$stream->save();
	}
	$subscribe = !!Q::ifset($_REQUEST, 'subscribe', false);
	if ($subscribe) {
		$stream->subscribe();
	} else {
		$stream->join();
	}
	
	$myInterestsName = 'Streams/user/interests';
	$myInterests = Streams::fetchOne($user->id, $user->id, $myInterestsName);
	if (!$myInterests) {
		$myInterests = new Streams_Stream();
		$myInterests->publisherId = $user->id;
		$myInterests->name = $myInterestsName;
		$myInterests->type = 'Streams/category';
		$myInterests->title = 'My Interests';
		$myInterests->save();
	}
	
	Streams::relate(
		$user->id,
		$user->id,
		'Streams/user/interests',
		'Streams/interests',
		$publisherId,
		$name,
		array('weight' => '+1')
	);
	
	Q_Response::setSlot('publisherId', $publisherId);
	Q_Response::setSlot('streamName', $name);

	/**
	 * Occurs when the logged-in user has successfully added an interest via HTTP
	 * @event Streams/interest/post {after}
	 * @param {string} publisherId The publisher of the interest stream
	 * @param {string} title The title of the interest
	 * @param {boolean} subscribe Whether the user subscribed to the interest stream
	 * @param {Users_User} user The logged-in user
	 * @param {Streams_Stream} stream The interest stream
	 * @param {Streams_Stream} myInterests The user's "Streams/user/interests" stream
	 */
	Q::event("Streams/interest/add", compact(
		'publisherId', 'title', 'subscribe', 'user', 'stream', 'myInterests'
	), 'after');
}
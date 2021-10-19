<?php

/**
 * Used to create a new stream
 *
 * @param {array} $_REQUEST 
 * @param {string} [$_REQUEST.title] Required. The title of the interest.
 * @param {string} [$_REQUEST.publisherId] Optional. Defaults to the current community's id.
 * @return {void}
 */
function Streams_interest_delete()
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
		throw new Q_Exception_MissingRow(array(
			'table' => 'stream', 
			'criteria' => Q::json_encode(@compact('publisherId', 'name'))
		));
	}
	$miPublisherId = $user->id;
	$miName = 'Streams/user/interests';
	$myInterests = Streams::fetchOne($user->id, $miPublisherId, $miName);
	if (!$myInterests) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'stream', 
			'criteria' => Q::json_encode(array(
				'publisherId' => $miPublisherId,
				'name' => $miName
			))
		));
	}
	$stream->leave();
	
	Streams::unrelate(
		$user->id,
		$user->id,
		'Streams/user/interests',
		'Streams/interests',
		$publisherId,
		$name,
		array('adjustWeights' => true)
	);
	
	Q_Response::setSlot('publisherId', $publisherId);
	Q_Response::setSlot('streamName', $name);

	/**
	 * Occurs when the logged-in user has successfully removed an interest via HTTP
	 * @event Streams/interest/delete {after}
	 * @param {string} publisherId The publisher of the interest stream
	 * @param {string} title The title of the interest
	 * @param {Users_User} user The logged-in user
	 * @param {Streams_Stream} stream The interest stream
	 * @param {Streams_Stream} myInterests The user's "Streams/user/interests" stream
	 */
	Q::event("Streams/interest/remove", @compact(
		'publisherId', 'title', 'subscribe', 'user', 'stream', 'myInterests'
	), 'after');
}
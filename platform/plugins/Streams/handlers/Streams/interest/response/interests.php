<?php

/**
 * Get a summary of streams related to the specified user's
 * "Streams/user/interests" stream
 *
 * @param {array} $_REQUEST 
 *   @param {string} [$_REQUEST.userId=loggedInUserId] userId
 * @return {void}
 */
function Streams_interest_response_interests()
{
	$user = Users::loggedInUser();
	$userId = Q::ifset($_REQUEST, 'userId', null);
	if ($user and $userId and $userId != $user->id
	and Q_Config::get('Streams', 'interests', 'allowClientQueries', false)) {
		throw new Q_Exception("Client queries are restricted, as per Streams/interests/allowClientQueries");
	}
	if ($userId) {
		$user = Users_User::fetch($userId);
	}
	if (!$user) {
		throw new Users_Exception_NotLoggedIn();
	}
	return Streams_Category::getRelatedTo(
		$user->id, 'Streams/user/interests', 'Streams/interests'
	);
}
<?php

/**
 * Returns a vote or value, if one is there
 * @param {string} forType the type of thing to vote for
 * @param {string} forId string uniquely identifying that thing among others of its type
 */
function Users_vote_response()
{
	if (isset(Users::$cache['vote'])) {
		$vote = Users::$cache['vote'];
	} else {
		$required = array('forType', 'forId');
		foreach ($required as $field) {
			if (empty($_REQUEST[$field])) {
				throw new Q_Exception_RequiredField(@compact('field'));
			}
		}
		$user = Users::loggedInUser(true);
		$vote = new Users_Vote();
		$vote->userId = $user->id;
		$vote->forType = $_REQUEST['forType'];
		$vote->forId = $_REQUEST['forId'];
		$retrieved = $vote->retrieve();
		$vote = $vote->exportArray();
		$vote['retrieved'] = $retrieved;
	}
	Q_Response::setSlot('vote', $vote ? $vote : false);
	Q_Response::setSlot('value', $vote ? $vote['value'] : false);
}
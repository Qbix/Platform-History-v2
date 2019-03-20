<?php

/**
 * Removes a label from the system.
 * @param {array} $_REQUEST
 * @param {string} [$_REQUEST.title] Find it by title
 * @param {string} [$_REQUEST.label] Find it by label
 * @param {string} [$_REQUEST.userId=Users::loggedInUser(true)->id] You can override the user id, if another plugin adds a hook that allows you to do this
 */
function Users_label_delete($params = array())
{
	$req = array_merge($_REQUEST, $params);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$userId = Q::ifset($req, 'userId', $loggedInUserId);
	$l = Q::ifset($req, 'label', null);
	if (!$l) {
		if ($title = Q::ifset($req, 'title', null)) {
			$l = 'Users/' . Q_Utils::normalize($title);
		} else {
			throw new Q_Exception_RequiredField(array('field' => 'label'));
		}
	}
	return !!Users_Label::removeLabel($l, $userId);
}
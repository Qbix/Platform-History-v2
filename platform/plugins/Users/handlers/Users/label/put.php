<?php

/**
 * Edits a label in the system. Fills the "label" (and possibly "icon") slot.
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.label The label
 * @param {string} [$_REQUEST.title] The title of the label
 * @param {string} [$_REQUEST.icon] Optional path to an icon
 * @param {string} [$_REQUEST.userId=Users::loggedInUser(true)->id] You can override the user id, if another plugin adds a hook that allows you to do this
 */
function Users_label_put($params = array())
{
	$req = array_merge($_REQUEST, $params);
	Q_Request::requireFields(array('label'), $req, true);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$userId = Q::ifset($req, 'userId', $loggedInUserId);
	$l = $req['label'];
	$icon = Q::ifset($req, 'icon', null);
	$title = Q::ifset($req, 'title', null);
	$label = Users_Label::updateLabel($l, @compact('icon', 'title'), $userId);
	Q_Response::setSlot('label', $label->exportArray());
}
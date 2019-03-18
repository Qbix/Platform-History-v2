<?php

/**
 * Adds a label to the system. Fills the "label" (and possibly "icon") slot.
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.title The title of the label
 * @param {string} [$_REQUEST.label] You can override the label to use
 * @param {string} [$_REQUEST.icon] Optional path to an icon
 * @param {string} [$_REQUEST.userId=Users::loggedInUser(true)->id] You can override the user id, if another plugin adds a hook that allows you to do this
 */
function Users_label_post($params = array())
{
	if (Q_Request::slotName('batch') or Q_Request::slotName('labels')) {
		return;
	}
	$req = array_merge($_REQUEST, $params);
	Q_Request::requireFields(array('title'), $req, true);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$userId = Q::ifset($req, 'userId', $loggedInUserId);
	$icon = Q::ifset($req, 'icon', Q_Config::get('Users', 'icon', 'labels', 'labels/default'));
	$title = Q::ifset($req, 'title', null);
	$l = Q::ifset($req, 'label', 'Users/'.substr(Q_Utils::normalize($title), 0, 63-6));
	if (!is_string($l)) {
		throw new Q_Exception_WrongType(array(
			'field' => 'label',
			'type' => 'string'
		), 'label');
	}
	$label = Users_Label::addLabel($l, $userId, $title, $icon);
	Q_Response::setSlot('label', $label->exportArray());
}
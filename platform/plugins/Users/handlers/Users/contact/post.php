<?php

/**
 * Adds contacts to the system. Fills the "contacts" slot.
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.label The label of the contact
 * @param {string} $_REQUEST.contactUserId The contactUserId of the contact
 * @param {string} [$_REQUEST.nickname] The nickname of the contact
 * @param {string} [$_REQUEST.userId=Users::loggedInUser(true)->id] You can override the user id, if another plugin adds a hook that allows you to do this
 */
function Users_contact_post($params = array())
{
	$req = array_merge($_REQUEST, $params);
	Q_Request::requireFields(array('label', 'contactUserId'), $req, true);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$userId = Q::ifset($req, 'userId', $loggedInUserId);
	$contactUserId = $req['contactUserId'];
	$nickname = Q::ifset($req, 'nickname', null);
	$contacts = Users_Contact::addContact(
		$userId, $req['label'], $contactUserId, $nickname
	);
	Q_Response::setSlot('contacts', Db::exportArray($contacts));
}
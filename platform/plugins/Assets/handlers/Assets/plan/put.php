<?php
function Assets_plan_put ($params) {
	$req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array("publisherId", "streamName"), $req, true);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$publisherId = Q::ifset($req, "publisherId", $loggedInUserId);
	$streamName = Q::ifset($req, "streamName", $loggedInUserId);

	// if user try to update align profile or is not an admin
	if (!Assets_Subscription::isAdmin($loggedInUserId)) {
		throw new Users_Exception_NotAuthorized();
	}

	$stream = Streams_Stream::fetch(null, $publisherId, $streamName);

	if (Q_Request::slotName("interrupt")) {
		Assets_Subscription::interrupt($stream);
		Q_Response::setSlot("interrupt", true);
	} elseif (Q_Request::slotName("continue")) {
		Assets_Subscription::continue($stream);
		Q_Response::setSlot("continue", true);
	}
}
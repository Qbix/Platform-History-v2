<?php
function Assets_billing_put ($params) {
	$request = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(["creditsMin", "creditsAdd"], $request, true);
	$creditsStream = Assets_Credits::userStream();

	$creditsStream->setAttribute("creditsMin", (int)$request["creditsMin"]);
	$creditsStream->setAttribute("creditsAdd", (int)$request["creditsAdd"]);
	$creditsStream->save();

	Q_Response::setSlot("results", true);
}
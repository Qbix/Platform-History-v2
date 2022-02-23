<?php
function Assets_NFT_response_getUsersIdByWallet ($params) {
	$request = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array('wallet'), $request, true);

	$user = Users_ExternalTo::select()->where(array(
		"xid" => $request["wallet"]
	))->fetchDbRow();
	$userId = Q::ifset($user, "userId", null);

	return compact("userId");
}
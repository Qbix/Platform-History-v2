<?php
function Assets_NFT_response_getUserIdByWallet ($params) {
	$request = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array('wallet'), $request, true);

	return Users_Web3::getUserIdByWallet($request["wallet"]);
}
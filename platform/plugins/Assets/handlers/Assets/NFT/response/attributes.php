<?php
function Assets_NFT_response_attributes ($params) {
	$params = array_merge($_REQUEST, $params);
	$displayTypes = Q_Config::expect("Assets", "Web3", "NFT", "attributes", "display_type");
	$res = array();

	foreach ($displayTypes as $displayType) {
		$res[$displayType] = array();
	}

	$resMysql = Assets_NftAttributes::select()->where(array("publisherId" => $params["publisherId"]))->fetchDbRows();

	foreach ($resMysql as $rm) {
		if (!is_array($res[$rm->display_type])) {
			$res[$rm->display_type] = array();
		}

		if (!is_array($res[$rm->display_type][$rm->trait_type])) {
			$res[$rm->display_type][$rm->trait_type] = array();
		}

		$res[$rm->display_type][$rm->trait_type][] = $rm->value;
	}

	return $res;
}
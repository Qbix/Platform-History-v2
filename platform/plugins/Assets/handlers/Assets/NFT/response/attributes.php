<?php
function Assets_NFT_response_attributes ($params) {

	$displayTypes = Q_Config::expect("Assets", "Web3", "NFT", "attributes", "display_type");
	$res = array();

	foreach ($displayTypes as $displayType) {
		$res[$displayType] = array();
	}

	$resMysql = Assets_NftAttributes::select()->fetchDbRows();

	foreach ($resMysql as $rm) {
		if (!in_array($rm->display_type, $displayTypes)) {
			continue;
		}

		if (!is_array($res[$rm->display_type][$rm->trait_type])) {
			$res[$rm->display_type][$rm->trait_type] = array();
		}

		$res[$rm->display_type][$rm->trait_type][] = $rm->value;
	}

	return $res;
}
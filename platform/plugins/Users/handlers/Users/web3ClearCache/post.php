<?php

/**
 * Clear Users_Web3 cache rows related to some params
 */
function Users_web3ClearCache_post($params)
{
	$request = array_merge($_REQUEST, $params);
	$rows = Q::ifset($request, "rows", array());
	$columns = array("chainId", "contract", "methodName", "fromAddress", "params");

	foreach ($rows as $row) {
		$fields = Q::take($row, $columns);
		$where = array();
		foreach ($columns as $column) {
			if (Q::ifset($fields, $column, null)) {
				if ($column == "params") {
					$where[$column." like "] =  '%'.$fields[$column].'%';
				} else {
					$where[$column] =  $fields[$column];
				}
			}
		}
		Users_Web3::delete()->where($where)->execute();
	}
}
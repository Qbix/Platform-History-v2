<?php
	
function Assets_currencies_response_symbol ()
{
	Q_Request::requireFields(array('currency'), true);
	$currencies = explode(',', $_REQUEST['currency']);

	$tree = new Q_Tree();
	$tree->load(ASSETS_PLUGIN_CONFIG_DIR.DS.'currencies.json');
	$array = $tree->getAll();
	$symbols = array();

	foreach ($currencies as $currency) {
		$currency = strtoupper($currency);
		$symbols[$currency] = Q::ifset($array, 'symbols', $currency, '');
	}

	return $symbols;
}
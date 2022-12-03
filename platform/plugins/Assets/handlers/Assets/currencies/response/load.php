<?php
	
function Assets_currencies_response_load ()
{
	$tree = new Q_Tree();
	$tree->load(ASSETS_PLUGIN_CONFIG_DIR.DS.'currencies.json');
	return $tree->getAll();
}
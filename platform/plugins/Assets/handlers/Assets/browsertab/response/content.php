<?php
	
function Assets_browsertab_response_content()
{
	Q_Response::layoutView('Assets/browsertab.php');
	Q_Response::addStylesheet('Q/plugins/Assets/css/browsertab.css');
	$srcs = Q_Config::get("Assets", "browsertab", "css", array());
	foreach ($srcs as $src) {
		Q_Response::addStylesheet($src);
	}
	Q_Response::addScript('Q/plugins/Assets/js/browsertab.js');
}
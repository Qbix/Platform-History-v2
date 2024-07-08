<?php

function Q_error($params)	
{
	if ($params['type'] === 'warning') return;
	extract($params);
	$errstr = preg_replace("/href='(.+)'/", "href='http://php.net/$1'", $errstr);
	$fixTrace = true;
 	throw new Q_Exception_PHPError(
		@compact('errno', 'errstr', 'errfile', 'errline', 'fixTrace'), 
		array()
	);
}

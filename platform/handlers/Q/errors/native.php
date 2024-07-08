<?php

function Q_errors_native($params)
{
	echo Q::view('Q/errors.php', $params);
	$app = Q::app();
	Q::log("$app: Errors in " . ceil(Q::milliseconds()) . "ms\n" );
	Q::log($params);
}

<?php
	
function MyApp_canHandle($params)
{
	$module = "MyApp";
	$action = $params['action'];
	return Q::canHandle("$module/$action/response/content")
		or Q::canHandle("$module/$action/response");
}
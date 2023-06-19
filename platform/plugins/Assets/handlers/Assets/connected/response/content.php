<?php
	
function Assets_connected_response_content()
{
	$uri = Q_Dispatcher::uri();
	$payments = Q::ifset($uri, 'payments', "stripe");

	$className = 'Assets_Payments_'.ucfirst($payments);
	$object = new $className();
	return $object->createConnectedAccount();
}
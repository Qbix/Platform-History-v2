<?php
	
function Assets_subscription_response_content($params)
{
	Q::event('Assets/subscription/response/column', $params);

	return Q::view('Assets/content/columns.php');
}
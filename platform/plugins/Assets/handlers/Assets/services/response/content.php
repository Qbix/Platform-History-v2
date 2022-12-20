<?php
	
function Assets_services_response_content($params)
{
	Q::event('Assets/services/response/column', $params);
	return Q::view('Assets/content/columns.php');
}
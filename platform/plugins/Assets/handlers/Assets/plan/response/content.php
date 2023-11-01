<?php
	
function Assets_plan_response_content($params)
{
	Q::event('Assets/subscription/response/column', $params);
	Q::event('Assets/plan/response/column', $params);

	return Q::view('Assets/content/columns.php');
}
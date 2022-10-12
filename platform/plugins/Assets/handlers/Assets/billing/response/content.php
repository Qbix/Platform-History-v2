<?php
function Assets_billing_response_content($params) {
	Q::event('Assets/billing/response/column', $params);

	return Q::view('Assets/content/columns.php');
}
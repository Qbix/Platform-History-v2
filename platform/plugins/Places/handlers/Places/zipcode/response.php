<?php

function Places_zipcode_response()
{
	if (Q_Request::method() !== 'GET') {
		return null;
	}
	
	$zip = array();
	if (isset($_REQUEST['zipcodes'])) {
		$zip = $_REQUEST['zipcodes'];
	} else if (isset($_REQUEST['zipcode'])) {
		$zip = $_REQUEST['zipcode'];
	}
	if (is_string($zip)) {
		$zip = explode(',', $zip);
	}
	
	$zipcodes = Places_Zipcode::select()
		->where(array('zipcode' => $zip))
		->fetchDbRows();
	Q_Response::setSlot('zipcodes', $zipcodes);
}
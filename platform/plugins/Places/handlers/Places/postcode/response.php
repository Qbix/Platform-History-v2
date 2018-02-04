<?php

function Places_postcode_response()
{
	if (Q_Request::method() !== 'GET') {
		return null;
	}
	
	$postcode = array();
	if (isset($_REQUEST['postcodes'])) {
		$postcode = $_REQUEST['postcodes'];
	} else if (isset($_REQUEST['postcode'])) {
		$postcode = $_REQUEST['postcode'];
	}
	if (is_string($postcode)) {
		$postcode = explode(',', $postcode);
	}
	
	$postcodes = Places_Postcode::select()
		->where(array('postcode' => $postcode))
		->fetchDbRows();
	Q_Response::setSlot('postcodes', $postcodes);
}
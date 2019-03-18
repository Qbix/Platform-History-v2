<?php

function Streams_invite_validate()
{
	if (Q_Request::method() === 'PUT') return;
	if (Q_Request::method() !== 'GET') Q_Valid::nonce(true);
	$fields = array('publisherId', 'streamName');
	if (Q_Request::method() === 'POST') {
		if (Q_Valid::requireFields($fields)) {
			return;
		}
		foreach ($fields as $f) {
			if (strlen(trim($_REQUEST[$f])) === 0) {
				Q_Response::addError(new Q_Exception("$f can't be empty", $f));
			}
		}
	}
	if (isset($_REQUEST['fullName'])) {
		$length_min = Q_Config::get('Streams', 'inputs', 'fullName', 'lengthMin', 5);
		$length_max = Q_Config::get('Streams', 'inputs', 'fullName', 'lengthMax', 30);
		if (strlen($_REQUEST['fullName']) < $length_min) {
			throw new Q_Exception("A user's full name can't be that short.", 'fullName');
		}
		if (strlen($_REQUEST['fullName']) > $length_max) {
			throw new Q_Exception("A user's full name can't be that long.", 'fullName');
		}		
	}
}

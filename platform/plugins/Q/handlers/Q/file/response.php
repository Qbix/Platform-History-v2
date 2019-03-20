<?php

function Q_image_response () {
	$slots = Q_Response::slots(true);
	if (isset($slots['data'])) {
		return;
	}
	if (!isset($_REQUEST['hash'])) {
		throw new Q_Exception_WrongValue(array(
	        'field' => 'hash',
	        'range' => "identifier hash"
		));
	}
	$hash = $_REQUEST['hash'];
	header ("Content-type: image/png");
	$gravatar = isset($_REQUEST['gravatar'])
		? $_REQUEST['gravatar']
		: Q_Config::get('Users', 'login', 'gravatar', false);
	$result = Q_Image::avatar(
		$hash,
		isset($_REQUEST['size']) ? $_REQUEST['size'] : null,
		isset($_REQUEST['type']) ? $_REQUEST['type'] : null,
		$gravatar
	);
	if ($gravatar) {
		echo $result;
	} else {
		imagepng($result);
	}
	return false;
}
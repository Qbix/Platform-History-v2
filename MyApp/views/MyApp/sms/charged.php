<?php echo Q::interpolate($charged['HavePaid'], array(
	$user->displayName(array('short' => true)),
	$displayAmount,
	Q_Request::baseUrl(),
	$description
)) ?>,
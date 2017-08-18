<?php echo Q::text($charged['HavePaid'], array(
	$user->displayName(array('short' => true)),
	$displayAmount,
	Q_Html::a(Q_Request::baseUrl(), Q_Html::text($publisher->displayName())),
	$description
)) ?>,
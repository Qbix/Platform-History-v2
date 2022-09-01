<?php echo Q_Html::text($subscription['YouHaveStarted'], array(
	$user->displayName(),
	$plan->title,
	$publisher->displayName(),
	$displayAmount,
	$months
)) ?>
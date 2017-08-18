<?php echo Q_Html::text($subscription['HasStarted'], array(
	$user->displayName(),
	$plan->title,
	$publisher->displayName(),
	$displayAmount,
	$months
)) ?>
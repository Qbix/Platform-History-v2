<p>
	<?php echo Q::text($charged['HavePaid'], array(
		$user->displayName(array('short' => true)),
		$displayAmount,
		$publisher->displayName(),
		$description
	)) ?>,
</p>
<p>
	<?php echo Q::interpolate($history["SeeHistory"], array(
		Q_Html::a($link, Q_Html::text($publisher->displayName())
		))) ?>
</p>
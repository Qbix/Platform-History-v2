<p>
	<?php echo Q::interpolate($charged['HavePaid'], array(
		$user->displayName(array('short' => true)),
		$displayAmount,
		Q_Html::a(Q_Request::baseUrl(), Q_Html::text($publisher->displayName())),
		$description
	)) ?>,
</p>

<p>
	<?php echo Q::text($charged['HasBeenCharged'], array(
		$user->displayName(), $displayAmount, $description, $publisher->displayName()
	)) ?>>
</p>

<p>
	<?php echo Q::interpolate($SeeHistory, array(
		Q_Html::a($link, Q_Html::text($publisher->displayName())
	))) ?>
</p>
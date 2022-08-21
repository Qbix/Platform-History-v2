<p>
	<?php echo Q::text($charge['HasBeenCharged'], array(
		$user->displayName(), $displayAmount, $description, $publisher->displayName()
	)) ?>
</p>

<p>
	<?php echo Q::interpolate($SeeHistory, array(
		Q_Html::a($link, Q_Html::text($publisher->displayName())
	))) ?>
</p>
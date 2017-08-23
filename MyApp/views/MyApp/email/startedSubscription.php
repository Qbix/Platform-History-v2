<p>
	<?php echo Q_Html::text($subscription['YouHaveStarted'], array(
		$user->displayName(),
		$plan->title,
		$publisher->displayName(),
		$displayAmount,
		$months
	)) ?>
</p>

<p>
	<?php echo Q::interpolate($SeeYou, array(Q_Html::a(Q_Html::themedUrl(''), $communityName))) ?>
</p>
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
	See all charges for <?php echo Q_Html::a($link, Q_Html::text($publisher->displayName())) ?>
	<?php echo Q::interpolate($SeeYou, array(Q_Html::a(Q_Html::themedUrl(''), $communityName))) ?>
</p>
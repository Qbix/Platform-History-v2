<p>
	<?=Q::text($charged['HavePaid'], array(
		$user->displayName(array('short' => true)),
		$displayAmount,
		$publisher->displayName(),
		$description
	))?>.
</p>
<p>
	<?=Q_Html::a($link, Q::interpolate(Q_Html::text($history["SeeHistory"]), array($publisher->displayName())))?>
</p>
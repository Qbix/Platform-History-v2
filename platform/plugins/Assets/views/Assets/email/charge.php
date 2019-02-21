<p>
	This is just to let you know
	<?php echo Q_Html::text($user->displayName()) ?>
	has been charged <?php Q_Html::text("$symbol$amount") ?>
	for <?php echo Q_Html::text($description) ?>
	by <?php echo Q_Html::text($publisher->displayName()) ?>
</p>

<p style="display: none">
	See all charges for <?php echo Q_Html::a($link, Q_Html::text($publisher->displayName())) ?>
</p>
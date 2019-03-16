<p>
	Hey <?php echo Q_Html::text($user->displayName(array('short' => true))) ?>,
	this is just a quick confirmation that you've successfully paid
	<?php Q_Html::text("$symbol$amount") ?> to
	<?php echo Q_Html::a(Q_Request::baseUrl(), Q_Html::text($publisher->displayName())) ?>
	for <?php echo Q_Html::text($description) ?>.
</p>
<?php echo Q_Html::form($action, 'POST', array('target' => 'Assets_authnet'))?>
	<?php echo Q_Html::hidden(array('Token' => $token )) ?>
	<button class="Q_button Assets_pay" type="submit"><?php echo $payButton ?></button>
</form>
<div id="widget">
	<div class="Broadcast_initiate">
		<button class="Broadcast_login Q_clickable">
			<?php echo Q_Html::text($button) ?>
		</button>
	</div>
	<div class="Broadcast_manage" style="display: none">
		<div class="Broadcast_explanation">
			<?php echo Q_Html::text($explanation )?>
		</div>
		<input type="checkbox" checked="checked" id="Broadcast_agreement_main">
		<label for="Broadcast_agreement_main">
			<?php echo Q_Html::text($checkbox) ?>
		</label>
	</div>
</div>
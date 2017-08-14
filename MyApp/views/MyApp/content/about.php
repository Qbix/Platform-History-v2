<div id='content'>
	<h1>
		<?php echo Q::text($about['About'], array(
			Users::communityName()
		)) ?>
	</h1>
	<?php echo Q::text($about['CanWrite']) ?><br>
	<?php echo Q::text($about['OrRemove']) ?>
</div>

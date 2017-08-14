<div id='content'>
	<h1><?php echo Q::text($welcome['Welcome'])?></h1>
	<p>
		<?php echo Q::interpolate($welcome['ToStart'], array('https://qbix.com/platform')) ?>
		<?php echo Q::text($welcome['RenderedInMs'], array(ceil(Q::milliseconds()))) ?>
		<?php echo Q::text($welcome['RefreshPage']) ?>
		<?php echo Q::text($welcome['EvenFaster'], 'fast.php') ?>
	</p>
</div>

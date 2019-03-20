<div id='content'>
	<h1><?php echo Q::text($welcome['Welcome'])?></h1>
	<p><?php echo Q::interpolate($welcome['ToStart'], array('https://qbix.com/platform')) ?></p>
	<p><?php echo Q::text($welcome['RenderedInMs'], array(ceil(Q::milliseconds()))) ?></p>
	<p><?php echo Q::text($welcome['RefreshPage']) ?></p>
	<p><?php echo Q::interpolate($welcome['EvenFaster'], array('fast.php')) ?></p>
</div>

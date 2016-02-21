<div id="content">
	<h1><?php echo $heading ?></h1>
	<?php echo Q::event('Broadcast/stream/response/form', array(
		'publisherId' => $page->publisherId,
		'name' => 'Broadcast/main'
	))?>
</div>
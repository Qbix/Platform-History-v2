<div id='content'>
	<h1>
		<?php echo Q::text($about['About'], array(
			Users::communityName()
		)) ?>
	</h1>

	<?=Q::tool("Streams/html", array(
		"publisherId" => $communityId,
		"streamName" => "Streams/community/about",
		"field" => "content",
		"placeholder" => Q::text($about['CanWrite'])."<br>".Q::text($about['OrRemove'])
	))?>
</div>

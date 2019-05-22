<div id="content" class="Streams_participating">
    <?php foreach($participants as $participant) {
		$stream = Streams::fetchOne($loggedUserId, $participant->fromPublisherId, $participant->fromStreamName);
		$checked = $participant->subscribed == 'yes' ? 'checked' : '';
    ?>
		<div class="Streams_participating_stream">
            <img class="Streams_participating_stream_icon" src="<?php echo $stream->iconUrl('40.png') ?>" />
            <h2><?php echo $stream->title ?></h2>
            <input type="checkbox" class="Streams_participating_stream_checkmark" data-publisherId="<?php echo $stream->publisherId ?>" name="<?php echo $stream->name ?>" <?php echo $checked?>>
        </div>
	<?php } ?>
</div>
<div id="content" class="Streams_participating">
    <table class="Streams_participating_stream">
        <tr>
            <th><?php echo $participating['Title'] ?></th>
            <th><?php echo $participating['Subscribed'] ?></th>
            <th><?php echo $participating['Participants'] ?></th>
        </tr>
    <?php foreach($participants as $participant) {
		$stream = Streams::fetchOne($loggedUserId, $participant->fromPublisherId, $participant->fromStreamName);
		$checked = $participant->subscribed == 'yes' ? 'checked' : '';
		$iconUrl = $stream->iconUrl('40.png');

		if ($skipOwnStreams && $stream->publisherId == $loggedUserId) {
		    continue;
        }
    ?>
        <tr></tr>
		<tr>
            <td data-type="title">
                <img class="Streams_participating_stream_icon" src="<?php echo $iconUrl ?>" onerror="this.style.width=0;this.style.visibility='hidden';" />
                <h2 title="<?php echo $stream->title ?>"><?php echo $stream->title ?></h2>
            </td>
            <td data-type="checkmark">
                <input type="checkbox" class="Streams_participating_stream_checkmark" data-publisherId="<?php echo $stream->publisherId ?>" name="<?php echo $stream->name ?>" <?php echo $checked?>>
            </td>
            <td data-type="participants" data-publisherId="<?php echo $stream->publisherId ?>" data-streamName="<?php echo $stream->name ?>"></td>
        </tr>
	<?php } ?>
    </table>
</div>
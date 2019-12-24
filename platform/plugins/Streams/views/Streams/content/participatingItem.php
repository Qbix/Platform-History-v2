<tr></tr>
<tr>
	<td data-type="title">
		<img class="Streams_participating_stream_icon" src="<?php echo $iconUrl ?>" onerror="this.style.width=0;this.style.visibility='hidden';" />
		<div title="<?php echo $stream->title ?>"><?php echo $stream->title ?></div>
	</td>
	<td data-type="checkmark">
        <i class="Streams_participant_subscribed_icon" data-publisherId="<?php echo $stream->publisherId ?>" data-name="<?php echo $stream->name ?>" data-subscribed="<?php echo $checked?>"></i>
	</td>
</tr>

<tr></tr>
<tr>
	<td data-type="title">
		<img class="Streams_participating_stream_icon" src="<?php echo $iconUrl ?>" onerror="this.style.width=0;this.style.visibility='hidden';" />
		<div title="<?php echo $stream->title ?>"><?php echo $stream->title ?></div>
	</td>
	<td data-type="checkmark">
		<input type="checkbox" class="Streams_participating_stream_checkmark" data-publisherId="<?php echo $stream->publisherId ?>" name="<?php echo $stream->name ?>" <?php echo $checked?>>
	</td>
	<td data-type="participants" data-processed="0" data-publisherId="<?php echo $stream->publisherId ?>" data-streamName="<?php echo $stream->name ?>"></td>
</tr>

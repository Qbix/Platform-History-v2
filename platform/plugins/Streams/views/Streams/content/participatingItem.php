<div data-type="tr">
	<div data-type="title">
		<img class="Streams_participating_stream_icon" src="<?php echo $iconUrl ?>" onerror="this.style.width=0;this.style.visibility='hidden';" />
		<div title="<?php echo $participant->title ?>"><?php echo $participant->title ?></div>
	</div>
	<div data-type="checkmark">
        <i class="Streams_participant_subscribed_icon" data-publisherId="<?php echo $participant->publisherId ?>" data-name="<?php echo $participant->name ?>" data-subscribed="<?php echo $checked?>"></i>
	</div>
</div>

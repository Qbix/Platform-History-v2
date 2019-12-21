<div id="content" class="Streams_participating">
    <div class="Streams_participating_item" data-type="email" data-defined="<?php echo $user->emailAddress ? 'true' : 'false' ?>" data-subscribed="<?php echo $emailSubscribed ? 'true' : 'false' ?>">
        <span class="Streams_participating_id"><?php echo $user->emailAddress ?></span>
        <i class="Streams_participant_plus_icon"></i>
        <i class="Streams_participant_subscribed_icon"></i>
        <!--<i class="Streams_participant_delete_icon"></i>//-->
    </div>
    <div class="Streams_participating_item" data-type="mobile" data-defined="<?php echo $user->mobileNumber ? 'true' : 'false' ?>" data-subscribed="<?php echo $mobileSubscribed ? 'true' : 'false' ?>">
        <span class="Streams_participating_id"><?php echo $user->mobileNumber ?></span>
        <i class="Streams_participant_plus_icon"></i>
        <i class="Streams_participant_subscribed_icon"></i>
        <!--<i class="Streams_participant_delete_icon"></i>//-->
    </div>
    <?php foreach($participantsGrouped as $streamType => $participants) {
        if (empty($participants)) {
            continue;
        }

        $content = '<table class="Streams_participating_stream"><tr>
            <th data-type="title">'.$participating['Title'].'</th>
            <th data-type="checkmark">'.$participating['Subscribed'].'</th>'.join($participants).'</table>';

		echo Q::Tool("Q/expandable", array(
			'title' => $streamType.' <span>('.count($participants).')</span>',
            'content' => $content
		), $streamType);
    }?>
</div>
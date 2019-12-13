<div id="content" class="Streams_participating">
    <div class="Streams_participating_item Communities_icon" data-type="email" data-defined="<?php echo $user->emailAddress ? 'true' : 'false' ?>">
        <span><?php echo $user->emailAddress ?></span>
    </div>
    <div class="Streams_participating_item Communities_icon" data-type="mobile" data-defined="<?php echo $user->mobileNumber ? 'true' : 'false' ?>">
        <span><?php echo $user->mobileNumber ?></span>
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
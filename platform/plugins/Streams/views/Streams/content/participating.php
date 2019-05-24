<div id="content" class="Streams_participating">
    <?php foreach($participantsGrouped as $streamType => $participants) {
        if (empty($participants)) {
            continue;
        }

        $content = '<table class="Streams_participating_stream"><tr>
            <th>'.$participating['Title'].'</th>
            <th>'.$participating['Subscribed'].'</th>'.join($participants).'</table>';

		echo Q::Tool("Q/expandable", array(
			'title' => $streamType.' <span>('.count($participants).')</span>',
            'content' => $content
		), uniqid());
    }?>
</div>
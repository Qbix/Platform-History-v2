<div id="content" class="Streams_participating">
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
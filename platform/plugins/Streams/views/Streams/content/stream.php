<div id="content">
	<div class='Streams_stream_info_pane'>
		<?php if ($stream->icon): ?>
			<div class='Streams_stream_icon'>
				<?php echo Q_Html::img($stream->iconUrl('80.png')); ?>
			</div>
		<?php endif; ?>
		<div class='Streams_stream_title'>
			<?php echo Q_Html::text($stream->title) ?>
		</div>
		<div class='Streams_stream_player'>
			<?php echo Q::tool('Streams/player', compact('stream')) ?>
		</div>
	</div>
	<div class='Streams_stream_activity_pane'>
		<div class='Streams_participants'>
			<?php echo Q::tool('Streams/participants', compact('stream'))?>
		</div>
		<div class='Streams_stream_activity'>
			<?php echo Q::tool('Streams/activity')?>
		</div>
	</div>
</div>
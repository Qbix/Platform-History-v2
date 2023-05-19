<div id="content">
	<style type="text/css">
		#Users_avatar-publisher_tool .Users_avatar_icon { width: 30px; height: 30px; margin-right: 5px; }
		.Streams_stream_header { padding-bottom: 10px; border-bottom: 1px solid #aaa; }
		.Streams_stream_icon { float: left; width: 80px; }
		.Streams_stream_title { line-height: 60px; font-size: 40px;  }
		.Streams_stream_publisher { margin-top: -10px; }
		.Streams_stream_player { clear: both; }
		.Streams_stream_activity_pane { border-top: 1px solid #aaa; }
	</style>
	<div class='Streams_stream_main_pane'>
		<?php if ($stream->icon): ?>
			<div class='Streams_stream_icon'>
				<?php echo Q_Html::img($stream->iconUrl('80.png')); ?> 
			</div>
		<?php endif; ?>
		<div class='Streams_stream_header'>
			<div class='Streams_stream_title'>
				<?php echo Q_Html::text($stream->title) ?>
			</div>
			<div class='Streams_stream_publisher'>
				<?php echo Q::tool('Users/avatar', array(
					'userId' => $stream->publisherId,
					'icon' => 80
				), 'publisher') ?>
			</div>
		</div>
		<div class='Streams_stream_player'>
			<?php echo Q::tool('Streams/player', @compact('stream')) ?>
		</div>
	</div>
	<div class='Streams_stream_activity_pane'>
		<div class='Streams_participants'>
			<?php echo Q::tool('Streams/participants', @compact('stream'))?>
		</div>
		<div class='Streams_stream_content'>
			<?php echo $stream->content ?>
		</div>
		<div class='Streams_stream_activity'>
			<?php echo Q::tool('Streams/activity')?>
		</div>
		<?php if ($stream->testReadLevel('messages')): ?> 
			<div class='Streams_stream_chat'>
				<?php echo Q::tool('Streams/chat', @compact('publisherId', 'streamName'))?>
			</div>
		<?php endif; ?>
	</div>
</div>
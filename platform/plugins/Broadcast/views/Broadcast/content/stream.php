<div id="content">
	<div class="clearfix">
		<div class='info_pane'>
			<?php if ($stream->icon): ?>
				<div class='Streams_stream_icon'>
					<?php echo Q_Html::img("plugins/Streams/img/icons/{$stream->icon}/80.png"); ?>
				</div>
			<?php endif; ?>
			<div class='Streams_stream_title'>
				<?php echo Q_Html::text($stream->title) ?>
			</div>
			<div class='Streams_stream_content'>
				<?php echo Q_Html::text($stream->content) ?>
			</div>
				<div><?php echo count($agreed_users) ?> people opted in so far</div>
			<table class='Streams_participant'>
				<?php foreach ($agreed_users as $u): ?>
				<tr>
					<td><fb:profile-pic size="square" uid="<?php echo $u->fb_uid ?>"></fb:profile-pic></td>
					<td><fb:name linked="false" capitalize="true" uid="<?php echo $u->fb_uid ?>"></fb:name></td>
				</tr>
				<?php endforeach ?>
			</table>
		</div>
		<div class='main_pane'>
			<h2>Broadcast a Message</h2>
			<div class='Streams_player'>
				<?php echo Q::tool('Streams/player', compact('stream'))?>
			</div>
			<h2>Widget code:</h2>
			<div>Customize your widget</div>
			<?php echo Q_Html::form(Q_Dispatcher::uri(), 'GET') ?>
				<?php echo Q::tool('Q/form', array('fields' => array(
					'explanation' => array('message' => 'explanation above the button', 'value' => Q_Config::expect('Broadcast', 'text', 'explanation')),
					'button' => array('message' => 'text of the button', 'value' => Q_Config::expect('Broadcast', 'text', 'button')),
					'checkmark' => array('message' => 'text of the checkbox', 'value' => Q_Config::expect('Broadcast', 'text', 'checkbox')),
					'css' => array('message' => 'optional url of a css file to use for styles'),
					'' => array('type' => 'submit', 'value' => 'Generate code')
				), 'onSuccess' => 'Q.plugins.Broadcast.onWidgetmakerSuccess'))?>
			</form>
			<div>Copy and paste the following code into your website:</div>
			<textarea class="widget_code" style="width: 100%; height: 200px;">
				

				
			</textarea>
		</div>
	</div>
</div>
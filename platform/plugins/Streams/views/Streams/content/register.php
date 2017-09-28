<div id='content'>
	<div class='invited_pane'>
		<table class='invited notice'>
			<tr>
				<td>
					<?php echo Q_Html::img(
						$byUser->iconUrl('80.png'),
						$byDisplayName,
						array('class' => 'item_icon')
					) ?>
				</td>
				<td>
					<h2><?php echo $byDisplayName ?> invited you to:</h2>
					<div class='stream_title'><?php echo $stream->title ?></div>
				</td>
			</tr>
		</table>
		<h3>Let your friends recognize you:</h3>
		<div class='Q_login Q_big_prompt'>
			<?php echo Q_Html::form(Q_Request::baseUrl().'/action.php/Streams/basic', 'post') ?>
			<?php echo Q_Html::hidden(array('token' => $token, 'userId' => $user->id)) ?>
			<?php echo Q::tool('Q/form', array(
					'fields' => array(
						'name' => array(
							'placeholder' => "", 
							'label' => 'Enter your name:'
						),
						'' => array(
							'type' => 'submit', 
							'value' => 'Get Started'
						)
					),
					'onSuccess' => Q_Request::baseUrl()."/{{Streams}}/stream?publisherId={$stream->publisherId}&streamName={$stream->name}"
				), array('id' => 'Streams_Register'));
			?>
			</form>
		</div>
	</div>
</div>

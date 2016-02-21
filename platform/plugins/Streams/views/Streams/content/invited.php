<div id='content'>
	<div class='invited_pane' style='width: 50%'>
		<table class='invited notice'>
			<tr>
				<td>
					<?php echo Q_Html::img(
						$inviting_user->iconUrl('80.png'),
						$inviting_user->username,
						array('class' => 'item_icon')
					) ?>
				</td>
				<td>
					<h2><?php echo $inviting_user_displayName ?> invited you to:</h2>
					<div class='stream_title'><?php echo $stream->title ?></div>
				</td>
			</tr>
		</table>

		<?php if ($user_exists): ?>
			<?php if ($passphrase_set): ?>
				<div class='Q_login Q_big_prompt'>
					<?php echo Q_Html::form(Q_Request::baseUrl().'/action.php/Streams/invited') ?>
					<?php echo Q_Html::formInfo($stream_uri) ?>
					<?php echo Q_Html::hidden(array(
						'token' => $invite->token
					)) ?>
					<?php echo Q::tool('Q/form', array('fields' => array(
						'passphrase' => array(
							'label' => 'Enter your passphrase:',
							'extra' => Q_Html::img(
								$thumbnail_url, 'icon', 
								array('title' => "You can change this later"
							)),
							'type' => 'password'
						),
						'submit' => array(
							'type' => 'submit_buttons', 
							'options' => array('join' => 'Join the chat'),
							'label' => ''
						)
					)))?>
					<?php echo Q_Html::script("
						$('#Q_form_passphrase').focus();
					") ?>
					</form>
				</div>
			<?php else: ?>
				<h2 class='notice' style='text-align: center'>
					Before you can log in, you must set a pass phrase by clicking the link in the message we sent to 
					<?php echo Q_Html::text($address) ?>
				</h2>
				<div style='text-align: center' class='Q_big_prompt`'>
					<?php echo Q_Html::form(Q_Request::baseUrl().'/action.php/Users/resend') ?>
					<?php echo Q_Html::formInfo(Q_Request::url()) ?>
						<?php echo Q_Html::hidden(array('emailAddress' => $user->emailAddress)) ?>
						<button type="submit" class="Users_login_start Q_main_button">Re-send activation message</button>
					</form>
				</div>
			<?php endif; ?>
		<?php else: ?>
			<div class="Q_register Q_big_prompt">
				<?php echo Q_Html::form(Q_Request::baseUrl().'/action.php/Streams/invited') ?>
				<?php echo Q_Html::formInfo($stream_uri) ?>
				<?php echo Q_Html::hidden(array(
					'token' => $invite->token,
					'icon' => $thumbnail_url
				)) ?>
				<?php echo Q::tool('Q/form', array(
					'fields' => $fields
				)) ?>
				</form>
			</div>
		<?php endif; ?>
	</div>
	<?php if ($show_chat): ?>
	<div class='social_pane'>
		<?php echo Q::tool('Streams/participant', compact('stream')) ?>
		<?php echo Q::tool('Streams/player', compact('stream')) ?>
		<?php echo Q::tool('Streams/activity', compact('stream')) ?>
	</div>
	<?php endif;?>
	</tr>
	</table>
</div>

<?php

Q_Response::addScriptLine('
	$(function() { $("#Q_form_username").focus(); })
	Q.addScript(
		[ "plugins/Q/js/jquery-1.11.1.min.js", 
		  "plugins/Q/js/jquery.tools.min.js"], 
		function () {
			$("*[title]").tooltip();
		}
	);
');

?>
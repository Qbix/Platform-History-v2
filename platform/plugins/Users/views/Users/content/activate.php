<div class="Users_activate_container Q_clearfix">
<?php if ($user) : ?>
	<?php if (empty($_REQUEST['p']) and !empty($user->passphraseHash)): ?>
		<div class="Q_admin_pane">
			<?php echo Q::tool('Users/avatar', array(
				'userId' => $user->id,
				'icon' => true
			), 'admin') ?>
			<?php echo Q_Html::form(Q_Dispatcher::uri(), 'post', array('id' => 'Q_activation_form')) ?>
				<?php echo Q::tool('Q/form', array(
					'slotsToRequest' => 'form,user',
					'loader' => array(
						'options' => array(
							'loadExtras' => 'session'
						)
					)
				), 'Users_activate') ?>
				<?php echo Q_Html::formInfo(null) ?>
				<div class='Q_big_prompt'>
					<input type="hidden" name="afterActivate" value="<?php echo $afterActivate ?>">
					<?php if ($code): ?>
						<input type="hidden" name="code" value="<?php echo Q_Html::text($code) ?>">
					<?php else: ?>
						<?php echo Q::text($activate['OneTimeCode']) ?>
						<input name="code" id="single-factor-code-text-field" type="text" autofocus="autofocus" autocomplete="one-time-code">
					<?php endif; ?>
					<input type="hidden" id="activate_identifier" name="<?php echo $t ?>"
						value="<?php echo Q_Html::text($identifier) ?>"
						autocomplete="username">
					<div class='Q_buttons'>
						<button class="Q_button" id="Users_activate_set_emailAddress" type="submit">
							<?php echo Q::text($activate['SetAsPrimary'], array($identifier, $type)) ?>
						</button>
					</div>
				</div>
			</form>
		</div>
		<div class="Q_extra_pane">

		</div>
	<?php else: ?>
		<div class="Q_admin_pane">
				<?php echo Q::tool('Users/avatar', array(
					'icon' => true,
					'userId' => $user->id
				), 'admin') ?>
				<div class='Q_big_prompt'>
					<p style="max-width: 350px;">
					<?php if (empty($_REQUEST['p'])): ?>
						<?php echo Q::interpolate($activate['ChoosePassPhrase']) ?>
					<?php else: ?>
						<?php echo Q::interpolate($activate['ChoosePassPhraseSeeSuggestions']) ?>
					<?php endif; ?>
					</p>
					<?php echo Q_Html::form(Q_Dispatcher::uri(), 'post', array('id' => 'Q_activation_form')) ?>
						<?php echo Q::tool('Q/form', array(
							'slotsToRequest' => 'form,user',
							'loader' => array(
								'options' => array(
									'loadExtras' => 'session'
								)
							)
						), 'Users_activate') ?>
						<?php echo Q_Html::formInfo(null) ?>
						<input type="text" id="activate_identifier" name="<?php echo $autocompleteType ?>"
							value="<?php echo Q_Html::text($identifier) ?>"
							hidden="hidden"
							autocomplete="username <?php echo $autocompleteType ?>">
						<input type="password" id='new-password' name="passphrase" class='password' autofocus placeholder="Enter a passphrase" autocomplete="new-password" /><br>
						<input type="hidden" name="afterActivate" value="<?php echo $afterActivate ?>">
						<input type="hidden" id="activate_identifier" name="<?php echo $t ?>"
							value="<?php echo Q_Html::text($identifier) ?>"
							autocomplete="username">
						<input type="hidden" name="isHashed" value="0" id="Users_login_isHashed">
						<?php if ($code): ?>
							<input type="hidden" name="code" value="<?php echo Q_Html::text($code) ?>">
						<?php else: ?>
							<?php echo Q::text($activate['OneTimeCode']) ?>
							<input name="code" id="single-factor-code-text-field" type="text" autofocus="autofocus" autocomplete="one-time-code"><br>
						<?php endif; ?>
						<div class="Q_buttons">
							<button type="submit" class="Q_button"><?php echo Q_Html::text($activate['ActivateMyAccount']) ?></button>
						</div>
						<?php if (!empty($_REQUEST['p'])): ?>
							<input type="hidden" name="p" value="1">
						<?php endif; ?>
					</form>
				</div>
		</div>
		<div class="Q_extra_pane">
			<h2>Suggestions:</h2>
			<ul id='suggestions'>
				<?php foreach ($suggestions as $s): ?>
					<li class="Users_fromServer"><?php echo Q_Html::text($s) ?></li>
				<?php endforeach ?>
			</ul>
		</div>
	<?php endif; ?>
<?php elseif (Users::loggedInUser()): ?>
	<h1 class="Q_big_message">
		<button id='activate_logoutAndTryAgain' class='Q_button'>
			<?php echo Q::text($activate['LogOutAndTryAgain'])?>
		</button>
	</h1>
	<h1 class='Q_big_message'>
		<?php echo Q::text($activate['IfYouFeel'])?>
		<button id='activate_setIdentifier' class='Q_button'>
			<?php echo Q::text($activate['SetIdentifierButtonTitle'])?>
		</button>
	</h1>
<?php else: ?>
	<h1 class='Q_big_message'>Please try <a href='#' id='activate_login'>logging in</a> to activate your account.</h1>
<?php endif; ?>

<?php Q_Response::addScript('{{Q}}/js/Q.js', 'Q'); ?>
<?php Q_Response::setScriptData('Q.plugins.Users.pages.activate', compact("salt_json", "verb_ue", "noun_ue")); ?>

</div>

<div id="content">
	<div id="Users_authorize_welcome">
		<div>
			<?php echo Q_Html::img($client->iconUrl('200.png'),  'user icon', 
				array('class' => 'Users_app_icon')
			); ?>
			<h2 class="Users_app_name"><?php echo $client->displayName() ?></h2>
			<div id="Users_authorize_what">
				<div class="Users_authorize_community">
					In the
					<?php echo Q_Html::text(Users::communityName()) ?> 
					community,
				</div>
				<?php foreach ($scope as $s): ?> 
					<div class="Users_authorize_scope"> 
						<?php echo Q_Html::text($scopes[$s]) ?> 
					</div>
				<?php endforeach ?>
			</div>
		</div>
	</div>
	<div id="Users_authorize_act" class="Q_big_prompt">
		<form action="" method="post">
			<?php if ($user): ?>
				<?php if ($terms_label): ?>
				<div id="Users_authorize_terms">
					<input type="checkbox" name="agree" id="Users_agree" value="yes">
					<label for="Users_agree"><?php echo $terms_label ?></label>
				</div>
				<?php else: ?>
					<?php echo Q_Response::setScriptData("Q.Users.authorize.noTerms", true) ?>
				<?php endif ?>
				<div id="Users_authorize_buttons">
					<a class="Q_button" name="authorize" id="Users_authorize"><?php echo $authorize['Authorize'] ?></a>
				</div>
			<?php else: ?>
				<div id="Users_authorize_buttons">
					<a class="Q_button" id="Users_login"><?php echo $authorize['GetStarted'] ?></a>
				</div>
			<?php endif; ?>
			<?php echo Q_Html::hidden(@compact('deviceId')) ?>
		</form>
	</div>
</div>

<?php Q_Response::addScript('{{Users}}/js/pages/authorize.js') ?>

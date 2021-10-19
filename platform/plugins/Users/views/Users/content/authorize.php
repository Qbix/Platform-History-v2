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

<?php Q_Response::addScriptLine(<<<EOT

	Q.page('Users/authorize', function () {
		$('.Q_button').plugin('Q/clickable');
		$('#Users_login').on(Q.Pointer.click, _login);
		$('#Users_authorize').on(Q.Pointer.click, _authorize);
		if (!Q.Users.loggedInUser) {
			_login();
		} else if (Q.Users.authorize.automatic) {
			_authorize();
		}
		
		return function () {
			$('#Users_authorize').off(Q.Pointer.click);
			$('#Users_login').off(Q.Pointer.click);
		};
		
		function _login() {
			Q.plugins.Users.login({
				noClose: true,
				onSuccess: { 'Users.login': function (user, options, result, used) {
					Q.handle(window.location.href);
				}}
			});
		}
		
		function _authorize() {
			var fields = {
				authorize: 1
			};
			if ($('#Users_agree').length) {
				if (!$("#Users_agree").attr('checked')) {
					alert(Q.text.Users.authorize.mustAgree);
					return false;
				}
				fields.agree = 'yes';
			}
			$('#Users_authorize').addClass('Q_working');
			Q.each([
				'client_id', 'redirect_uri',
				'state', 'response_type'
			], function (i, field) {
				fields[field] = Q.Users.authorize[field];
			});
			fields.scope = Q.Users.authorize.scope.join(' ');
			Q.req(Q.info.url, 'url', function (err, response) {

			}, {
				method: 'post',
				fields: fields
			});
			return false;
		}
	}, 'Users/authorize');

EOT
) ?>

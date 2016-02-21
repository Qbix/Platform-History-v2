<div id="content">
	<div id="Users_authorize_welcome">
		<div>
			Welcome to
		</div>
		<div>
			<?php echo Q_Html::img($client->iconUrl('80.png'),  'user icon', 
				array('class' => 'Users_app_icon')
			); ?>
			<span class="Users_app_name"><?php echo $client->username ?></span>
		</div>
	</div>
	<div id="Users_authorize_act" class="Q_big_prompt">
		<?php if ($user): ?>
			<form action="" method="post">
				<?php if ($terms_label): ?>
				<div id="Users_authorize_terms">
					<input type="checkbox" name="agree" id="Users_agree" value="yes">
					<label for="Users_agree"><?php echo $terms_label ?></label>
				</div>
				<?php else: ?>
					<?php echo Q_Response::setScriptData("Q.Users.authorize.noTerms", true) ?>
				<?php endif ?>
				<div id="Users_authorize_buttons">
					<a class="Q_button" name="authorize" id="Users_authorize">Authorize</a>
				</div>
			</form>
		<?php else: ?>
			<form action="">
				<div id="Users_authorize_buttons">
					<a class="Q_button" id="Users_login">Get Started</a>
				</div>
			</form>
		<?php endif; ?>
	</div>
</div>

<?php Q_Response::addScriptLine(<<<EOT

	Q.page('Users/authorize', function () {
		$('#Users_login').click(function () {
			Q.plugins.Users.login({
				onSuccess: { 'Users.login': function (user, options, result, used) {
					Q.loadUrl(window.location.href, {
						onActivate: function () {
							if (typeof result === 'string'
							&& Q.Users.authorize.noTerms) {
								// We can auto-authorize in this case.
								$('#Users_authorize').click();
							}
						}
					});
				}}
			});
			return false;
		});
		
		$('#Users_authorize').click(function () {
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
			Q.each([
				'client_id', 'redirect_uri', 'scope',
				'state', 'response_type'
			], function (i, field) {
				fields[field] = location.search.queryField(field);
			});
			Q.req(Q.info.url, 'url', function (err, response) {
				setTimeout(function () {
					location = Q.info.baseUrl;
				}, 1000);
			}, {
				method: 'post',
				fields: fields
			});
			return false;
		});
		
		return function () {
			$('#Users_authorize').unbind('click');
			$('#Users_login').unbind('click');
		};
	}, 'Users/authorize');

EOT
) ?>

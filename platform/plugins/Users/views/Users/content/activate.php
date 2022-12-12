<div class="Users_activate_container Q_clearfix">
<?php if ($user) : ?>
	<?php if (empty($_REQUEST['p']) and !empty($user->passphraseHash)): ?>
		<div class="Q_admin_pane">
			<?php echo Q::tool('Users/avatar', array(
				'userId' => $user->id,
				'icon' => true
			), 'admin') ?>
			<?php echo Q_Html::form(Q_Dispatcher::uri(), 'post', array('id' => 'Q_activation_form')) ?>
				<?php echo Q::tool('Q/form') ?>
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
						<?php echo Q::tool('Q/form') ?>
						<?php echo Q_Html::formInfo(null) ?>
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

<?php Q_Response::addScriptLine(Q::interpolate('jQuery(function() {
	$("#activate_setIdentifier").click(function() { Q.plugins.Users.setIdentifier(); });
	$("#activate_logoutAndTryAgain").click(function () {
		Q.Users.logout({
			onSuccess: function () {
				window.location.reload(true);
			}
		}
	)})
	$("#activate_login").click(function() { Q.plugins.Users.login(); });
	$("#new-password").val("").focus();
	
	Q.addScript("{{Q}}/js/sha1.js");
	
	var $form = $("form");
	$form.data("onBeforeSubmit", new Q.Event());
	var onBeforeSubmit = $form.data("onBeforeSubmit");
	onBeforeSubmit.set(function () {
		var $form = $(this);
		var $input = $form.find("input[name=passphrase]");
		var password = $input.val();
		$("<input type=\"hidden\" name=\"password\">").val(password).appendTo($form);
	});
	$form.on("submit", function (event) {
        if (Q.handle($form.data("onBeforeSubmit"), this) === false) {
            event.stopImmediatePropagation();
            return false;
        }
        
		var salt = {{salt_json}};
		if (!window.CryptoJS || !salt) {
			return;
		}
		var p = $("#new-password");
		var v = p.val();
		if (v && location.protocol !== "https:") {
			if (!/^[0-9a-f]{40}$/i.test(v)) {
				p.val(CryptoJS.SHA1(p.val() + "\t" + salt));
			}
			$("#Users_login_isHashed").attr("value", 1);
		} else {
			$("#Users_login_isHashed").attr("value", 0);
		}
	});
	
	// Get the suggestions from YAHOO, if possible
	
	$("#new-password").plugin("Q/placeholders").plugin("Q/clickfocus");
	
	// this used to work:
	// var url = "http://query.yahooapis.com/v1/public/yql?format=json&diagnostics=false&q=select%20abstract%20from%20search.news%20where%20query%3D%22{{verb_ue}}%22";
	// but YAHOO now deprecated the search.news table.
	// later we can pay for BOSS to do this. But for now, here is what we do:
	var url = "https://query.yahooapis.com/v1/public/yql?format=json&diagnostics=false&q=SELECT+Rating.LastReviewIntro+from+local.search+WHERE+zip+%3D+%2210001%22+AND+%28query%3D%22{{verb_ue}}%22+OR+query%3D%22{{noun_ue}}%22%29+AND+Rating.LastReviewIntro+MATCHES+%22%5E.%2B%22+LIMIT+10";
	
	$(".Users_activate_container .Q_buttons .Q_button").plugin("Q/clickable");

	Q.request(url, null, function(err, data) {
		if (data.query && data.query.results && data.query.results.Result) {
			// var r = data.query.results.result;
			var r = data.query.results.Result;
			var ul = $("#suggestions");
			var rand, text;
			var source = "";
			for (var i=0; i<r.length; ++i) {
				text = r[i].Rating.LastReviewIntro;
				if (text) {
					source += " " + text;
				}
			}
			var source_words = source.toLowerCase().replace(/[^A-Za-z0-9-_\" ]/g, "").split(" ");
			for (var i=0; i<7; ++i) { // add seven quotes from here
				rand = Math.floor(Math.random() * source_words.length);
				var text = source_words.slice(rand, rand+3).join(" ");
				if (text) {
					ul.prepend($("<li />").addClass("Users_fromYahoo").html(text));
					$("li:last", ul).eq(0).remove();
				}
			}
		}

	}, {"callbackName": "callback"});
});', compact("salt_json", "verb_ue", "noun_ue"))); ?>
</div>

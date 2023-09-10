Q.exports(function (Users, priv, _doCancel, _handleXid, _doAuthenticate) {

    /**
     * Users plugin's front end code
     *
     * @module Users
     * @class Users
     */
	/**
	 * Log the user in
	 * @method login
	 * @param {Object} [options] You can pass several options here
	 *  @param {Q.Event} [options.onSuccess] event that occurs when login or authentication "using" a platform is successful. It is passed (user, options, result, used) where user is the Users.User object (null if it was unchanged),
	 options were the options used in the call to Users.login, result is one of "registered", "adopted", "connected" or "authorized" (see Users::authenticate)
	 and 'used' is "native", "web3", or the name of the platform used, such as "facebook"
	 *  @param {Function} [options.onCancel] event that occurs when login or authentication "using" a platform was canceled.
	 *  @param {Function} [options.onResult] event that occurs before either onSuccess, onCancel, or onRequireComplete
	 *  @param {String} [options.successUrl] If the default onSuccess implementation is used, the browser is redirected here. Defaults to Q.uris[Q.info.app+'/home']
	 *  @param  {String} [options.accountStatusURL] if passed, this URL is hit to determine if the account is complete
	 *  @param {Function} [options.onRequireComplete] function to call if the user logged in but account is incomplete.
	 *  It is passed the user information as well as the response from hitting accountStatusURL
	 *  @param {String|Element} [options.explanation] Explanation to prepend to the dialog, inside a container with class Users_login_explanation
	 *  @param {String} [options.using] can be "native", "facebook" or "native,facebook"
	 *  @param {Boolean} [options.skipHint] pass true here to skip calling Users.Pointer.hint when login dialog appears without textbox focus
	 *  @param {Boolean} [options.tryQuietly] if true, this is same as Users.authenticate, with platform = "using" option
	 *  @param {Boolean} [options.unlessLoggedIn] if true, this only proceeds with the login flow if the user isn't already logged in. Can be combined with tryQuietly option.
	 *  @param {Array} [options.scope=['email'] permissions to request from the authentication platform
	 *  @param {String} [options.identifierType="email,mobile"] the type of the identifier, which could be "mobile" or "email" or "email,mobile"
	 *  @param {Object} [options.appIds={}] Can be used to set custom {platform: appId} pairs
	 *  @param {String} [options.identifier] If passed, automatically enters this identifier and clicks the Go button
	 *  @return {Boolean} Whether a login flow has started
	 */
     return function _Users_login(options) {

		var o = Q.extend({}, Users.login.options, options);
		if (o.unlessLoggedIn && Users.loggedInUser) {
			var pn = priv.used || 'native';
			var ret = Q.handle(o.onResult, this, [
				Users.loggedInUser, options, priv.result, pn
			]);
			if (false !== ret) {
				Q.handle(o.onSuccess, this, [
					Users.loggedInUser, options, priv.result, pn
				]);
			}
			return false;
		}

		if (typeof options === 'function') {
			options = {onSuccess: {'options': options}};
			if (arguments.length > 1) {
				options.onRequireComplete = {'Users.login.options': arguments[1]};
			}
		}

		if (typeof o.using === 'string') {
			o.using = o.using.split(',');
		}

		Users.login.occurring = true;

		_doLogin();

		return true;

		function _doLogin() {
			// try quietly, possible only with one of "facebook" or "web3"
			if (o.tryQuietly) {
				var platform = (typeof o.tryQuietly === 'string') ? o.tryQuietly : '';
				if (!platform) {
					var using = (typeof o.using === 'string') ? [o.using] : o.using;
					Q.each(['facebook', 'web3'], function (i, k) {
						if (!using || using.indexOf(k) >= 0) {
							platform = k;
							return;
						}
					});
				}
				Users.authenticate(platform, function (user) {
					_onConnect(user);
				}, function () {
					_onCancel();
				}, o);
				return false;
			}

			priv.result = null;
			priv.used = null;
			priv.login_onConnect = _onConnect;
			priv.login_onCancel = _onCancel;

			// perform actual login
			if (o.using.indexOf('native') >= 0) {
				var usingPlatforms = {};
				Q.each(['web3', 'facebook'], function (i, platform) {
					var appId = (o.appIds && o.appIds[platform]) || Q.info.app;
					if ((o.using.indexOf(platform) >= 0)) {
						usingPlatforms[platform] = appId;	
					}
				});
				// set up dialog
				login_setupDialog(usingPlatforms, o);
				priv.linkToken = null;
				priv.scope = o.scope;
				priv.activation = o.activation;
				$('#Users_login_step1').show();
				$('#Users_login_usingPlatforms').show();
				$('#Users_login_step1_form *').removeAttr('disabled');
				$('#Users_login_identifierType').val(o.identifierType);
			} else if (o.using[0] === 'facebook') { // only facebook used. Open facebook login right away
				var appId = (o.appIds && o.appIds.facebook) || Q.info.app;
				Users.init.facebook(function () {
					Users.Facebook.login(function (response) {
						if (!response.authResponse) {
							_onCancel();
							return;
						}
						if (Q.isEmpty(o.scope)) {
							_authenticate('facebook');
							return;
						}
						// some permissions were requested
						Users.scope('facebook', function (scope, checked) {
							if (!scope) {
								_onCancel(null);
								return;
							}
							for (var i = 0; i < checked.length; ++i) {
								if (!checked[i]) {
									_onCancel(scope); // at least some permission was not granted
									return;
								}
							}
							_authenticate('facebook');
						}, {
							check: o.scope
						});
					});
				}, {
					appId: appId
				});
			} else if (o.using[0] === 'web3') { // only web3 used. Open web3 login right away
				Users.Web3.login(function (result) {
					if (!result) {
						_onCancel();
					} else {
						// do nothing, since we already executed this:
						// _authenticate('web3');
					}
				});
			}

			delete priv.login_connected; // if we connect, it will be filled

		}

		function _onConnect(user) {
			if (user) {
				user.result = priv.result;
				user.used = priv.used;
				user.activateLink = priv.activateLink;
				Users.loggedInUser = new Users.User(user);
				Q.nonce = Q.cookie('Q_nonce') || Q.nonce;
			}
			if (priv.activateLink) {
				Users.Dialogs.activate(priv.activateLink, {
					onSuccess: _activationComplete
				});
			} else {
				_activationComplete();
			}
			function _activationComplete(data) {
				user = Q.getObject('slots.user', data) || user;
				if (!o.accountStatusURL) {
					_onComplete(user, Q.copy(priv));
					return;
				}
				Q.request(o.accountStatusURL, 'accountStatus', function (err, response2) {
					var fem = Q.firstErrorMessage(err, response2);
					if (fem) {
						return alert(fem);
					}
					// DEBUGGING: For debugging purposes
					Users.login.occurring = false;
					if (!o.onRequireComplete
					|| response2.slots.accountStatus === 'complete') {
						_onComplete(user, Q.copy(priv));
					} else if (response2.slots.accountStatus === 'refresh') {
						// we are logged in, refresh the page
						Q.handle(window.location.href);
						return;
					} else {
						// take the user to the profile page which will ask
						// the user to complete their registration process
						// by entering additional information
						if (false !== Q.handle(o.onResult, this, [user, response2, o])) {
							Q.handle(o.onRequireComplete, this, [user, response2, o]);
						}
					}
				});
			}
		}

		// User clicked "cancel" or closed login dialog
		function _onCancel(scope) {
			if (false !== Q.handle(o.onResult, this, [scope, o])) {
				Q.handle(o.onCancel, this, [scope, o]);
			}
			Users.login.occurring = false;
		}

		// login complete - run onSuccess handler
		function _onComplete(user) {
			var pn = priv.used || 'native';
			var ret = Q.handle(o.onResult, this, [user, o, priv, pn]);
			if (false !== ret) {
				Q.handle(o.onSuccess, this, [user, o, priv, pn]);
			}
			Users.onLogin.handle(user);
			Users.login.occurring = false;
		}
	};

	/*
	 * Private functions
	 */
	function login_callback(err, response) {
		var identifier_input = $('#Users_login_identifier');
		var form = $('#Users_login_step1_form');
		identifier_input.attr('tabindex', 1000)
			.css('background-image', 'none');

		if (response.errors) {
			// There were errors
			form.plugin('Q/validator', 'invalidate',
				Q.ajaxErrors(response.errors, ['identifier'])
			);
			identifier_input.plugin('Q/clickfocus');
			return;
		}

		// Remove any errors we may have displayed
		form.plugin('Q/validator', 'reset');
		identifier_input.blur();

		var data = response.slots.data;
		var step2_form;
		var autologin = false;
		var setupRegisterForm = Users.login.options.setupRegisterForm || defaultSetupRegisterForm;
		if (form.data('used') === 'facebook') {
			// logged in with FB
			autologin = true;
			// auto-login by authenticating with facebook
			Users.authenticate('facebook', function (user) {
				var msg = user && user.username ? 'Welcome, ' + user.username + '!' : 'Success!';

				if (step2_form !== undefined) {
					$('button', step2_form).html(msg).attr('disabled', 'disabled');
				}

				if (priv.login_onConnect) {
					priv.login_connected = true;
					priv.activateLink = data && data.activateLink;
					if (login_setupDialog.dialog) {
						Q.Dialogs.pop();
					}
					priv.login_onConnect(user);
				}
			}, function () {
				alert("Could not authenticate with facebook. Try again.");
				Q.Dialogs.pop();
			}, {"prompt": false});
		} else if (!data.exists) {
			// this identifier is available. This user has no password set yet and will activate later
			var identifier = identifier_input.val();
			step2_form = setupResendButton(setupRegisterForm(
				identifier, data, priv, $(login_setupDialog.dialog).data('Q/dialog')
			), identifier);
		} else if (data.passphrase_set) {
			// check password
			step2_form = setupLoginForm();
		} else if (data.verified) {
			// allow the user to gain access by resending an activation message
			step2_form = setupResendForm(true);
		} else {
			// remind to activate -- this is probably a futureUser created using an invite
			step2_form = setupResendForm(false);
		}

		var salt = response.slots.data.salt;

		function onFormSubmit(event) {
			var $this = $(this);
			event.preventDefault();
			if ($this.data('cancelSubmit')) {
				return;
			}
			if (!$this.is(':visible')) {
				return;
			}
			var first_input = $('input:not([type=hidden])', $this)
				.add('button', $this).eq(0);
			var h = $('#Users_login_identifier').outerHeight() - 5;
			$('input', $this).css({
				'background-image': 'url(' + Q.info.imgLoading + ')',
				'background-repeat': 'no-repeat',
				'background-size': 'auto ' + first_input.height() + 'px',
				'background-position': 'right center'
			});
			if (window.CryptoJS) {
				var p = $('#current-password');
				var v = p.val();
				var h = $('#hashed-password');
				if (h.length) {
					h.val(CryptoJS.SHA1(p.val() + "\t" + salt));
					if (!Users.login.options.alsoSendUnhashedPassphrase) {
						p.val('');
					}
				}
			}
			var url = $this.attr('action') + '?' + $this.serialize();
			Q.request(url, 'data', function (err, response) {

				Q.Response.processScriptDataAndLines(response);

				$('#current-password').attr('value', '').trigger('change');
				$('#hashed-password').attr('value', '');

				$('input', $this).css('background-image', 'none');
				if (err || (response && response.errors)) {
					// there were errors
					if (response && response.errors) {
						$this.plugin('Q/validator', 'invalidate',
							Q.ajaxErrors(response.errors, [first_input.attr('name')]
						));
					}
					$('button', $this).removeClass('Q_working').removeAttr('disabled');
					$('#Users_login_identifier').blur();
					first_input.plugin('Q/clickfocus');
					return;
				}

				// success!
				localStorage.setItem(priv._register_localStorageKey, identifier_input.val());
				priv.activateLink = Q.getObject('slots.data.activateLink', response);
				Users.lastSeenNonce = Q.cookie('Q_nonce');
				Users.roles = response.slots.data.roles || {};
				switch ($this.attr('data-form-type')) {
					case 'resend':
						priv.result = 'resend';
						$('button', $this).html('Sent').attr('disabled', 'disabled');
						Q.Dialogs.pop();
						Users.Dialogs.activate(priv.activateLink);
						return;
					case 'register':
						priv.result = 'register';
						break;
				}
				priv.used = $('#Users_login_step1_form').data('used');
				var msg = 'Success!';
				var u;
				if (u = response.slots.data.user) {
					msg = 'Welcome, ' + (u.displayName || u.username) + '!';
				}
				$('button', $this).html(msg).attr('disabled', 'disabled');

				if (priv.login_onConnect) {
					priv.login_connected = true;
					if (login_setupDialog.dialog) {
						Q.Dialogs.pop();
					}
					priv.login_onConnect(u);
				}
			}, {
				method: "post",
				loadExtras: "session"
			});
			return false;
		}

		function setupLoginForm() {
			var passphrase_input = $('<input type="password" name="passphrase" id="current-password" class="Q_password" />')
				.attr('tabindex', 1010)
				.attr('maxlength', Q.text.Users.login.maxlengths.passphrase)
				.attr('maxlength', Q.text.Users.login.maxlengths.passphrase)
				.attr('autocomplete', 'current-password')
				.on('change keyup input', function () {
					$('#Users_login_passphrase_forgot')
						.css('display', $(this).val() ? 'none' : 'inline');
				});
			var passphrase_hashed_input = $('<input type="hidden" name="passphrase_hashed" id="hashed-password" />');
			var $b = $('<a class="Q_button Users_login_start Q_main_button" />')
				.html(Q.text.Users.login.loginButton)
				.on(Q.Pointer.click, function () {
					Users.submitClosestForm.apply(this, arguments);
					return false;
				});
			var login_form = $('<form method="post" />')
				.attr('action', Q.action("Users/login"))
				.attr('data-form-type', 'login')
				.append($("<div id='Users_login_label_div'>").append(
					$('<label for="Users_login_passphrase" />').html(Q.text.Users.login.passphrase)
				)).append(
					$("<div id='Users_login_passphrase_div' >").append(
						passphrase_input,
						passphrase_hashed_input,
						$('<a id="Users_login_passphrase_forgot" href="#forgot"/>')
							.html(Q.text.Users.login.forgot)
							.on(Q.Pointer.touchclick, function () {
								if (Q.text.Users.login.resendConfirm) {
									if (confirm(Q.text.Users.login.resendConfirm)) {
										_resend();
									}
								} else {
									_resend();
								}

								function _resend() {
									Q.req('Users/resend', 'data', function (err, response) {
										Q.Response.processScriptDataAndLines(response);
										$('#Users_login_step1').hide();
										$('#Users_login_step2').empty().append(
											$('<div id="Users_login_resend_success" />').append(
												$('<p />').html(Q.text.Users.login.resendSuccess),
												$('<button class="Q_button Q_main_button" />')
													.html(Q.text.Users.login.resendClose)
													.click(function () {
														$('form', login_setupDialog.dialog)
															.each(function () {
																$(this).plugin('Q/validator', 'reset');
															});
														Q.Dialogs.pop();
														Q.handle(Q.getObject('slots.data.activateLink', response));
													})
											)
										);
									}, {
										method: 'post',
										fields: {identifier: identifier_input.val()}
									});
								};
								return false;
							})
					)
				).append(
					$('<input type="hidden" name="identifier" />').val(identifier_input.val())
				).append(
					$('<div class="Q_buttons"></div>').append($b)
				); // .append($('<input type="hidden" name="isHashed" id="Users_login_isHashed" value="0" />'));
			return login_form;
		}

		function setupResendForm(verified) {
			var reason = verified
				? $('<p id="Users_login_noPassphrase"></p>').html(Q.text.Users.login.noPassphrase)
				: $('<p id="Users_login_notVerified"></p>').html(Q.text.Users.login.notVerified);
			var identifier_form = $('<form method="post" />')
				.attr('action', Q.action("Users/resend"))
				.attr('data-form-type', 'resend')
				.append(reason)
				.append($('<div class="Q_buttons"></div>').append(
					$('<button id="Users_login_resend" class="Q_button Users_login_start Q_main_button" />')
						.html(Q.text.Users.login.resendButton)
						.attr('name', 'resend')
						.click(Users.submitClosestForm)
				)).append($('<input type="hidden" name="identifier" />').val(identifier_input.val()));
			return identifier_form;
		}

		function defaultSetupRegisterForm(identifier, data, priv) {
			var src = data.entry[0].photos && data.entry[0].photos.length ? data.entry[0].photos[0].value : data.entry[0].thumbnailUrl;
			var src40 = src, src50 = src, src80 = src;
			var username = data.entry[0].preferredUsername || data.entry[0].displayName;
			if (priv.registerInfo) {
				if (priv.registerInfo.username) {
					username = priv.registerInfo.username;
				}
				if (priv.registerInfo.pic) {
					src40 = src50 = src = src80 = priv.registerInfo.pic;
				}
			}
			var $img = $('<img />').attr('src', src)
				.attr('title', Q.text.Streams.login.picTooltip);
			var $formContent = $('<div class="Users_login_username_block" />').append(
				$('<label for="Users_login_username" />').html(Q.text.Users.login.prompt)
			).append(
				$('<input id="Users_login_username" name="username" type="text" class="text" />')
					.attr('maxlength', Q.text.Users.login.maxlengths.username)
					.attr('placeholder', Q.text.Users.login.placeholders.username)
					.val(username)
			);
			var $b = $('<button />', {
				"type": "submit",
				"class": "Q_button Q_main_button Users_login_start "
			}).html(Q.text.Users.login.registerButton)
			.on(Q.Pointer.touchclick, function (e) {
				Users.submitClosestForm.apply(this, arguments);
			}).on(Q.Pointer.click, function (e) {
				e.preventDefault(); // prevent automatic submit on click
			});
			var _registering = false;
			var $register_form = $('<form method="post" class="Users_register_form" />')
				.attr('action', Q.action("Users/register"))
				.attr('data-form-type', 'register')
				.append($formContent)
				.append($('<input type="hidden" name="identifier" />').val(identifier))
				.append($('<input type="hidden" name="icon[40.png]" />').val(src40))
				.append($('<input type="hidden" name="icon[50.png]" />').val(src50))
				.append($('<input type="hidden" name="icon[80.png]" />').val(src80))
				.append(
					$('<div class="Users_login_get_started"></div>')
					.append($b)
				).submit(Q.throttle(function () {
					if (_registering) {
						return false;
					}
					var $this = $(this);
					$this.removeData('cancelSubmit');
					$b.addClass('Q_working')[0].disabled = true;
					document.activeElement.blur();
					if (!$('#Users_agree').length || $('#Users_agree').is(':checked')) {
						$this.submit();
						return false;
					}
					setTimeout(function () {
						Q.confirm(Q.text.Users.login.confirmTerms, function (result) {
							if (result) {
								$usersAgree.attr('checked', 'checked');
								$usersAgree[0].checked = true;
								$b.addClass('Q_working')[0].disabled = true;
								$this.submit();
							} else {
								$b.removeClass('Q_working')[0].disabled = false;
							}
						});
					}, 300);
					$this.data('cancelSubmit', true);
					return false;
				}, 1000, false, false));

			if (priv.activation) {
				$register_form.append($('<input type="hidden" name="activation" />').val(priv.activation));
			}

			if (data.termsLabel) {
				$formContent.append(
					$('<div />').attr("id", "Users_register_terms")
						.append($('<input type="checkbox" name="agree" id="Users_agree" value="yes">'))
						.append($('<label for="Users_agree" />').html(data.termsLabel))
				);
			}

			var authResponse;
			var $form = $('#Users_login_step1_form');
			if ($form.data('used') === 'facebook') {
				var platforms = $form.data('platforms');
				var appId = platforms.facebook || Q.info.app;
				var platformAppId = Users.getPlatformAppId('facebook', appId);
				if (!platformAppId) {
					console.warn("Users.defaultSetupRegisterForm: missing Users.apps.facebook." + appId + ".appId");
				}
				Users.init.facebook(function () {
					var k;
					if ((authResponse = Users.Facebook.getAuthResponse())) {
						authResponse.appId = appId;
						authResponse.fbAppId = platformAppId;
						for (k in authResponse) {
							$register_form.append(
								$('<input type="hidden" />')
									.attr('name', 'Q.Users.facebook.authResponse[' + k + ']')
									.attr('value', authResponse[k])
							);
						}
					}
				}, {
					appId: appId
				});
				$register_form.append($('<input type="hidden" name="app[platform]" value="facebook" />'));
			}
			return $register_form[0];
		}

		function setupResendButton(form, identifier) {
			if (!data.emailExists && !data.mobileExists) {
				return form;
			}
			var $p = $('<p id="Users_login_identifierExists" />').html(
				data.emailExists ? Q.text.Users.login.emailExists : Q.text.Users.login.mobileExists
			);
			$('a', $p).plugin('Q/clickable', {
				onInvoke: function () {
					$(this).addClass('Q_working');
					Q.request({identifier: identifier}, Q.action("Users/resend"), 'data',
					function (err, response) {
						priv.login_resent = true;
						Q.Dialogs.pop();
						var activateUrl = Q.getObject('slots.data.activateLink', response);
						Users.Dialogs.activate(activateUrl);
					}, {"method": "post"});
				}
			}).attr('tabindex', 1002);
			if (Q.text.Users.login.newUser) {
				$p.append($('<div />').html(Q.text.Streams.login.newUser));
			}
			$p.prependTo(form);
			return form;
		}

		$('#Users_login_usingPlatforms').hide();
		if (form.data('used')) {
			$('*', form).attr('disabled', 'disabled');
		}
		if (!autologin) {
			var step2 = $('#Users_login_step2').empty().append(step2_form);
			var $dc = step2.closest('.Q_dialog_content');
			$(login_setupDialog.dialog).addClass('Users_login_expanded');
			if (Q.info && Q.info.isTouchscreen) {
				step2.show();
				$(step2_form).plugin('Q/placeholders');
				$('input', step2_form).eq(0).plugin('Q/clickfocus').select();
				_centerIt();
			} else {
				if (localStorage.getItem(priv._register_localStorageKey)) {
					$('.Streams_login_fullname_block, .Streams_login_get_started', step2).hide();
				}
				step2.slideDown('fast', function () {
					$dc.scrollTop($dc[0].scrollHeight - $dc[0].clientHeight);
					_centerIt();
					$(step2_form).plugin('Q/placeholders');
					if ($(step2_form).attr('data-form-type') === 'resend') {
						$('.Q_main_button', step2_form).focus();
					} else if (!Q.info.isTouchscreen) {
						$('input', step2_form).eq(0).plugin('Q/clickfocus').select();
					}
				});
			}
			Q.activate($('#Users_login_step2').get(0));
		}
		$('#Users_login_step1').animate({"opacity": 0.5}, 'fast');
		$('#Users_login_step1 .Q_button').attr('disabled', 'disabled');
		if (!autologin) {
			$(step2_form).plugin('Q/validator').submit(function (e) {
				e.preventDefault();
			}).submit(Q.throttle(onFormSubmit, 1000, false, false));
			$('input', step2_form).add('select', step2_form).on('input', function () {
				$(step2_form).plugin('Q/validator', 'reset', this);
			});
		}
		if (priv.linkToken) {
			$('#Users_login_step1').hide();
		}

		function _centerIt() {
			var $d = $('#Users_login_passphrase_div');
			var $f = $('#Users_login_passphrase_forgot');
			$f.css('bottom', ($d.outerHeight(true) - $f.outerHeight(true)) / 2 + 'px');
		}
	}

	/*
	 * Set up login dialog.
	 * login_setupDialog.dialog will contain the dialog
	 */
	function login_setupDialog(usingPlatforms, options) {
		options = options || {};
		$('#Users_login_step1_form').data('used', null);
		if (login_setupDialog.dialog) {
			return;
		}
		var step1_form = $('<form id="Users_login_step1_form" method="post" autocomplete="on" />');
		var step1_div = $('<div id="Users_login_step1" class="Q_big_prompt" />').html(step1_form);
		var step2_div = $('<div id="Users_login_step2" class="Q_big_prompt" />');
		// step1_form request identifier
		var placeholder = Q.text.Users.login.placeholders.identifier;
		var type = Q.info.useTouchEvents ? 'email' : 'text';
		var parts = options.identifierType ? options.identifierType.split(',') : [];
		if (parts.length === 1) {
			if (parts[0] == 'email') {
				type = 'email';
				placeholder = Q.text.Users.login.placeholders.email;
			} else if (parts[0] == 'mobile') {
				type = 'tel';
				placeholder = Q.text.Users.login.placeholders.mobile;
			}
		} else if (Q.info.isMobile && parts.indexOf('mobile') >= 0
		&& parts.indexOf('email') < 0) {
			type = 'tel';
			placeholder = Q.text.Users.login.placeholders.mobile;
		}
		var autocomplete = (type === 'text') ? 'on' : type;
		Q.addScript("{{Q}}/js/sha1.js");
		var identifierInput = $('<input id="Users_login_identifier" />').attr({
			name: 'identifier',
			autocomplete: autocomplete,
			type: type
		}).attr('maxlength', Q.text.Users.login.maxlengths.identifier)
		.attr('placeholder', placeholder)
		.focus(hideForm2);

		if (type === 'email') {
			identifierInput.attr('name', 'email');
		} else if (type === 'mobile') {
			identifierInput.attr('name', 'phone');
		}

		var $a = $('<a id="Users_login_go" class="Q_button Q_main_button" />')
			.append(
				$('<span id="Users_login_go_span">' + Q.text.Users.login.goButton + '</span>')
			).on(Q.Pointer.click, function (e) {
				e.preventDefault(); // prevent automatic submit on click
				Users.submitClosestForm.apply($a, arguments);
			});

		var d = Q.text.Users.login.directions;
		var directions = options.wasInvited
			? d.WasInvited : (options.noRegister ? d.NoRegister : d.GetStarted);
		step1_form.html(
			$('<label for="Users_login_identifier" />').html(directions)
		).append('<br />').append(
			identifierInput
		).append(
			$('<input id="Users_login_identifierType" type="hidden" name="identifierType" />')
			.val(options.identifierType)
		).append($a)
		.submit(function (event) {
			$('#Users_login_identifier').attr('name', 'identifier');
			if (!$(this).is(':visible')) {
				event.preventDefault();
				return;
			}
			$('.Q_button', $(this)).focus();
			var h = $('#Users_login_identifier').outerHeight() - 5;
			$('#Users_login_identifier').css({
				'background-image': 'url(' + Q.info.imgLoading + ')',
				'background-repeat': 'no-repeat',
				'background-position': 'right center',
				'background-size': 'auto ' + h + 'px'
			}).trigger('Q_refresh');
			var url = Q.action(Users.login.options.userQueryUri) + '?' + $(this).serialize();
			Q.request(url, ['data'], login_callback, {
				xhr: Q.info.useTouchEvents ? 'sync' : {}
			});
			event.preventDefault();
			return;
		}).on('keydown change click input', hideForm2);

		if (Q.info.isTouchscreen) {
			identifierInput.on('keyup', function () {
				var i, found = 0, val = $(this).val();
				if (val.length === 0) return;

				var number = val.replace(/[^0-9]/g, '');
				if ((number[0] === '1' && number.length === 11)
					|| (number[0] !== '1' && number.length === 10)) {
					$(this).blur(); // prepare user to press Go button
					return;
				}

				if (val.indexOf('@') >= 0) {
					var ext = val.split('.').pop();
					var exts = ["com", "net", "org", "edu", "gov", "info", "mil"];
					if (exts.indexOf(ext) >= 0) {
						$(this).blur();
						return;
					}
				}
			});
		}

		step1_form.plugin('Q/validator');
		var step1_usingPlatforms_div = $('<div id="Users_login_usingPlatforms" />');
		var $buttons = $([]);
		for (var platform in usingPlatforms) {
			var appId = usingPlatforms[platform];
			var platformAppId = Users.getPlatformAppId(platform, appId);
			var $button = null;
			switch (platform) {
				case 'facebook':
					if (!platformAppId) {
						console.warn("Users.login: missing Users.apps.facebook." + appId + ".appId");
						break;
					}
					$button = $('<a href="#login_facebook" id="Users_login_with_facebook" />').append(
						$('<img />').attr({
							alt: Q.text.Users.login.facebook.alt,
							src: Q.text.Users.login.facebook.src || Q.url('{{Users}}/img/platforms/facebook.png')
						}),
						$('<div />').text('Facebook')
					).attr('tabindex', 1002)
					.css({'display': 'inline-block', 'vertical-align': 'middle'})
					.click(function () {
						if (location.search.includes('handoff=yes')) {
							var scheme = Q.getObject([Q.info.platform, Q.info.app, 'scheme'], Users.apps);
							location.href = scheme + '#facebookLogin=1';
						} else {
							Users.init.facebook(function () {
								Users.Facebook.usingPlatforms = usingPlatforms;
								Users.Facebook.scope = options.scope;
								Users.Facebook.login();
							}, {
								appId: appId
							});
						}
						return false;
					});
					// Load the facebook script now, so clicking on the facebook button
					// can trigger a popup directly, otherwise popup blockers may complain:
					Q.addScript('https://connect.facebook.net/en_US/sdk.js');
					break;
				case 'web3':
					$button = $('<a href="#login_web3" id="Users_login_with_web3" />').append(
						$('<img />').attr({
							alt: Q.text.Users.login.web3.alt,
							src: Q.text.Users.login.web3Src || Q.url('{{Users}}/img/platforms/web3.png')
						}),
						$('<div />').text(Q.text.Users.platforms.Wallet)
					).attr('tabindex', '1001')
					.css({'display': 'inline-block', 'vertical-align': 'middle'})
					.click(function () {
						if (login_setupDialog.dialog) {
							Q.Dialogs.pop();
						}
						Users.Web3.login(function (result) {
							if (!result) {
								_onCancel();
							} else {
								// do nothing, since we already executed this:
								// _authenticate('web3');
							}
						});
						return false;
					});
					break;
			}
			$buttons = $buttons.add($button);
		}
		if ($buttons.length > 0) {
			step1_usingPlatforms_div.append(
				$("<div class='Users_login_connectPlatforms'> />")
				.text(Q.text.Users.login.connectPlatforms)
			);
			$buttons.each(function () {
				step1_usingPlatforms_div.append(this);
			});
			step1_div.append(step1_usingPlatforms_div);
		}
		setTimeout(function () {
			$('img', step1_usingPlatforms_div).plugin('Q/clickable');
		}, 500);

		$('input', step1_form).add('select', step1_form).on('input', function () {
			step1_form.plugin('Q/validator', 'reset', this);
		});
		
		var $explanation = options.explanation
			? $('<div class="Users_login_explanation" />').append(options.explanation)
			: null;

		login_setupDialog.dialog = Q.Dialogs.push({
			title: Q.text.Users.login.title,
			content: $('<div />').append($explanation, step1_div, step2_div),
			elementId: 'Users_login_dialog',
			className: 'Users_login_dialog Q_scrollToBottom ' + options.className,
			fullscreen: !!options.fullscreen,
			noClose: !!options.noClose,
			closeOnEsc: Q.typeOf(options.closeOnEsc) === 'undefined' ? true : !!options.closeOnEsc,
			beforeLoad: function () {
				$('#Users_login_step1').css('opacity', 1).nextAll().hide();
				setTimeout(function () {
					$('input[type!=hidden]', this).val('').trigger('change');
				}, 0);
			},
			onActivate: function () {
				var $input = $('input[type!=hidden]', this)
				$(this).plugin('Q/placeholders');
				if (Q.info.platform === 'ios') {
					$input.eq(0).plugin('Q/clickfocus');
				}
				setTimeout(function () {
					var registeredIdentifier = localStorage.getItem(priv._register_localStorageKey) || '';
					if (options.identifier) {
						$input.val(options.identifier).trigger('change');
					} else if (registeredIdentifier) {
						$input.val(registeredIdentifier).trigger('change').eq(0).plugin('Q/clickfocus');
						setTimeout(function () {
							Q.Pointer.hint($('#Users_login_go'));
						}, 500);
					} else if (Q.info.isTouchscreen) {
						setTimeout(function () {
							Q.Pointer.hint($input[0]);
						}, 500);
					} else {
						$input.plugin('Q/clickfocus');
					}
				}, 0);
			},
			onClose: function () {
				$('#Users_login_step1 .Q_button').removeAttr('disabled');
				$('form', this).each(function () {
					$(this).plugin('Q/validator', 'reset');
				});
				$('#Users_login_step1').nextAll().hide();
				if (!priv.login_connected
				&& !priv.login_resent
				&& priv.login_onCancel) {
					priv.login_onCancel();
				}
				$(this).remove();
				login_setupDialog.dialog = null;
			}
		});
		function hideForm2() {
			if (priv._submitting) {
				return;
			}
			if ($('#Users_login_step1').next().is(':visible')) {
				$('#Users_login_step1').animate({"opacity": 1}, 'fast');
				$('#Users_login_step1 *').removeAttr('disabled');
			}
			priv.registerInfo = null;
			var $nextAll = $('#Users_login_step1').nextAll();
			if ($nextAll.is(':visible')) {
				$nextAll.slideUp('fast').each(function () {
					$('form', $(this)).plugin('Q/validator', 'reset');
				});
			}
			if ($('#Users_login_usingPlatforms').css('display') === 'none') {
				$('#Users_login_usingPlatforms').css({opacity: 0}).show()
					.animate({opacity: 1}, 'fast');
			}
			$(login_setupDialog.dialog).removeClass('Users_login_expanded');
		}
	}
    
});
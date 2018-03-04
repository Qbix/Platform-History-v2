/**
 * Users plugin's front end code
 *
 * @module Users
 * @class Users
 */
"use strict";
/* jshint -W014 */
(function (Q, $) {

	var Users = Q.Users = Q.plugins.Users = {
		info: {}, // this gets filled when a user logs in
		apps: {}, // this info gets added by the server, on the page
		browserApps: {}, // this info gets added by the server, on the page
		connected: {}, // check this to see if you are connected to a platform
		icon: {
			defaultSize: 40 // might be overridden, but is required by some tools
		}
	};

	var dc = Q.extend.dontCopy;
	dc["Q.Users.User"] = true;

	/**
	 * Text messages used in dialogs
	 * @property Q.text.Users
	 * @type {Object}
	 */
	Q.text.Users = {

		login: {
			title: 'Welcome',
			directions: 'Create an account, or log in.',
			directionsNoRegister: 'Log in if you have an account.',
			explanation: null,
			goButton: "Go",
			passphrase: 'Enter your pass phrase:',
			loginButton: "Get Started",
			registerButton: "Get Started",
			resendButton: "Send Activation Message",
			forgot: "Forgot it?",
			resendConfirm: "Do you want to send a message to reset your passphrase?",
			resendSuccess: "Check for a message to reset your passphrase",
			resendClose: "Close",
			noPassphrase: "Before you can log in, you must set a pass phrase by clicking the link in your activation message.",
			notVerified: "You must send yourself an activation message in order to log in.",
			emailExists: "Did you try to register with this email before? If so, check your inbox to activate your account. <a href='#resend'>Click to re-send the message</a>.",
			mobileExists: "Did you try to register with this mobile number before? If so, check your SMS to activate your account. <a href='#resend'>Click to re-send the message</a>.",
			usingOther: "or you can ",
			facebookSrc: null,
			prompt: "Choose a username:",
			placeholders: {
				identifier: "your mobile # or email",
				mobile: "enter your mobile #",
				email: "enter your email address",
				username: "username"
			},
			maxlengths: {
				identifier: 100,
				username: 32,
				passphrase: 100
			},
			confirmTerms: "Accept the Terms of Service?",
			facebookNoEmail: "Your facebook account is missing a confirmed email address. Simply log in the native way.",
			picTooltip: "You can change this picture later"
		},

		setIdentifier: {
			title: "Add a way to log in",
			sendMessage: "Send Activation Message",
			placeholders: {
				identifier: "enter your mobile # or email",
				mobile: "enter your mobile number",
				email: "enter your email address",
				username: "username"
			}
		},

		prompt: {
			title: "{$Platform} Account",
			areUsing: "You are using {$platform} as",
			noLongerUsing: "You are no longer connected to {$platform} as",
			doAuth: "Log in with this account",
			doSwitch: "Switch to this account"
		},

		authorize: {
			mustAgree: "First you must agree to the terms."
		},

		audio: {
			allowMicrophoneAccess: "Please allow access to your microphone",
			record: "Record",
			recording: "Recording",
			remains: "remains",
			maximum: "maximum",
			playing: "Playing",
			recorded: "Recorded",
			clip: "clip",
			orupload: "Or Upload",
			usethis: "Use This",
			discard: "Discard",
			encoding: "Encoding"
		}

	};

	var priv = {};

	/**
	 * This event is fired if an error occurs in any Users function
	 * @event onError
	 * @param {Mixed} err
	 * @param {Mixed} err2
	 */
	Users.onError = new Q.Event(function (err, err2) {
		console.warn(Q.firstErrorMessage(err, err2));
	}, 'Users.onError');

	/**
	 * This event is fired when a device has been registered for a logged-in user.
	 * @event onDevice
	 * @param {Object} device See Users_Device
	 */
	Users.onDevice = new Q.Event(function (response) {
		console.log("Device registered for user with id " + Users.loggedInUserId());
	}, 'Users.onError');

	/**
	 * Initialize facebook by adding FB script and running FB.init().
	 * Ensures that this is done only once
	 * @method initFacebook
	 * @param {Function} callback , This function called after Facebook init completed
	 * @param {Object} options for overriding the options passed to FB.init , and also
	 *   @param {String} [options.appId=Q.info.app] Only needed if you have multiple apps on platform
	 */
	Users.initFacebook = function (callback, options) {

		var appId = (options && options.appId) || Q.info.app;
		var fbAppId = Q.getObject(['facebook', appId, 'appId'], Users.apps);
		if (!fbAppId) {
			throw new Q.Error("Users.initFacebook: missing facebook app info for '" + appId + "'");
		}

		/*	Q.onReady.add(function () {
				Q.extend(window.FB, window.facebookConnectPlugin);
			});*/

		// should be only called once per app
		if (Users.initFacebook.completed[Q.info.app]) {
			callback && callback();
			return;
		}

		function _init() {
			if (!Users.initFacebook.completed[appId] && fbAppId) {
				FB.init(Q.extend({
					appId: fbAppId,
					version: 'v2.8',
					status: true,
					cookie: true,
					oauth: true,
					xfbml: true
				}, Users.initFacebook.options, options));
				Users.onInitFacebook.handle(Users, window.FB, [appId]);
			}
			Users.initFacebook.completed[appId] = true;
			callback && callback();
		}

		if (!$('#fb-root').length) {
			$('body').prepend($('<div id="fb-root"></div>'));
		}
		Q.addScript(
			'https://connect.facebook.net/en_US/sdk.js',
			_init,
			{
				onError: function () {
					console.log("Couldn't load script:", this, arguments);
				}
			}
		);
	};
	Users.initFacebook.completed = {};
	Users.initFacebook.options = {
		frictionlessRequests: true
	};

	/**
	 * You can wrap all uses of FB object with this
	 * @method initFacebook.ready
	 * @param {String} [appId=Q.info.app] only specify this if you have multiple facebook apps
	 * @param {Function} callback this function called after Facebook application access token or user status response
	 */
	Users.initFacebook.ready = function (appId, callback) {
		if (typeof appId === 'function') {
			callback = appId;
			appId = Q.info.app;
		}
		if (Users.initFacebook.completed[appId]) {
			_proceed();
		} else {
			Users.onInitFacebook.set(_proceed, "Users.initFacebook.ready");
		}

		function _proceed() {
			if (Users.Facebook.getAccessToken()) {
				callback();
			} else {
				Users.Facebook.getLoginStatus(function (response) {
					callback();
				});
			}
		}
	};

	/**
	 * Authenticates this session with a given platform
	 * @method authenticate
	 * @param {String} platform Currently only supports "facebook", "ios" or "android"
	 * @param {Function} onSuccess Called if the user successfully authenticates with the platform, or was already authenticated.
	 *  It is passed the user information if the user changed.
	 * @param {Function} onCancel Called if the authentication was canceled.
	 * @param {Object} [options] object of parameters for authentication function
	 *   @param {Function|Boolean} [options.prompt=null] which shows the usual prompt unless it was already rejected once.
	 *     Can be false, in which case the user is never prompted and the authentication just happens.
	 *     Can be true, in which case the usual prompt is shown even if it was rejected before.
	 *     Can be a function with an onSuccess and onCancel callback, in which case it's used as a prompt.
	 *   @param {Boolean} [options.force] forces the getLoginStatus to refresh its status
	 *   @param {String} [options.appId=Q.info.app] Only needed if you have multiple apps on platform
	 */
	Users.authenticate = function (platform, onSuccess, onCancel, options) {
		var handler = Users.authenticate.handlers[platform];
		if (!handler) {
			var handlers = Object.keys(Users.authenticate.handlers);
			throw new Q.Error(
				"Users.authenticate: platform must be one of " + handlers.join(', ')
			);
		}
		Users.authenticate.occurring = true;
		return handler.call(this, platform, onSuccess, onCancel, options);
	};
	
	Users.authenticate.handlers = {};
	
	Users.authenticate.handlers.ios = 
	Users.authenticate.handlers.android = function (platform, onSuccess, onCancel, options) {
		_doAuthenticate({
			udid: Q.info.udid, // TODO: sign this with private key
			platform: platform
		}, platform, onSuccess, onCancel, options);
	};
	
	Users.authenticate.handlers.facebook = function (platform, onSuccess, onCancel, options) {
		options = options || {};
		var fields = {};

		var appId = options.appId || Q.info.app;
		var fbAppId = Q.getObject(['facebook', appId, 'appId'], Users.apps);
		if (!fbAppId) {
			console.warn("Users.authenticate: missing Users.apps.facebook." + appId + ".appId");
			return;
		}

		// make sure facebook is initialized
		Users.initFacebook(function () {
			// check if user is connected to facebook
			Users.Facebook.getLoginStatus(function (response) {
				function __doCancel(x) {
					_doCancel.call(this, x, platform, onSuccess, onCancel, options);
				}

				if (response.status === 'connected') {
					var fb_uid = parseInt(response.authResponse.userID);
					var ignoreUid = parseInt(Q.cookie('Users_ignorePlatformUid'));
					// the following line prevents multiple prompts for the same user,
					// which can be a problem especially if the authenticate() is called
					// multiple times on the same page, or because the page is reloaded
					Q.cookie('Users_ignorePlatformUid', fb_uid);

					if (Users.loggedInUser && Users.loggedInUser.uids.facebook === fb_uid) {
						// The correct user is already logged in.
						// Call onSuccess but do not pass a user object -- the user didn't change.
						_doSuccess(null, platform, onSuccess, onCancel, options);
						return;
					}
					if (options.prompt === undefined || options.prompt === null) {
						// show prompt only if we aren't ignoring this facebook uid
						if (fb_uid === ignoreUid) {
							_doCancel(null, platform, onSuccess, onCancel, options);
						} else {
							Users.prompt('facebook', fb_uid, __doAuthenticate, __doCancel);
						}
					} else if (options.prompt === false) {
						// authenticate without prompting
						__doAuthenticate();
					} else if (options.prompt === true) {
						// show the usual prompt no matter what
						Users.prompt('facebook', fb_uid, __doAuthenticate, __doCancel);
					} else if (typeof options.prompt === 'function') {
						// custom prompt
						options.prompt('facebook', fb_uid, __doAuthenticate, __doCancel);
					} else {
						Users.authenticate.occurring = false;
						throw new Q.Error("Users.authenticate: options.prompt is the wrong type");
					}
				} else if (fbAppId) {
					// let's delete any stale facebook cookies there might be
					// otherwise they might confuse our server-side authentication.
					Q.cookie('fbs_' + fbAppId, null, {path: '/'});
					Q.cookie('fbsr_' + fbAppId, null, {path: '/'});
					_doCancel(null, platform, onSuccess, onCancel, options);
				}
				
				function __doCancel(x) {
					_doCancel.call(this, x, platform, onSuccess, onCancel, options);
				}

				function __doAuthenticate() {
					if (!Users.Facebook.getAuthResponse()) {
						// in some rare cases, the user may have logged out of facebook
						// while our prompt was visible, so there is no longer a valid
						// facebook authResponse. In this case, even though they want
						// to authenticate, we must cancel it.
						alert("Connection to facebook was lost. Try connecting again.");
						_doCancel(null, platform, onSuccess, onCancel, options);
						return;
					}
					var ar = response.authResponse;
					ar.expires = Math.floor(Date.now() / 1000) + ar.expiresIn;
					ar.fbAppId = fbAppId;
					ar.appId = appId;
					fields['Q.Users.facebook.authResponse'] = ar;
					fields.platform = 'facebook';
					_doAuthenticate(fields, platform, onSuccess, onCancel, options);
				}
			}, options.force ? true : false);
		}, {
			appId: appId
		});
	};
	
	function _doSuccess(user, platform, onSuccess, onCancel, options) {
		// if the user hasn't changed then user is null here
		Users.connected[platform] = true;
		Users.onConnected.handle.call(Users, platform, user, options);
		Q.handle(onSuccess, this, [user, options]);
		Users.authenticate.occurring = false;
	}

	function _doCancel(ignoreUid, platform, onSuccess, onCancel, options) {
		if (ignoreUid) {
			// NOTE: the following line makes us ignore this uid
			// until the user explicitly wants to connect.
			// This usually has the right effect -- because the user
			// doesn't want to see the prompt all the time.
			// However, sometimes if the user is already logged in
			// and then the javascript discovers that the platform connection was lost,
			// the user will not be prompted to restore it when it becomes available again.
			// They will have to do it explicitly (calling Users.authenticate with prompt: true)
			Q.cookie('Users_ignorePlatformUid', ignoreUid);
		}
		delete Users.connected[platform];
		Users.onConnectionLost.handle.call(Users, platform, options);
		Q.handle(onCancel, Users, [options]);
		Users.authenticate.occurring = false;
	}
	
	function _doAuthenticate(fields, platform, onSuccess, onCancel, options) {
		Q.req('Users/authenticate', 'data', function (err, response) {
			var fem = Q.firstErrorMessage(err, response);
			if (fem) {
				alert(fem);
				return _doCancel(null, platform, onSuccess, onCancel, options);
			}
			var user = response.slots.data;
			if (user.authenticated !== true) {
				priv.result = user.authenticated;
			}
			priv.used = platform;
			user.result = user.authenticated;
			user.used = platform;
			Users.loggedInUser = new Users.User(user);
			Q.nonce = Q.cookie('Q_nonce');
			_doSuccess(user, platform, onSuccess, onCancel, options);
		}, {
			method: "post",
			fields: fields
		});
	}

	/**
	 * Used when platform user is logged in to platform but not to app.
	 * Shows prompt asking if user wants to log in to the app as platform user.
	 * @method prompt
	 * @param {String} platform For now, only "facebook" is supported
	 * @param {String} uid The platform uid
	 * @param {Function} authCallback , this function will be called after user authentication
	 * @param {Function} cancelCallback , this function will be called if user closed social platform login window
	 * @param {object} options
	 *     @param {DOMElement} [options.dialogContainer=document.body] param with jQuery identifier of dialog container
	 * @param {Object} options
	 *   @param {String} [options.appId=Q.info.app] Only needed if you have multiple apps on platform
	 */
	Users.prompt = function (platform, uid, authCallback, cancelCallback, options) {
		if (platform !== 'facebook') {
			throw new Q.Error("Users.authenticate prompt: The only supported platform for now is facebook");
		}

		var appId = (options && options.appId) || Q.info.app;
		var fbAppId = Q.getObject(['facebook', appId, 'appId'], Users.apps);

		if (!Users.prompt.overlay) {
			Q.addStylesheet(Q.url('{{Users}}/css/Users.css'), {slotName: 'Users'});
			var o = Q.extend({}, Users.prompt.options, options);
			var title = Q.text.Users.prompt.title
				.replace(/{\$platform}/g, platform)
				.replace(/{\$Platform}/g, platform.toCapitalized());
			var areUsing = Q.text.Users.prompt.areUsing
				.replace(/{\$platform}/g, platform)
				.replace(/{\$Platform}/g, platform.toCapitalized());
			var noLongerUsing = Q.text.Users.prompt.noLongerUsing
				.replace(/{\$platform}/g, platform)
				.replace(/{\$Platform}/g, platform.toCapitalized());
			var caption;
			var tookAction = false;

			var content_div = $('<div />');
			var fb_uid;
			if (fb_uid = Q.getObject(['loggedInUser', 'identifiers', 'facebook'], Users)) {
				content_div.append(_usingInformation(fb_uid, noLongerUsing));
				caption = Q.text.Users.prompt.doSwitch
					.replace(/{\$platform}/, platform)
					.replace(/{\$Platform}/, platform.toCapitalized());
			} else {
				caption = Q.text.Users.prompt.doAuth
					.replace(/{\$platform}/, platform)
					.replace(/{\$Platform}/, platform.toCapitalized());
			}
		}

		var appId = (options && options.appId) || Q.info.app;
		var fbAppId = Q.getObject(['facebook', appId, 'appId'], Users.apps);

		if (!Users.prompt.overlay) {
			Q.addStylesheet(Q.url('{{Users}}/css/Users.css'));
			var o = Q.extend({}, Users.prompt.options, options);
			var title = Q.text.Users.prompt.title
				.replace(/{\$platform}/g, platform)
				.replace(/{\$Platform}/g, platform.toCapitalized());
			var areUsing = Q.text.Users.prompt.areUsing
				.replace(/{\$platform}/g, platform)
				.replace(/{\$Platform}/g, platform.toCapitalized());
			var noLongerUsing = Q.text.Users.prompt.noLongerUsing
				.replace(/{\$platform}/g, platform)
				.replace(/{\$Platform}/g, platform.toCapitalized());
			var caption;
			var tookAction = false;

			var content_div = $('<div />');
			var fb_uid;
			if (fb_uid = Q.getObject(['loggedInUser', 'identifiers', 'facebook'], Users)) {
				content_div.append(_usingInformation(fb_uid, noLongerUsing));
				caption = Q.text.Users.prompt.doSwitch
					.replace(/{\$platform}/, platform)
					.replace(/{\$Platform}/, platform.toCapitalized());
			} else {
				caption = Q.text.Users.prompt.doAuth
					.replace(/{\$platform}/, platform)
					.replace(/{\$Platform}/, platform.toCapitalized());
			}
			content_div.append(_usingInformation(uid, areUsing))
				.append(_authenticateActions(caption));

			Users.prompt.overlay = $('<div id="Users_prompt_overlay" class="Users_prompt_overlay" />');
			var titleSlot = $('<div class="Q_title_slot" />');
			titleSlot.append($('<h2 class="Users_dialog_title Q_dialog_title" />').html(title));
			var dialogSlot = $('<div class="Q_dialog_slot Q_dialog_content">');
			dialogSlot.append(content_div);
			Users.prompt.overlay.append(titleSlot).append(dialogSlot)
				.prependTo(o.dialogContainer);
		}
		Q.Dialogs.push({
			dialog: Users.prompt.overlay,
			alignByParent: true,
			doNotRemove: true,
			onActivate: function () {
				Users.initFacebook(function () {
					FB.XFBML.parse(content_div.get(0));
				}, {
					appId: appId
				});
			},
			onClose: function () {
				if (!tookAction) {
					if (cancelCallback) cancelCallback(uid);
				}
				tookAction = false;
			}
		});

		function _usingInformation(uid, explanation) {
			return $("<table />").append(
				$("<tr />").append(
					$("<td class='Users_profile_pic' />").html(
						"<fb:profile-pic uid='" + uid + "' linked='false' size='square' class='fb_profile_pic'></fb:profile-pic>"
					)
				).append(
					$("<td class='Users_explanation_name' />").append(
						$("<div class='Users_explanation' />").html(explanation)
					).append(
						"<fb:name uid='" + uid + "' useyou='false' linked='false' size='square' class='fb_name'>user id " + uid + "</fb:name>"
					)
				)
			);
		}

		function _authenticateActions(caption) {
			return $("<div class='Users_actions Q_big_prompt' />").append(
				$('<button type="submit" class="Q_button Q_main_button" />').html(caption)
					.click(function () {
						tookAction = true;
						Users.prompt.overlay.data('Q/overlay').close();
						authCallback();
					})
			);
		}
	};


	/**
	 * Check permissions granted by platform.
	 * Currently only facebook is supported.
	 * @method scope
	 * @param {String} platform For now, only "facebook" is supported
	 * @param {Function} callback this function will be called after getting permissions
	 *   from the external platform. The first parameter is the raw data returned.
	 *   The second parameter is an array of Boolean corresponding to the scope names in
	 *   options.check, indicating whether they were granted.
	 * Callback parameter could be null or response object from social platform
	 * @param {Object} options
	 *   @param {String} [options.appId=Q.info.app] Only needed if you have multiple apps on platform
	 *   @param {Array} [options.check=[]] Scopes to check.
	 */
	Users.scope = function (platform, callback, options) {
		if (platform !== 'facebook') {
			throw new Q.Error("Users.scope: The only supported platform for now is facebook");
		}
		var appId = (options && options.appId) || Q.info.app;
		var fbAppId = Q.getObject(['facebook', appId, 'appId'], Users.apps);
		Users.initFacebook(function () {
			if (!Users.Facebook.getAuthResponse()) {
				callback(null);
			}
			FB.api('/me/permissions', function (response) {
				if (response && response.data) {
					var checked = [];
					Q.each(options && options.check, function (i, s) {
						var granted = false;
						for (var i = 0, l = response.data.length; i < l; ++i) {
							if (response.data[i].permission === s
								&& response.data[i].status) {
								granted = true;
							}
						}
						checked.push(granted);
					});
					callback(response.data, checked);
				} else {
					callback(null);
				}
			});
		}, {
			appId: appId
		});
	};

	/**
	 * Log the user in
	 * @method login
	 * @param {Object} [options] You can pass several options here
	 *  @param {Q.Event} [options.onSuccess] event that occurs when login or authentication "using" a platform is successful. It is passed (user, options, result, used) where user is the Users.User object (null if it was unchanged),
	 options were the options used in the call to Users.login, result is one of "registered", "adopted", "connected" or "authorized" (see Users::authenticate)
	 and 'used' is "native", or the name of the platform used, such as "facebook".
	 *  @param {Function} [options.onCancel] event that occurs when login or authentication "using" a platform was canceled.
	 *  @param {Function} [options.onResult] event that occurs before either onSuccess, onCancel, or onRequireComplete
	 *  @param {String} [options.successUrl] If the default onSuccess implementation is used, the browser is redirected here. Defaults to Q.uris[Q.info.app+'/home']
	 *  @param  {String} [options.accountStatusUrl] if passed, this URL is hit to determine if the account is complete
	 *  @param {Function} [options.onRequireComplete] function to call if the user logged in but account is incomplete.
	 *  It is passed the user information as well as the response from hitting accountStatusUrl
	 *  @param {String} [options.using] can be "native", "facebook" or "native,facebook"
	 *  @param {Boolean} [options.tryQuietly] if true, this is same as Users.authenticate, with platform = "using" option
	 *  @param {Boolean} [options.unlessLoggedIn] if true, this only proceeds with the login flow if the user isn't already logged in. Can be combined with tryQuietly option.
	 *  @param {Array} [options.scope=['email','public_profile','user_friends'] permissions to request from the authentication platform
	 *  @param {String} [options.identifierType="email,mobile"] the type of the identifier, which could be "mobile" or "email" or "email,mobile"
	 *  @param {Object} [options.appIds={}] Can be used to set custom {platform: appId} pairs
	 */
	Users.login = function (options) {

		var o = Q.extend({}, Users.login.options, options);
		if (o.unlessLoggedIn && Users.loggedInUser) {
			return _onConnect(Users.loggedInUser);
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

		if (o.using.indexOf('native') < 0) {
			_doLogin();
		} else {
			$.fn.plugin.load('Q/dialog', _doLogin);
		}

		return false;

		function _doLogin() {

			var dest;

			// try quietly, possible only with facebook
			if (o.tryQuietly) {
				if (o.using.indexOf('facebook') >= 0) {
					o.force = true;
					Users.authenticate('facebook', function (user) {
						_onConnect(user);
					}, function () {
						_onCancel();
					}, o);
				}
				return false;
			}

			priv.result = null;
			priv.used = null;

			// perform actual login
			if (o.using.indexOf('native') >= 0) {
				var appId = (o.appIds && o.appIds.facebook) || Q.info.app;
				var usingPlatforms = (o.using.indexOf('facebook') >= 0)
					? {facebook: appId}
					: {};
				// set up dialog
				login_setupDialog(usingPlatforms, o.scope, o.dialogContainer, o.identifierType);
				priv.login_onConnect = _onConnect;
				priv.login_onCancel = _onCancel;
				priv.linkToken = null;
				priv.scope = o.scope;
				priv.activation = o.activation;
				var d = login_setupDialog.dialog;
				if (d.css('display') == 'none') {
					d.data('Q/dialog').load();
				}
				$('#Users_login_step1').show();
				$('#Users_login_usingPlatforms').show();
				$('#Users_login_step1_form *').removeAttr('disabled');
				$('#Users_login_identifierType').val(o.identifierType);
			} else if (o.using[0] === 'facebook') { // only facebook used. Open facebook login right away
				Users.initFacebook(function () {
					var opts = o.scope ? {scope: o.scope.join(',')} : undefined;
					FB.login(function (response) {
						if (!response.authResponse) {
							_onCancel();
							return;
						}
						if (Q.isEmpty(o.scope)) {
							_success();
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
							_success();

							function _success() {
								Users.authenticate('facebook', function (user) {
									_onConnect(user);
								}, function () {
									_onCancel();
								}, {"prompt": false});
							}
						}, {
							check: o.scope
						});
					}, opts);
				}, {
					appId: appId
				});
			}

			delete priv.login_connected; // if we connect, it will be filled

		}

		function _onConnect(user) {
			if (user) {
				user.result = priv.result;
				user.used = priv.used;
				Users.loggedInUser = new Users.User(user);
				Q.nonce = Q.cookie('Q_nonce');
			}
			if (!o.accountStatusUrl) {
				_onComplete(user);
				return;
			}
			Q.request(o.accountStatusUrl, 'accountStatus', function (err, response2) {
				var fem = Q.firstErrorMessage(err, response2);
				if (fem) {
					return alert(fem);
				}
				// DEBUGGING: For debugging purposes
				Users.login.occurring = false;
				if (!o.onRequireComplete
					|| response2.slots.accountStatus === 'complete') {
					_onComplete(user);
				} else if (response2.slots.accountStatus === 'refresh') {
					// we are logged in, refresh the page
					Q.handle(window.location);
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

		// User clicked "cancel" or closed login dialog
		function _onCancel(scope) {
			if (false !== Q.handle(o.onResult, this, [scope, o])) {
				Q.handle(o.onCancel, this, [scope, o]);
			}
			Users.login.occurring = false;
		}

		// login complete - run onSuccess handler
		function _onComplete(user) {
			Users.onLogin.handle(user);
			var pn = priv.used || 'native';
			var ret = Q.handle(o.onResult, this, [user, o, priv.result, pn]);
			if (false !== ret) {
				Q.handle(o.onSuccess, this, [user, o, priv.result, pn]);
			}
			Users.login.occurring = false;
		}
	};

	/**
	 * Log the user out
	 * @method logout
	 * @param {Object} [options] You can pass several options here
	 *  It is passed the user information if the user changed.
	 *  @param {String} [options.url] the URL to hit to log out. You should usually not change this.
	 *  @param {String} [options.using] can be "native" or "native,facebook" to log out of both
	 *  @param {Q.Event} [options.onSuccess] event that occurs when logout is successful.
	 *  @param {String} [options.welcomeUrl] the URL of the page to show on a successful logout
	 */
	Users.logout = function (options) {
		if (typeof options === 'function') {
			options = {onSuccess: {'options': options}};
		}
		var o = Q.extend({}, Users.logout.options, options);
		if (typeof o.using === 'string') {
			o.using = o.using.split(',');
		}

		Users.logout.occurring = true;

		function callback(err, response) {
			if (response && response.slots && response.slots.script) {
				// This script is coming from our server - it's safe.
				try {
					eval(response.slots.script);
				} catch (e) {
					alert(e);
				}
			}
			setTimeout(function () {
				Users.logout.occurring = false;
			}, 0);
			Users.lastSeenNonce = Q.cookie('Q_nonce');
			Users.roles = {};
			var appId = o.appId || Q.info.app;
			if (fbAppId && o.using.indexOf('facebook') >= 0) {
				var fbAppId = Q.getObject(['facebook', appId, 'appId'], Users.apps);
				if (!fbAppId) {
					console.warn("Users.logout: missing Users.apps.facebook." + appId + ".appId");
				}
				Q.cookie('fbs_' + fbAppId, null, {path: '/'});
				Q.cookie('fbsr_' + fbAppId, null, {path: '/'});
				if ((o.using[0] === 'native' || o.using[1] === 'native')) {
					Users.loggedInUser = null;
					Q.nonce = Q.cookie('Q_nonce'); // null
				}
				Users.initFacebook(function logoutCallback() {
					Users.Facebook.getLoginStatus(function (response) {
						if (response.authResponse) {
							FB.logout(function () {
								delete Users.connected.facebook;
								Users.onLogout.handle.call(this, o);
								Q.handle(o.onSuccess, this, [o]);
							});
						} else {
							Users.onLogout.handle.call(this, o);
							Q.handle(o.onSuccess, this, [o]);
						}
					}, true);
				}, {
					appId: appId
				});
			} else {
				// if we log out without logging out of facebook,
				// then we should ignore the logged-in user's fb_uid
				// when authenticating, until it is forced
				var fb_uid = Q.getObject(['loggedInUser', 'identifiers', 'facebook'], Users);
				if (fb_uid) {
					Q.cookie('Users_ignorePlatformUid', fb_uid);
				}
				Users.loggedInUser = null;
				Q.nonce = Q.cookie('Q_nonce');
				Users.onLogout.handle.call(this, o);
				Q.handle(o.onSuccess, this, [o]);
			}
		}

		if (!o.url) {
			callback();
			return false;
		}

		var url = o.url + (o.url.indexOf('?') < 0 ? '?' : '') + '&logout=1';
		Q.request(url, 'script', callback, {"method": "post"});
		return true;
	};

	/**
	 * A shorthand way to get the id of the logged-in user, if any
	 * @method loggedInUserId
	 * @static
	 * @return {String} the id of the logged-in user, or the empty string if not logged in
	 */
	Users.loggedInUserId = function () {
		return Users.loggedInUser ? Users.loggedInUser.id : '';
	};

	/**
	 * Users batch getter.
	 * @method get
	 * @param {String} userId The user's id
	 * @param {Function} callback
	 *    if there were errors, first parameter is an array of errors
	 *  otherwise, first parameter is null and second parameter is a Users.User object
	 */
	Users.get = function (userId, callback) {
		var func = Users.batchFunction(Q.baseUrl({
			userIds: userId
		}), 'user', ['userIds']);
		func.call(this, userId, function Users_get_response_handler(err, data) {
			var msg = Q.firstErrorMessage(err, data);
			if (!msg && !data.user) {
				msg = "Users.get: no such user";
			}
			if (msg) {
				Users.onError.handle.call(this, msg, err, data.user);
				Users.get.onError.handle.call(this, msg, err, data.user);
				return callback && callback.call(this, msg);
			}
			var user = new Users.User(data.user);
			callback.call(user, err, user);
		});
	}
	Users.get.onError = new Q.Event();

	/**
	 * Constructs a user from fields, which are typically returned from the server.
	 * @method User
	 * @param {String} fields
	 */
	Users.User = function (fields) {
		Q.extend(this, fields);
		this.typename = 'Q.Users.User';
	};

	/**
	 * Calculate the url of a user's icon
	 * @method
	 * @param {Number} [size=40] the size of the icon to render.
	 * @return {String} the url
	 */
	Users.User.prototype.iconUrl = function Users_User_iconUrl(size) {
		return Users.iconUrl(this.icon.interpolate({
			userId: this.id.splitId()
		}), size);
	};

	Users.User.get = Users.get;

	/**
	 * Calculate the url of a user's icon
	 * @method
	 * @param {String} icon the value of the user's "icon" field
	 * @param {String|Number} [basename=40] The last part after the slash, such as "50.png"
	 * @return {String} the url
	 */
	Users.iconUrl = function Users_iconUrl(icon, basename) {
		if (!icon) {
			console.warn("Users.iconUrl: icon is empty");
			return '';
		}
		if (!basename || basename === true) {
			basename = '40';
		}
		basename = (String(basename).indexOf('.') >= 0) ? basename : basename + '.png';
		var src = Q.interpolateUrl(icon + '/' + basename);
		return src.isUrl() || icon.substr(0, 2) === '{{'
			? src
			: Q.url('{{Users}}/img/icons/' + src);
	};

	function _constructUser(fields) {
		var user = new Users.User(fields);

		// update the Users.get cache
		Users.get.cache.removeEach(fields.id);
		if (fields.id) {
			Users.get.cache.set(
				[fields.id], 0,
				user, [null, user]
			);
		}
	}

	Users.batchFunction = function Users_batchFunction(baseUrl, action, fields) {
		return Q.batcher.factory(
			Users.batchFunction.functions, baseUrl,
			"/action.php/Users/" + action, "batch", "batch",
			{
				preprocess: function (args) {
					var i, j, obj = {}, field;
					for (i = 0; i < args.length; ++i) {
						for (j = 0; j < fields.length; ++j) {
							field = fields[j];
							obj[field] = obj[field] || [];
							obj[field].push(args[i][j]);
						}
					}
					return obj;
				}
			}
		);
	};
	Users.batchFunction.functions = {};

	Q.onActivate.set(function (elem) {
		$(elem || document).off('click.Users').on('click.Users', 'a', function (e) {
			var href = $(this).attr('href');
			if (!Users.requireLogin || !Users.requireLogin[href]) {
				return;
			}
			if (Users.requireLogin[href] === 'facebook') {
				if (!Users.connected.facebook) {
					// note: the following may automatically log you in
					// if you authorized this app with facebook
					// and you are already logged in with facebook.
					Users.login({
						'using': 'facebook',
						onSuccess: href
					});
					e.preventDefault();
				}
			} else if (Users.requireLogin[href] === true) {
				Users.login({
					onSuccess: href
				});
				e.preventDefault();
			}
		});
	}, 'Users');

	Users.importContacts = function (platform) {
		window.open(Q.action("Users/importContacts?platform=" + platform), "import_contacts", "scrollbars,resizable,width=700,height=500");
	};

	/**
	 * Displays a dialog allowing the user to set a different identifier
	 * (email address, mobile number, etc.) as their primary login method
	 * @method setIdentifier
	 * @param {Object} [options] You can pass several options here
	 *  It is passed the user information if the user changed.
	 *  @param {String} [options.identifierType] the type of the identifier, which could be "mobile" or "email" or "email,mobile"
	 *  @param {String} [options.userId] You can set this to the id of a user in the database who doesn't have any email or mobile number set yet. This can happen if the user was e.g. invited via a printed invitation and lost it, and allows someone to help set up the first identifier for that user.
	 *  @param {Q.Event} [options.onSuccess] event that occurs on success
	 *  @param {Q.Event} [options.onCancel] event that occurs if the dialog is canceled
	 *  @param {Function} [options.onResult] event that occurs before either onSuccess or onCancel
	 */
	Users.setIdentifier = function (options) {
		var o = Q.extend({}, Users.setIdentifier.options, options);

		function onSuccess(user) {
			if (false !== Q.handle(o.onResult, this, [user])) {
				Q.handle(o.onSuccess, this, [user]);
			}
		}

		function onCancel(scope) {
			if (false !== Q.handle(o.onResult, this, [scope])) {
				Q.handle(o.onCancel, this, [scope]);
			}
		}

		priv.setIdentifier_onSuccess = onSuccess;
		priv.setIdentifier_onCancel = onCancel;

		$.fn.plugin.load(['Q/dialog', 'Q/placeholders'], function () {
			setIdentifier_setupDialog(o.identifierType, o);
			var d = setIdentifier_setupDialog.dialog;
			if (d.css('display') == 'none') {
				d.data('Q/dialog').load();
			}
			$('#Users_setIdentifier_type').val(o.identifierType);
		});
	};

	/*
	 * Private functions
	 */
	function login_callback(err, response) {
		var identifier_input = $('#Users_login_identifier');
		var form = $('#Users_login_step1_form');
		identifier_input.css('background-image', 'none');

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

		var json = response.slots.data;
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
					if (setIdentifier_setupDialog.dialog) {
						setIdentifier_setupDialog.dialog.data('Q/dialog').close();
					}
					if (login_setupDialog.dialog) {
						login_setupDialog.dialog.data('Q/dialog').close();
					}
					priv.login_onConnect(user);
				}
			}, function () {
				alert("Could not authenticate with facebook. Try again.");
				if (login_setupDialog.dialog) {
					login_setupDialog.dialog.data('Q/dialog').close();
				}
			}, {"prompt": false});
		} else if (!json.exists) {
			// no username available. This user has no password set yet and will activate later
			step2_form = setupRegisterForm(identifier_input.val(), json, priv, login_setupDialog.dialog.data('Q/dialog'));
		} else if (json.passphrase_set) {
			// check password
			step2_form = setupLoginForm();
		} else if (json.verified) {
			// let the user gain access by resending an activation message
			step2_form = setupResendForm(true);
		} else {
			// remind to activate -- this is probably a futureUser created using an invite
			step2_form = setupResendForm(false);
		}

		var userId = response.slots.data.exists;

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
				var p = $('#Users_form_passphrase');
				var v = p.val();
				if (v) {
					if (!/^[0-9a-f]{40}$/i.test(v)) {
						p.val(CryptoJS.SHA1(p.val() + "\t" + userId));
					}
					$('#Users_login_isHashed').attr('value', 1);
				} else {
					$('#Users_login_isHashed').attr('value', 0);
				}
			}
			var url = $this.attr('action') + '?' + $this.serialize();
			Q.request(url, 'data', function (err, response) {

				$('#Users_form_passphrase').attr('value', '').trigger('change');

				$('input', $this).css('background-image', 'none');
				if (err || (response && response.errors)) {
					// there were errors
					if (response && response.errors) {
						$this.plugin('Q/validator', 'invalidate',
							Q.ajaxErrors(response.errors, [first_input.attr('name')]
							));
					}
					$('#Users_login_identifier').blur();
					first_input.plugin('Q/clickfocus');
					return;
				}
				// success!
				Users.lastSeenNonce = Q.cookie('Q_nonce');
				Users.roles = response.slots.data.roles || {};
				switch ($this.data('form-type')) {
					case 'resend':
						$('button', $this).html('Sent').attr('disabled', 'disabled');
						login_setupDialog.dialog.data('Q/dialog').close();
						return;
					case 'register':
						priv.result = 'registered';
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
						login_setupDialog.dialog.data('Q/dialog').close();
					}
					priv.login_onConnect(response.slots.data.user);
				}
			}, {"method": "post"});
		}

		function setupLoginForm() {
			var passphrase_input = $('<input type="password" name="passphrase" id="Users_form_passphrase" class="Q_password" />')
				.attr('maxlength', Q.text.Users.login.maxlengths.passphrase)
				.attr('maxlength', Q.text.Users.login.maxlengths.passphrase)
				.attr('autocomplete', 'current-password')
				.on('change keyup input', function () {
					$('#Users_login_passphrase_forgot')
						.css('display', $(this).val() ? 'none' : 'inline');
				});
			var $b = $('<a class="Q_button Users_login_start Q_main_button" />')
				.html(Q.text.Users.login.loginButton)
				.on(Q.Pointer.start, function () {
					Users.submitClosestForm.apply(this, arguments);
					return false;
				});
			var login_form = $('<form method="post" />')
				.attr('action', Q.action("Users/login"))
				.data('form-type', 'login')
				.append($("<div id='Users_login_label_div'>").append(
					$('<label for="Users_login_passphrase" />').html(Q.text.Users.login.passphrase)
				)).append(
					$("<div id='Users_login_passphrase_div' >").append(
						passphrase_input,
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
									Q.req('Users/resend', 'data', function (err) {
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
														login_setupDialog.dialog.data('Q/dialog').close();
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
				).append($('<input type="hidden" name="isHashed" id="Users_login_isHashed" value="0" />'));
			return login_form;
		}

		function setupResendForm(verified) {
			var explanation = verified
				? $('<p id="Users_login_noPassphrase"></p>').html(Q.text.Users.login.noPassphrase)
				: $('<p id="Users_login_notVerified"></p>').html(Q.text.Users.login.notVerified);
			var identifier_form = $('<form method="post" />')
				.attr('action', Q.action("Users/resend"))
				.data('form-type', 'resend')
				.append(explanation)
				.append($('<div class="Q_buttons"></div>').append(
					$('<button id="Users_login_resend" class="Q_button Users_login_start Q_main_button" />')
						.html(Q.text.Users.login.resendButton)
						.attr('name', 'resend')
						.click(submitClosestForm)
				)).append($('<input type="hidden" name="identifier" />').val(identifier_input.val()));
			return identifier_form;
		}

		function defaultSetupRegisterForm(identifier, json, priv, dialog) {
			var src = json.entry[0].photos && json.entry[0].photos.length ? json.entry[0].photos[0].value : json.entry[0].thumbnailUrl;
			var src40 = src, src50 = src, src80 = src;
			var username = json.entry[0].preferredUsername || json.entry[0].displayName;
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
			var td, table = $('<table />').append(
				$('<tr />').append(
					$('<td class="Users_login_picture" />').append($img)
				).append(
					td = $('<td class="Users_login_username_block" />').append(
						$('<label for="Users_login_username" />').html(Q.text.Users.login.prompt)
					).append(
						$('<input id="Users_login_username" name="username" type="text" class="text" />')
							.attr('maxlength', Q.text.Users.login.maxlengths.username)
							.attr('placeholder', Q.text.Users.login.placeholders.username)
							.val(username)
							.width($('#Users_login_identifier').width() - 30)
					)
				)
			);
			var register_form = $('<form method="post" class="Users_register_form" />')
				.attr('action', Q.action("Users/register"))
				.data('form-type', 'register')
				//.append($('<div class="Users_login_appear" />'))
				.append(table)
				.append($('<input type="hidden" name="identifier" />').val(identifier))
				.append($('<input type="hidden" name="icon[40.png]" />').val(src40))
				.append($('<input type="hidden" name="icon[50.png]" />').val(src50))
				.append($('<input type="hidden" name="icon[80.png]" />').val(src80))
				.append($('<div class="Users_login_get_started">&nbsp;</div>')
					.append(
						$('<button type="submit" class="Q_button Users_login_start Q_main_button" />')
							.html(Q.text.Users.login.registerButton)
					)).submit(function () {
					var $this = $(this);
					$this.removeData('cancelSubmit');
					document.activeElement.blur();
					if (!$('#Users_agree').is(':checked')) {
						$this.data('cancelSubmit', true);
						setTimeout(function () {
							if (confirm(Q.text.Users.login.confirmTerms)) {
								$('#Users_agree').attr('checked', 'checked');
								$this.submit();
							}
						}, 300);
					}
				});

			if (priv.activation) {
				register_form.append($('<input type="hidden" name="activation" />').val(priv.activation));
			}

			if (json.termsLabel) {
				td.append(
					$('<div />').attr("id", "Users_register_terms")
						.append($('<input type="checkbox" name="agree" id="Users_agree" value="yes">'))
						.append($('<label for="Users_agree" />').html(json.termsLabel))
				);
			}

			var authResponse;
			var $form = $('#Users_login_step1_form');
			if ($form.data('used') === 'facebook') {
				var platforms = $form.data('platforms');
				var appId = platforms.facebook || Q.info.app;
				var fbAppId = Q.getObject(['facebook', appId, 'appId'], Users.apps);
				if (!fbAppId) {
					console.warn("Users.defaultSetupRegisterForm: missing Users.apps.facebook." + appId + ".appId");
				}
				Users.initFacebook(function () {
					var k;
					if ((authResponse = Users.Facebook.getAuthResponse())) {
						authResponse.appId = appId;
						authResponse.fbAppId = fbAppId;
						for (k in authResponse) {
							register_form.append(
								$('<input type="hidden" />')
									.attr('name', 'Q.Users.facebook.authResponse[' + k + ']')
									.attr('value', authResponse[k])
							);
						}
					}
				}, {
					appId: appId
				});
				register_form.append($('<input type="hidden" name="app[platform]" value="facebook" />'));
			}
			if (json.emailExists || json.mobileExists) {
				var p = $('<p id="Users_login_identifierExists" />')
					.html(
						json.emailExists ? Q.text.Users.login.emailExists : Q.text.Users.login.mobileExists
					);
				$('a', p).click(function () {
					$.post(
						Q.ajaxExtend(Q.action("Users/resend"), 'data'),
						'identifier=' + encodeURIComponent(identifier_input.val()),
						function () {
							dialog.close();
						}
					);
					return false;
				});
				register_form.append(p);
			}
			return register_form;
		}

		$('#Users_login_usingPlatforms').hide();
		if (form.data('used')) {
			$('*', form).attr('disabled', 'disabled');
		}
		if (!autologin) {
			var step2 = $('#Users_login_step2').html(step2_form);
			var $dc = step2.closest('.Q_dialog_content');
			if (Q.info && Q.info.isTouchscreen) {
				step2.show();
				$dc.scrollTop($dc[0].scrollHeight - $dc[0].clientHeight);
				if (!Q.info.isAndroid()) {
					step2_form.plugin('Q/placeholders');
				}
				$('input', step2_form).eq(0).plugin('Q/clickfocus').select();
				_centerIt();
			} else {
				step2.slideDown('fast', function () {
					$dc.scrollTop($dc[0].scrollHeight - $dc[0].clientHeight);
					_centerIt();
					step2_form.plugin('Q/placeholders');
					if (step2_form.data('form-type') === 'resend') {
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
			step2_form.plugin('Q/validator').submit(function (e) {
				e.preventDefault();
			}).submit(Q.throttle(onFormSubmit, 300));
			$('input', step2_form).add('select', step2_form).on('input', function () {
				step2_form.plugin('Q/validator', 'reset', this);
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
	function login_setupDialog(usingPlatforms, scope, dialogContainer, identifierType) {
		$('#Users_login_step1_form').data('used', null);
		if (login_setupDialog.dialog) {
			return;
		}
		var step1_form = $('<form id="Users_login_step1_form" method="post" autocomplete="on" />');
		var step1_div = $('<div id="Users_login_step1" class="Q_big_prompt" />').html(step1_form);
		var step2_div = $('<div id="Users_login_step2" class="Q_big_prompt" />');
		// step1_form request identifier
		var placeholder = Q.text.Users.login.placeholders.identifier;
		var type = Q.info.isTouchscreen ? 'email' : 'text';
		var parts = identifierType ? identifierType.split(',') : [];
		if (parts.length === 1) {
			if (parts[0] == 'email') {
				type = 'email';
				placeholder = Q.text.Users.login.placeholders.email;
			} else if (parts[0] == 'mobile') {
				type = 'tel';
				placeholder = Q.text.Users.login.placeholders.mobile;
			}
		}
		var autocomplete = (type === 'text') ? 'on' : type;
		Q.addScript("{{Q}}/js/sha1.js");
		var identifierInput = $('<input id="Users_login_identifier" />').attr({
			name: 'identifier',
			autocomplete: autocomplete,
			type: type
		}).attr('maxlength', Q.text.Users.login.maxlengths.identifier)
			.attr('placeholder', placeholder)
			.attr('autocomplete', 'username')
			.focus(hideForm2);

		if (type === 'email') {
			identifierInput.attr('name', 'email');
		} else if (type === 'mobile') {
			identifierInput.attr('name', 'phone');
		}

		var $a = $('<a class="Q_button Users_login_go Q_main_button" />')
			.append(
				$('<span id="Users_login_go_span">' + Q.text.Users.login.goButton + '</span>')
			).on(Q.Pointer.touchclick, function () {
				submitClosestForm.apply($a, arguments);
			}).on(Q.Pointer.click, function (e) {
				e.preventDefault(); // prevent automatic submit on click
			});

		var directions = Q.plugins.Users.login.serverOptions.noRegister
			? Q.text.Users.login.directionsNoRegister
			: Q.text.Users.login.directions;
		step1_form.html(
			$('<label for="Users_login_identifier" />').html(directions)
		).append('<br />').append(
			identifierInput
		).append(
			$('<input id="Users_login_identifierType" type="hidden" name="identifierType" />').val(identifierType)
		).append('&nbsp;')
			.append($a)
			.append(
				$('<div id="Users_login_explanation" />').html(Q.text.Users.login.explanation)
			).submit(function (event) {
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
				xhr: Q.info.isTouchscreen ? 'sync' : {}
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
		var platformCount = 0;
		for (var platform in usingPlatforms) {
			var appId = usingPlatforms[platform];
			switch (platform) {
				case 'facebook':
					var fbAppId = Q.getObject(['facebook', appId, 'appId'], Users.apps);
					if (!fbAppId) {
						console.warn("Users.login: missing Users.apps.facebook." + appId + ".appId");
						break;
					}
					++platformCount;
					var facebookLogin = $('<a href="#login_facebook" id="Users_login_with_facebook" />').append(
						$('<img alt="login with facebook" />')
							.attr('src', Q.text.Users.login.facebookSrc || Q.url('{{Users}}/img/facebook-login.png'))
					).css({'display': 'inline-block', 'vertical-align': 'middle'})
						.click(function () {
							Users.initFacebook(function () {
								Users.Facebook.usingPlatforms = usingPlatforms;
								Users.Facebook.scope = scope;
								Users.Facebook.login();
							}, {
								appId: appId
							});
							return false;
						});
					step1_usingPlatforms_div.append(Q.text.Users.login.usingOther).append(facebookLogin);
					// Load the facebook script now, so clicking on the facebook button
					// can trigger a popup directly, otherwise popup blockers may complain:
					Q.addScript('https://connect.facebook.net/en_US/sdk.js');
					break;
			}
		}
		if (platformCount) {
			step1_div.append(step1_usingPlatforms_div);
		}

		$('input', step1_form).add('select', step1_form).on('input', function () {
			step1_form.plugin('Q/validator', 'reset', this);
		});

		var dialog = $('<div id="Users_login_dialog" class="Users_login_dialog" />');
		var titleSlot = $('<div class="Q_title_slot" />');
		titleSlot.append($('<h2 class="Users_dialog_title Q_dialog_title" />').html(Q.text.Users.login.title));
		var dialogSlot = $('<div class="Q_dialog_slot Q_dialog_content">');
		dialogSlot.addClass('Q_scrollToBottom')
			.append(step1_div, step2_div);
		login_setupDialog.dialog = dialog;
		dialog.append(titleSlot)
			.append(dialogSlot)
			.prependTo(dialogContainer)
			.plugin('Q/dialog', {
				alignByParent: true,
				fullscreen: false,
				beforeLoad: function () {
					$('#Users_login_step1').css('opacity', 1).nextAll().hide();
					$('input[type!=hidden]', dialog).val('');
				},
				onActivate: function () {
					dialog.plugin('Q/placeholders');
					$('input[type!=hidden]', dialog).eq(0).val('').plugin('Q/clickfocus');
				},
				onClose: function () {
					$('#Users_login_step1 .Q_button').removeAttr('disabled');
					$('form', dialog).each(function () {
						$(this).plugin('Q/validator', 'reset');
					});
					$('#Users_login_step1').nextAll().hide();
					if (!priv.login_connected && priv.login_onCancel) {
						priv.login_onCancel();
					}
					$(this).remove();
					login_setupDialog.dialog = null;
				}
			});

		function hideForm2() {
			if (_submitting) {
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
		}
	}

	function setIdentifier_callback(err, response) {
		var identifier_input = $('#Users_setIdentifier_identifier');
		var form = $('#Users_setIdentifier_step1_form');
		identifier_input.css('background-image', 'none');

		var msg = Q.firstErrorMessage(err, response);
		if (msg) {
			// There were errors
			Q.handle(priv.setIdentifier_onCancel, this, [err, response]);
			form.plugin('Q/validator', 'invalidate',
				Q.ajaxErrors(response.errors, 'identifier')
			);
			identifier_input.plugin('Q/clickfocus');
			return;
		}

		// Remove any errors we may have displayed
		form.plugin('Q/validator', 'reset');

		Q.handle(priv.setIdentifier_onSuccess);

		setIdentifier_setupDialog.dialog.data('Q/dialog').close();
	}

	function setIdentifier_setupDialog(identifierType, options) {
		var options = options || {};
		var placeholder = Q.text.Users.setIdentifier.placeholders.identifier;
		var type = Q.info.isTouchscreen ? 'email' : 'text';
		var parts = identifierType ? identifierType.split(',') : [];
		if (parts.length === 1) {
			if (parts[0] == 'email') {
				type = 'email';
				placeholder = Q.text.Users.setIdentifier.placeholders.email;
			} else if (parts[0] == 'mobile') {
				type = 'tel';
				placeholder = Q.text.Users.setIdentifier.placeholders.mobile;
			}
		}

		var step1_form = $('<form id="Users_setIdentifier_step1_form" />');
		var step1_div = $('<div id="Users_setIdentifier_step1" class="Q_big_prompt" />').html(step1_form);

		var autocomplete = (type === 'text') ? 'on' : type;
		step1_form.empty().append(
			$('<input id="Users_setIdentifier_identifier" />').attr({
				name: 'identifier',
				autocomplete: autocomplete,
				type: type
			}).attr('maxlength', Q.text.Users.login.maxlengths.identifier)
				.attr('placeholder', placeholder)
		).append(
			$('<input id="Users_setIdentifier_type" type="hidden" name="identifierType" />').val(identifierType)
		).append(
			$('<div class="Q_buttons"/>').html(
				$('<button type="submit" class="Q_button Users_setIdentifier_go Q_main_button" />').html(
					Q.text.Users.setIdentifier.sendMessage
				)
			)
		).submit(function (event) {
			var h = $('#Users_setIdentifier_identifier').outerHeight() - 5;
			;
			$('#Users_setIdentifier_identifier').css({
				'background-image': 'url(' + Q.info.imgLoading + ')',
				'background-repeat': 'no-repeat',
				'background-position': 'right center',
				'background-size': 'auto ' + h + 'px'
			});
			var url = Q.action('Users/identifier') + '?' + $(this).serialize();
			Q.request(url, 'data', setIdentifier_callback, {"method": "post"});
			event.preventDefault();
			return;
		});
		if (options.userId) {
			step1_form.append($('<input />').attr({
				type: "hidden",
				name: "userId",
				value: options.userId
			}));
		}
		step1_form.plugin('Q/validator');

		var dialog = $('<div id="Users_setIdentifier_dialog" class="Users_setIdentifier_dialog" />');
		var titleSlot = $('<div class="Q_title_slot">').append(
			$('<h2 class="Users_dialog_title Q_dialog_title" />')
				.html(options.title || Q.text.Users.setIdentifier.title)
		);
		var dialogSlot = $('<div class="Q_dialog_slot Q_dialog_content">').append(step1_div);
		dialog.append(titleSlot).append(dialogSlot).prependTo(options.dialogContainer);
		dialog.plugin('Q/dialog', {
			alignByParent: true,
			fullscreen: false,
			beforeLoad: function () {
				$('input[type!=hidden]', dialog).val('');
			},
			onActivate: function () {
				dialog.plugin('Q/placeholders');
				$('input[type!=hidden]', dialog).eq(0).val('').plugin('Q/clickfocus');
			},
			onClose: function () {
				$('form', dialog).each(function () {
					$(this).plugin('Q/validator', 'reset');
				});
				if (priv.setIdentifier_onCancel) {
					priv.setIdentifier_onCancel();
				}
				$(this).remove();
				setIdentifier_setupDialog.dialog = null;
			}
		});

		setIdentifier_setupDialog.dialog = dialog;
	}

	var _submitting = false;
	var submitClosestForm = Users.submitClosestForm = function submitClosestForm() {
		_submitting = true;
		$(this).closest('form').submit();
		setTimeout(function () {
			_submitting = false;
		}, 500);
		return false;
	}

	/**
	 * Votes for something
	 * @static
	 * @method hint
	 * @param {String} forType The type of thing to vote for
	 * @param {String} forId The id of thing to vote for
	 * @param {Number} [value=1] the value the user has voted for, such as a rating etc.
	 * @param {Element|Object} elementOrPoint Indicates where to display the hint. A point should contain properties "x" and "y".
	 * @param {Object} [options] possible options, which can include:
	 * @param {String} [options.src] the url of the image
	 * @param {Point} [options.hotspot={x:0.5,y:0.4}] "x" and "y" represent the location of the hotspot within the image, using fractions between 0 and 1
	 * @param {String} [options.width="200px"]
	 * @param {String} [options.height="200px"]
	 * @param {Number} [options.zIndex=99999]
	 * @return {Boolean} Returns true if the hint with will be shown, or false if a hint with this key was already shown before.
	 */
	Users.vote = function (forType, forId, value) {
		var fields = {
			forType: forType,
			forId: forId
		};
		if (value !== undefined) {
			fields.value = value;
		}
		Q.req('Users/vote', ['vote'], function (err, result) {
			var msg = Q.firstErrorMessage(err, result && result.errors);
			if (msg) {
				return console.warn(msg);
			}
		}, {method: 'POST', fields: fields});
	};

	/**
	 * Places a hint to click or tap on the screen
	 * @static
	 * @method hint
	 * @param {String} key A key to ensure the hint appears only the first time for each user. Check Users.hinted to see if this has happened.
	 * @param {Element|Object|Array} elementsOrPoints Indicates where to display the hint. A point should contain properties "x" and "y". Can also be an array of elements or points.
	 * @param {String} [options.src] the url of the hint pointer image
	 * @param {Point} [options.hotspot={x:0.5,y:0.3}] "x" and "y" represent the location of the hotspot within the image, using fractions between 0 and 1
	 * @param {String} [options.width="200px"]
	 * @param {String} [options.height="200px"]
	 * @param {Integer} [options.zIndex=99999]
	 * @param {boolean} [option.dontStopBeforeShown=false] Don't let Q.Pointer.stopHints stop this hint before it's shown.
	 * @param {Boolean} [options.dontRemove=false] Pass true to keep current hints displayed
	 * @param {String} [options.audio.src] Can be used to play an audio file.
	 * @param {String} [options.audio.from=0] Number of seconds inside the audio to start playing the audio from. Make sure audio is longer than this.
	 * @param {String} [options.audio.until] Number of seconds inside the audio to play the audio until. Make sure audio is longer than this.
	 * @param {String} [options.audio.removeAfterPlaying] Whether to remove the audio object after playing
	 * @param {Integer} [options.show.delay=500] How long to wait after the function call (or after audio file has loaded and starts playing, if one was specified) before showing the hint animation
	 * @param {Integer} [options.show.initialScale=10] The initial scale of the hint pointer image in the show animation
	 * @param {Integer} [options.show.duration=500] The duration of the hint show animation
	 * @param {Function} [options.show.ease=Q.Animation.ease.smooth]
	 * @param {Integer} [options.hide.duration=500] The duration of the hint hide animation
	 * @param {Function} [options.hide.ease=Q.Animation.ease.smooth]
	 */
	Users.hint = function (key, elementOrPoint, options) {
		if (!elementOrPoint || !Users.loggedInUser || Users.hinted.indexOf(key) >= 0) {
			return false;
		}
		Q.Pointer.hint(elementOrPoint, options);
		Users.hinted.push(key);
		Users.vote('Users/hinted', key);
		return true;
	};

	/**
	 * Makes a dialog that resembles a facebook dialog
	 * @method facebookDialog
	 * @param {Object} [options] A hash of options, that can include:
	 *  @param {String} [options.title] Dialog title.
	 *  @required
	 *  @param {String} [options.content] Dialog content, can be plain text or some html.
	 *  @required
	 *  @param {Array} [options.buttons] Array of object containing fields:
	 *  @required
	 *    @param {String} [options.buttons.label] is the label of the button
	 *    @param {Function} [options.buttons.handler] is a click handler for the button
	 *    @param {Boolean} [options.buttons.default] is a boolean which makes this button styled as default.
	 *  @param {Object} [options.position] Hash of x/y coordinates. By default (or if null) dialog is centered on the screen.
	 *  @optional
	 *  @param {Boolean} [options.shadow]
	 *  Whether to make a full screen shadow behind the dialog, making other elements on the page inaccessible.
	 *  @default false
	 */
	Users.facebookDialog = function (options) {
		$('.Users_facebookDialog').remove();
		$('.Users_facebookDialog_shadow').remove();

		var o = $.extend({
			'position': null,
			'shadow': false,
			'title': 'Needs a title',
			'content': 'Needs content',
			'buttons': {}
		}, options);

		if (o.shadow) {
			var shadow = $('<div class="Users_facebookDialog_shadow" />');
			$('body').append(shadow);
		}
		var dialog = $('<div class="Users_facebookDialog">' +
			'<div class="Users_facebookDialog_title">' + o.title + '</div>' +
			'<div class="Users_facebookDialog_content">' + o.content + '</div>' +
			'</div>');
		var buttonsBlock = $('<div class="Users_facebookDialog_buttons" />');
		Q.each(o.buttons, function (k, b) {
			function _buttonHandler(handler) {
				return function () {
					if (handler) {
						handler(dialog);
					} else {
						alert("Users.facebookDialog has no click handler for this button");
						dialog.close();
					}
				};
			}

			var button = $('<button />')
				.html(b.label || 'Needs a label')
				.click(_buttonHandler(b.handler))
				.appendTo(buttonsBlock);
			if (b['default']) {
				button.addClass('Q_button Users_facebookDialog_default_button');
			}
		});
		dialog.append(buttonsBlock);
		$('body').append(dialog);
		if (o.position) {
			dialog.css({
				left: o.position.x + 'px',
				top: o.position.y + 'px'
			});
		} else {
			dialog.css({
				left: ((Q.Pointer.windowHeight() - dialog.width()) / 2) + 'px',
				top: ((Q.Pointer.windowHeight() - dialog.height()) / 2) + 'px'
			});
		}
		dialog.show();

		dialog.close = function () {
			dialog.remove();
			if (typeof(shadow) != 'undefined') {
				shadow.remove();
			}
		};
	};

	/**
	 * Get a user's contacts
	 * @method getContacts
	 * @static
	 * @param {String} userId
	 * @param {Array|String} [labels]
	 * @param {String|Array} [contactUserIds]
	 * @param {Function} callback
	 */
	Users.getContacts = function (userId, labels, contactUserIds, callback) {
		if (typeof labels === 'function') {
			callback = labels;
			labels = contactUserIds = undefined;
		} else if (typeof contactUserIds === 'function') {
			callback = contactUserIds;
			contactUserIds = undefined;
		}
		Q.req('Users/contact', 'contacts', function (err, data) {
			var msg = Q.firstErrorMessage(err, data);
			if (msg) {
				Users.onError.handle.call(this, msg, err, data.contacts);
				Users.get.onError.handle.call(this, msg, err, data.contacts);
				return callback && callback.call(this, msg);
			}
			Q.each(data.slots.contacts, function (i) {
				data.slots.contacts[i] = new Users.Contact(data.slots.contacts[i]);
			});
			Q.handle(callback, data, [err, data.slots.contacts]);
		}, {
			fields: {
				userId: userId,
				labels: labels,
				contactUserIds: contactUserIds
			},
			method: 'post'
		});
	};

	/**
	 * Get a user's contact labels
	 * @method getLabels
	 * @static
	 * @param {String} userId
	 * @param {String} [prefix] Pass any prefix here, to filter labels by this prefix
	 * @param {Function} callback
	 */
	Users.getLabels = function (userId, prefix, callback) {
		if (typeof prefix === 'function') {
			callback = prefix;
			prefix = undefined;
		}
		Q.req('Users/label', 'labels', function (err, data) {
			var msg = Q.firstErrorMessage(err, data);
			if (msg) {
				Users.onError.handle.call(this, msg, err, data.labels);
				Users.get.onError.handle.call(this, msg, err, data.labels);
				return callback && callback.call(this, msg);
			}
			Q.each(data.slots.labels, function (i) {
				data.slots.labels[i] = new Users.Label(data.slots.labels[i]);
			});
			Q.handle(callback, data, [err, data.slots.labels]);
		}, {
			fields: {
				userId: userId,
				labels: prefix
			},
			method: 'post'
		});
	};

	/**
	 * Constructs a contact from fields, which are typically returned from the server.
	 * @class Users.Contact
	 * @constructor
	 * @param {Object} fields
	 */
	var Contact = Users.Contact = function Users_Contact(fields) {
		Q.extend(this, fields);
		this.typename = 'Q.Users.Contact';
	};
	var Cp = Contact.prototype;

	/**
	 * Contacts batch getter.
	 * @method get
	 * @param {String} userId The user's id
	 * @param {String} label The contact's label
	 * @param {String} contactUserId The contact user's id
	 * @param {Function} callback
	 *    if there were errors, first parameter is an array of errors
	 *  otherwise, first parameter is null and second parameter is a Users.Contact object
	 */
	Contact.get = function (userId, label, contactUserId, callback) {
		var func = Users.batchFunction(Q.baseUrl({
			userIds: userId,
			label: label,
			contactUserId: contactUserId
		}), 'contact', ['userIds', 'labels', 'contactUserIds']);
		func.call(this, userId, label, contactUserId,
			function Users_Contact_get_response_handler(err, data) {
				var msg = Q.firstErrorMessage(err, data);
				if (!msg && !data.contact) {
					msg = "Users.Contact.get: no such contact";
				}
				if (msg) {
					Users.onError.handle.call(this, msg, err, data.contact);
					Users.get.onError.handle.call(this, msg, err, data.contact);
					return callback && callback.call(this, msg);
				}
				var contact = new Users.Contact(data.contact);
				callback.call(contact, err, contact);
			});
	};

	function _Users_manage(action, method, fields, field, Constructor, getter, callback) {
		if (getter) {
			getter.cache.clear();
		}
		Q.req(action, field, function _Users_manage_response_handler(err, data) {
			var msg = Q.firstErrorMessage(err, data);
			if (msg) {
				Users.onError.handle.call(this, msg, err, data);
				Users.get.onError.handle.call(this, msg, err, data);
				return callback && callback.call(this, msg);
			}
			var obj = field && data.slots[field] ? new Constructor(data.slots[field]) : null;
			Q.handle(callback, obj, [err, obj]);
		}, {
			method: method,
			fields: fields
		});
	}

	/**
	 * Adds a contact.
	 * @method add
	 * @param {String} userId The user's id
	 * @param {String} label The contact's label
	 * @param {String} contactUserId The contact user's id
	 * @param {Function} callback
	 *    if there were errors, first parameter is an array of errors
	 *  otherwise, first parameter is null and second parameter is a Users.Contact object
	 */
	Contact.add = function (userId, label, contactUserId, callback) {
		return _Users_manage('Users/contact', 'post', {
			userId: userId,
			label: label,
			contactUserId: contactUserId
		}, 'contact', Contact, Users.getContacts, callback);
	};

	/**
	 * Remove a contact.
	 * @method remove
	 * @param {String} userId The user's id
	 * @param {String} label The contact's label
	 * @param {String} contactUserId The contact user's id
	 * @param {Function} callback
	 *    if there were errors, first parameter is an array of errors
	 *  otherwise, first parameter is null and second parameter is a Users.Contact object
	 */
	Contact.remove = function (userId, label, contactUserId, callback) {
		return _Users_manage('Users/contact', 'delete', {
			userId: userId,
			label: label,
			contactUserId: contactUserId
		}, null, Contact, Users.getContacts, callback);
	};

	/**
	 * Constructs a label from fields, which are typically returned from the server.
	 * @class Users.Label
	 * @constructor
	 * @param {Object} fields
	 */
	var Label = Users.Label = function Users_Label(fields) {
		Q.extend(this, fields);
		this.typename = 'Q.Users.Label';
	};
	var Lp = Label.prototype;

	/**
	 * Labels batch getter.
	 * @method get
	 * @param {String} userId The user's id
	 * @param {String} label The label's internal name
	 * @param {Function} callback
	 *    if there were errors, first parameter is an array of errors
	 *  otherwise, first parameter is null and second parameter is a Users.Label object
	 */
	Label.get = function (userId, label, callback) {
		var func = Users.batchFunction(Q.baseUrl({
			userIds: userId,
			label: label
		}), 'label', ['userIds', 'labels']);
		func.call(this, userId, label,
			function Users_Label_get_response_handler(err, data) {
				var msg = Q.firstErrorMessage(err, data);
				if (!msg && !data.label) {
					msg = "Users.Label.get: no such label";
				}
				if (msg) {
					Users.onError.handle.call(this, msg, err, data.label);
					Users.get.onError.handle.call(this, msg, err, data.label);
					return callback && callback.call(this, msg);
				}
				var label = new Users.Label(data.label);
				callback.call(label, err, label);
			});
	};

	/**
	 * Adds a label.
	 * @method add
	 * @param {String} userId The user's id
	 * @param {String} title The contact label's title
	 * @param {Function} callback
	 *    if there were errors, first parameter is an array of errors
	 *  otherwise, first parameter is null and second parameter is a Users.Contact object
	 */
	Label.add = function (userId, title, callback) {
		return _Users_manage('Users/label', 'post', {
			userId: userId,
			title: title
		}, 'label', Label, Users.getLabels, callback);
	};

	/**
	 * Remove a label.
	 * @method remove
	 * @param {String} userId The user's id
	 * @param {String} label The contact label's label
	 * @param {Function} callback
	 *    if there were errors, first parameter is an array of errors
	 *  otherwise, first parameter is null and second parameter is a Users.Contact object
	 */
	Label.remove = function (userId, label, callback) {
		return _Users_manage('Users/label', 'delete', {
			userId: userId,
			label: label
		}, null, Label, Users.getLabels, callback);
	};

	/**
	 * Calculate the url of a label's icon
	 * @method
	 * @param {Number} [size=40] the size of the icon to render.
	 * @return {String} the url
	 */
	Users.Label.prototype.iconUrl = function Users_User_iconUrl(size) {
		return Users.iconUrl(this.icon.interpolate({
			userId: this.userId.splitId()
		}), size);
	};

	Q.Tool.define({
		"Users/avatar": "{{Users}}/js/tools/avatar.js",
		"Users/list": "{{Users}}/js/tools/list.js",
		"Users/pile": "{{Users}}/js/tools/pile.js",
		"Users/labels": "{{Users}}/js/tools/labels.js",
		"Users/status": "{{Users}}/js/tools/status.js",
		"Users/friendSelector": "{{Users}}/js/tools/friendSelector.js",
		"Users/getintouch": "{{Users}}/js/tools/getintouch.js",
		"Users/sessions": "{{Users}}/js/tools/sessions.js"
	});

	Q.beforeInit.add(function _Users_beforeInit() {

		Users.get = Q.getter(Users.get, {
			cache: Q.Cache.document("Users.get", 100),
			throttle: 'Users.get'
		});

		Users.getContacts = Q.getter(Users.getContacts, {
			cache: Q.Cache.document("Users.getContacts", 100),
			throttle: 'Users.getContacts'
		});

		Users.getLabels = Q.getter(Users.getLabels, {
			cache: Q.Cache.document("Users.getLabels", 100),
			throttle: 'Users.getLabels'
		});

		Users.lastSeenNonce = Q.cookie('Q_nonce');

		Q.Users.login.options = Q.extend({
			onCancel: new Q.Event(),
			onSuccess: new Q.Event(function Users_login_onSuccess(user, options) {
				// default implementation
				if (user) {
					// the user changed, redirect to their home page
					var urls = Q.urls || {};
					var nextUrl = user.result === 'registered'
						? options.onboardingUrl
						: options.successUrl;
					var url = nextUrl || urls[Q.info.app + '/home'] || Q.url('');
					Q.handle(url);
				}
			}, 'Users'),
			onResult: new Q.Event(),
			onRequireComplete: new Q.Event(),
			onboardingUrl: null,
			successUrl: null,
			accountStatusUrl: null,
			tryQuietly: false,
			using: 'native', // can also be a platform name like 'facebook'
			scope: ['email', 'public_profile', 'user_friends'], // the permissions to ask for
			linkToken: null,
			dialogContainer: 'body',
			setupRegisterForm: null,
			identifierType: 'email,mobile',
			activation: 'activation'
		}, Q.Users.login.options, Q.Users.login.serverOptions);

		Q.Users.logout.options = Q.extend({
			url: Q.action('Users/logout'),
			using: 'native',
			onSuccess: new Q.Event(function (options) {
				var urls = Q.urls || {};
				Q.handle(options.welcomeUrl
					|| urls[Q.info.app + '/welcome']
					|| Q.url(''));
			}, 'Users')
		}, Q.Users.logout.options, Q.Users.logout.serverOptions);

		Q.Users.setIdentifier.options = Q.extend({
			onCancel: null,
			onSuccess: null, // gets passed session
			identifierType: 'email,mobile',
			dialogContainer: 'body'
		}, Q.Users.setIdentifier.options, Q.Users.setIdentifier.serverOptions);

		Q.Users.prompt.options = Q.extend({
			dialogContainer: 'body'
		}, Q.Users.prompt.options, Q.Users.prompt.serverOptions);

	}, 'Users');

	Q.onInit.add(function () {
		if (Q.Users.loggedInUser
			&& Q.typeOf(Q.Users.loggedInUser) !== 'Q.Users.User') {
			Q.Users.loggedInUser = new Users.User(Q.Users.loggedInUser);
			Q.nonce = Q.cookie('Q_nonce');
		}
		document.documentElement.addClass(Users.loggedInUser ? ' Users_loggedIn' : ' Users_loggedOut');

		var appId = Q.info.app;
		var fbAppId = Q.getObject(['facebook', appId, 'appId'], Users.apps);
		if (fbAppId) {
			Users.initFacebook();
		}
	}, 'Users');

	Q.Page.onActivate('').add(function _Users_Q_Page_onActivate_handler() {
		$.fn.plugin.load('Q/dialog');
		$.fn.plugin.load('Q/placeholders');
		$('#notices_set_email, #notices_set_mobile')
			.on(Q.Pointer.fastclick, function () {
				Q.plugins.Users.setIdentifier();
				return false;
			});
		if (!location.hash.queryField('Q.Users.oAuth')) {
			return;
		}
		var fieldNames = [
			'response_type', 'token_type', 'access_token',
			'expires_in', 'scope', 'state', 'Q.deviceId', 'Q.Users.oAuth'
		];
		var fields = location.hash.queryField(fieldNames);
		var storedDeviceId = localStorage.getItem("Q\tUsers.Device.deviceId");
		fields.deviceId = storedDeviceId || fields.deviceId;
		Q.req('Users/oAuth', function () {
			// user was redirected from Users/authorize or some similar flow
		}, {
			method: 'post',
			fields: fields
		});
	}, 'Users');

	Q.beforeActivate.add(function (elem) {
		// Every time before anything is activated,
		// process any preloaded users data we find
		Q.each(Users.User.preloaded, function (i, fields) {
			_constructUser(fields);
		});
		Users.preloaded = null;
	}, 'Users');

	Q.request.options.onProcessed.set(function (err, response) {
		Q.nonce = Q.cookie('Q_nonce');
		if (Users.lastSeenNonce !== Q.nonce
			&& !Users.login.occurring
			&& !Users.authenticate.occurring
			&& !Users.logout.occurring) {
			Q.nonce = Q.cookie('Q_nonce');
			Q.req("Users/login", 'data', function (err, res) {
				Users.lastSeenNonce = Q.nonce = Q.cookie('Q_nonce');
				var msg = Q.firstErrorMessage(err, res && res.errors);
				if (msg) {
					return Users.onError.handle(msg, err);
				}
				var user = res.slots.data.user;
				if (!user && Users.loggedInUser) {
					Users.loggedInUser = null;
					Users.roles = {};
					Users.onLogout.handle();
				} else if (user && user.id !== Users.loggedInUserId()) {
					Users.loggedInUser = new Users.User(user);
					Users.roles = res.slots.data.roles || {};
					Users.onLogin.handle(user);
				}
			});
		}
		Users.lastSeenNonce = Q.nonce;
		if (!response || !response.errors) {
			return;
		}
		var i, l = response.errors.length, lost = false;
		for (i = 0; i < l; ++i) {
			switch (response.errors[i].classname) {
				case 'Users_Exception_NotLoggedIn':
				case 'Q_Exception_NonceExpired':
					lost = true;
					break;
				default:
					break;
			}
		}
		if (lost) {
			Q.Users.onLoginLost.handle();
			Q.Users.loggedInUser = null;
			Q.Users.roles = {};
		}
	}, 'Users');

	Users.onInitFacebook = new Q.Event();
	var ddc = document.documentElement;
	Users.onLogin = new Q.Event(function () {
		ddc.className = ddc.className.replace(' Users_loggedOut', '') + ' Users_loggedIn';
	}, 'Users');
	Users.onLogout = new Q.Event(function () {
		ddc.className = ddc.className.replace(' Users_loggedIn', '') + ' Users_loggedOut';
	});
	Users.onLoginLost = new Q.Event(function () {
		console.warn("Call to server was made which normally requires user login.");
	});
	Users.onConnected = new Q.Event();
	Users.onConnectionLost = new Q.Event();

	/**
	 * Some replacements for Q.Socket methods, use these instead.
	 * They implement logic involving sockets, users, sessions, devices, and more.
	 * Everything goes through the "Users" namespace in socket.io
	 * @class Users.Socket
	 */
	Users.Socket = {
		/**
		 * Connects a socket, and stores it in the list of connected sockets.
		 * But it also sends a "Users.session" message upon socket connection,
		 * to tell connect the session id to the socket on the back end.
		 * @static
		 * @method connect
		 * @param {String} nodeUrl The url of the socket.io node to connect to
		 * @param {Function} callback When a connection is made, receives the socket object
		 */
		connect: function _Users_Socket_connect(nodeUrl, callback) {
			Q.Socket.connect('Users', nodeUrl, function (socket) {
				Q.loadNonce(function () {
					socket.socket.emit('Users/session', Q.sessionId(), Q.clientId());
				});
			});
		},

		/**
		 * Returns a socket, if it was already connected, or returns undefined
		 * @static
		 * @method get
		 * @param {String} url The url where socket.io is listening. If it's empty, then returns all matching sockets.
		 * @return {Q.Socket}
		 */
		get: function _Users_Socket_get(url) {
			return Q.Socket.get('Users', url);
		},

		/**
		 * Returns Q.Event that occurs on some socket event coming from socket.io
		 * through the Users namespace
		 * @event onEvent
		 * @param {String} name the name of the event
		 * @return {Q.Event}
		 */
		onEvent: function (name) {
			return Q.Socket.onEvent('Users', null, name);
		}

	};

	Users.Facebook = {

		usingPlatforms: null,

		me: {},

		type: 'web',

		accessToken: null,

		appId: null,

		scheme: null,

		scope: null,

		construct: function () {
			Users.Facebook.appId = Q.getObject(['facebook', Q.info.app, 'appId'], Users.apps);

			if (Q.info.isCordova) {
				Users.Facebook.scheme = Q.getObject([Q.info.platform, Q.info.app, 'scheme'], Users.apps);
				Users.Facebook.scheme = Users.Facebook.scheme && Users.Facebook.scheme.replace('://', '');
				Q.onHandleOpenUrl.set(function (url) {
					window.cordova.plugins.browsertab.close();
					var params = _getParams(url);
					Users.Facebook.accessToken = params.access_token;
					Users.Facebook.doLogin({
						status: 'connected',
						authResponse: {
							accessToken: params.access_token
						}
					});

					function _getParams(url) {
						var res = {};
						try {
							var str = url.split('?')[1];
							var pieces = str.split('&');
							for (var i = 0; i < pieces.length; i++) {
								var val = pieces[i].split('=');
								if (val.length !== 2) {
									continue;
								}
								res[val[0]] = val[1];
							}
						} catch (err) {
							console.warn('Error parsing params');
							throw(err);
						}
						return res;
					}
				}, 'Users');
				Users.Facebook.type = 'oauth';
				if (Q.info.platform === 'ios') {
					// ios
					window.appAvailability && appAvailability.check('fb://', function () {
						Users.Facebook.type = 'native';
					});
				} else {
					// android
					window.appAvailability && appAvailability.check('com.facebook.katana', function () {
						Users.Facebook.type = 'native';
					}, function () {
						window.appAvailability.check('com.facebook.lite', function () {
							Users.Facebook.type = 'native';
						});
					});
				}
			}
		},

		login: function () {
			switch (Users.Facebook.type) {
			case 'web':
				var scope = Users.Facebook.scope;
				FB.login(function (response) {
					Users.Facebook.doLogin(response);
				}, scope ? {scope: scope.join(',')} : undefined);
				break;
			case 'native':
				facebookConnectPlugin.login(["public_profile", "email"], function (response) {
					Users.Facebook.doLogin(response);
				}, function (err) {
					console.warn(err);
				});
				break;
			case 'oauth':
				var url = 'https://www.facebook.com/v2.11/dialog/oauth' +
					'?client_id=' + Users.Facebook.appId +
					'&redirect_uri=' + Q.baseUrl() + '/login/facebook%3Fscheme%3D' + Users.Facebook.scheme +
					'&state=' + _stringGen(10) +
					'&response_type=token&scope=email,public_profile';
				// todo: replace hardcoded app name
				cordova.plugins.browsertab.openUrl(url, {schema: Users.Facebook.scheme + '://'},
					function(success){ console.log(success); },
					function(err){ console.log(err); });
			}

			function _stringGen(len) {
				var text = "";
				var charset = "abcdefghijklmnopqrstuvwxyz0123456789";
				for (var i = 0; i < len; i++)
					text += charset.charAt(Math.floor(Math.random() * charset.length));
				return text;
			}
		},

		doLogin: function (response) {
			if (!response.authResponse) {
				return;
			}
			var step1_form = $('#Users_login_step1_form');
			step1_form.data('used', 'facebook');
			step1_form.data('platforms', Users.Facebook.usingPlatforms);
			var p = Q.pipe(['me', 'picture'], function (params) {
				var me = params.me[0];
				Users.Facebook.me = me;
				var picture = params.picture[0].data;
				if (!me.email) {
					step1_form.data('used', null);
					alert(Q.text.Users.login.facebookNoEmail);
					$('#Users_login_identifier')
						.plugin('Q/clickfocus');
					return true;
				}
				priv.registerInfo = {
					firstName: me.first_name,
					lastName: me.last_name,
					gender: me.gender,
					birthday: me.birthday,
					timezone: me.timezone,
					locale: me.locale,
					verified: me.verified,
					pic: picture.url,
					picWidth: picture.width,
					picHeight: picture.height
				};
				$('#Users_login_identifier')
					.val(me.email)
					.closest('form')
					.submit();
				// The login onSuccess callback is about to be called
			});
			var paramsPicture = {
				"redirect": false,
				"height": "200",
				"type": "normal",
				"width": "200"
			};
			var paramsFields = {};
			if (response.authResponse.accessToken) {
				paramsPicture.access_token = response.authResponse.accessToken;
				paramsFields.access_token = response.authResponse.accessToken;
			}
			FB.api("/me/picture", paramsPicture, p.fill('picture'));
			FB.api('/me?fields=first_name,last_name,gender,birthday,timezone,locale,verified,email', paramsFields, p.fill('me'));
		},

		getAuthResponse: function () {
			switch (Users.Facebook.type) {
				case 'web':
					return FB.getAuthResponse();
					break;
				case 'native':
				case 'oauth':
					return {
						status: 'connected',
						authResponse: {
							accessToken: Q.isEmpty(Users.Facebook.accessToken) ? '' : Users.Facebook.accessToken,
							expiresIn: 4400,
							signedRequest: '',
							userID: Q.isEmpty(Users.Facebook.me.id) ? '' : Users.Facebook.me.id
						}
					};
					break;
			}
		},

		getLoginStatus: function (cb, force) {
			switch (Users.Facebook.type) {
				case 'web':
					var timeout = 2000;
					if (timeout) {
						var t = setTimeout(function () {
							// just in case, if FB is not responding let's still fire the callback
							// FB ignores callback if:
							//	-- domain is not properly setup
							//	-- application is running in sandbox mode and developer is not logged in
							console.warn("Facebook is not responding to FB.getLoginStatus within " + timeout / 1000 + " sec.");
							cb({});
						}, timeout);
						FB.getLoginStatus(function (response) {
							clearTimeout(t);
							cb(response);
						}, force);
					} else {
						FB.getLoginStatus(cb, force);
					}
					break;
				case 'native':
					facebookConnectPlugin.getLoginStatus(function (response) {
						cb(response);
					});
					break;
				case 'oauth':
					cb(Users.Facebook.getAuthResponse());
					break;
			}
		},

		getAccessToken: function () {
			switch (Users.Facebook.type) {
				case 'web':
					return FB.getAccessToken();
				case 'native':
					return facebookConnectPlugin.getAccessToken();
				case 'oauth':
					return Q.isEmpty(Users.Facebook.accessToken) ? '' : Users.Facebook.accessToken;
			}
		}

	};

	Q.onReady.add(function () {
		Users.Facebook.construct();
	}, 'Users');

	Q.Dialogs.push.options.onActivate.set(function (dialog) {
		var $dialog = $(dialog);
		Users.hint("Users/dialogCloseHint", $dialog.find('.Q_close')[0], {
			show: {delay: 5000},
			dontStopBeforeShown: true
		});
	}, 'Users.dialogCloseHint');

})(Q, jQuery);

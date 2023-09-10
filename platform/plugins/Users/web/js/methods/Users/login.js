Q.exports(function (_doCancel, _handleXid, _doAuthenticate) {

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
				Web3.login(function (result) {
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
    
});
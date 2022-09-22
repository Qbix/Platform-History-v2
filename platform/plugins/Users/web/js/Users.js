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
		},
		Session: {
			key: {
				generateOnLogin: true,
				name: 'ECDSA', 
				namedCurve: 'P-384',
				hash: 'SHA-256'
			}
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
			emailExists: "Did you try to register with this email before? If so, check your inbox to activate your account. <a href='#resend' class='Q_button Users_activation_resend'>Click to re-send the message</a>",
			mobileExists: "Did you try to register with this mobile number before? If so, check your SMS to activate your account. <a href='#resend' class='Q_button Users_activation_resend'>Click to re-send the message</a>",
			usingOther: "or you can ",
			facebook: {
				src: null,
				noEmail: "Your facebook account is missing a confirmed email address. Simply log in the native way.",
				alt: "log in with facebook"
			},
			web3Src: null,
			prompt: "Choose a username:",
			newUser: "or create a new account below",
			placeholders: {
				identifier: "your mobile # or email",
				mobile: "enter your mobile #",
				email: "enter your email address",
				username: "use letters and numbers only"
			},
			maxlengths: {
				identifier: 100,
				username: 32,
				passphrase: 100
			},
			confirmTerms: "Accept the Terms of Service?",
			picTooltip: "You can change this picture later",
			web3: {
				alt: "log in with wallet",
				payload: "Log into {{host}} at time {{timestamp}}",
				alert: {
					title: "Redirecting to Wallet",
					content: "Once you close this dialog, you'll be taken to your wallet. After you sign in, return to this page.",
				}
			}
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
			title: "{{Platform}} Account",
			areUsing: "You are using {{platform}} as",
			noLongerUsing: "You are no longer connected to {{platform}} as",
			doAuth: "Log in with this account",
			doSwitch: "Switch to this account"
		},

		authorize: {
			mustAgree: "First you must agree to the terms."
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

	Users.init = {};

	/**
	 * Initialize facebook by adding FB script and running FB.init().
	 * Ensures that this is done only once
	 * @method init.facebook
	 * @param {Function} callback , This function called after Facebook init completed
	 * @param {Object} options for overriding the options passed to FB.init , and also
	 *   @param {String} [options.appId=Q.info.app] Only needed if you have multiple apps on platform
	 */
	Users.init.facebook = function (callback, options) {

		var appId = (options && options.appId) || Q.info.app;
		var platformAppId = Q.getObject(['facebook', appId, 'appId'], Users.apps) || appId;
		if (!platformAppId) {
			throw new Q.Error("Users.init.facebook: missing facebook app info for '" + appId + "'");
		}

		/*	Q.onReady.add(function () {
				Q.extend(window.FB, window.facebookConnectPlugin);
			});*/

		// should be only called once per app
		if (Users.init.facebook.completed[Q.info.app]) {
			callback && callback();
			return;
		}

		function _init() {
			if (!Users.init.facebook.completed[appId] && platformAppId) {
				FB.init(Q.extend({
					version: 'v8.0',
					status: true,
					cookie: true,
					oauth: true,
					xfbml: true
				}, Users.init.facebook.options, options, {
					appId: platformAppId
				}));
				Users.init.facebook.onInit.handle(Users, window.FB, [appId]);
			}
			Users.init.facebook.completed[appId] = true;
			Q.handle(callback);
		}

		if (!$('#fb-root').length) {
			$('body').prepend($('<div id="fb-root"></div>'));
		}
		Q.addScript(
			'https://connect.facebook.net/en_US/sdk.js',
			_init,
			{
				onError: function () {
					Q.handle(callback, null, [true]);
					console.log("Couldn't load script:", this, arguments);
				}
			}
		);
	};
	Users.init.facebook.completed = {};
	Users.init.facebook.options = {
		frictionlessRequests: true
	};
	
	/**
	 * Initialize Web3
	 * Ensures that this is done only once
	 * @method init.web3
	 * @param {Function} callback , This function called after Facebook init completed
	 * @param {Object} options for overriding the options passed to FB.init , and also
	 *   @param {String} [options.appId=Q.info.app] Only needed if you have multiple apps on platform
	 */
	Users.init.web3 = function (callback, options) {
		if (!Q.getObject('web3', Users.apps)) {
			return;
			
		}
		var scriptsToLoad = [
			'{{Users}}/js/web3/ethers-5.2.umd.min.js',
			'{{Users}}/js/web3/evm-chains.min.js',
			'{{Users}}/js/web3/walletconnect.min.js',
			'{{Users}}/js/web3/web3.min.js',
			'{{Users}}/js/web3/web3modal.js'
		];
		var o = options || {};
		var appId = o.appId || Q.info.app;
		if (Q.getObject(['web3', appId, 'providers', 'fortmatic'], Users.apps)) {
			scriptsToLoad.push('{{Users}}/js/web3/fortmatic.js');
		}
		if (Q.getObject(['web3', appId, 'providers', 'portis'], Users.apps)) {
			scriptsToLoad.push('{{Users}}/js/web3/portis.js');
		}
		Q.addScript(scriptsToLoad, callback, options);
	};

	/**
	 * Check whether string is community id
	 * @method isCommunityId
	 * @static
	 * @param {String} id
	 * @return {boolean}
	 */
	Users.isCommunityId = function (id) {
		if (id[0] !== id[0].toUpperCase()) {
			return false;
		}

		return true;
	};
	
	/**
	 * Check if an icon is custom or whether it's been automatically generated
	 * @method isCustomIcon
	 * @static
	 * @param {String} id
	 * @return {boolean}
	 */
	Users.isCustomIcon = function (icon) {
		if (!icon) {
			return false;
		}
		return (icon.indexOf('imported') >= 0
		|| icon.match(/\/icon\/[0-9]+/));
	};

	/**
	 * You can wrap all uses of FB object with this
	 * @method init.facebook.ready
	 * @param {String} [appId=Q.info.app] only specify this if you have multiple facebook apps
	 * @param {Function} callback this function called after Facebook application access token or user status response
	 */
	Users.init.facebook.ready = function (appId, callback) {
		if (typeof appId === 'function') {
			callback = appId;
			appId = Q.info.app;
		}
		if (Users.init.facebook.completed[appId]) {
			_proceed();
		} else {
			Users.init.facebook.onInit.set(_proceed, "Users.init.facebook.ready");
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
	 * Authenticates this session with a given platform,
	 * if the user was already connected to it.
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
		options = options || {};
		var handler = Users.authenticate[platform];
		if (!handler) {
			var handlers = Object.keys(Users.authenticate).filter(function (k) {
				return Users.authenticate.hasOwnProperty(k);
			});
			throw new Q.Error(
				"Users.authenticate: platform must be one of " + handlers.join(', ')
			);
		}
		Users.authenticate.occurring = true;
		var appId = options.appId || Q.info.app;
		var platformAppId = Users.getPlatformAppId(platform, appId);
		if (!platformAppId) {
			console.warn(
				"Users.authenticate: missing " + 
				["Users", "apps", platform, appId, "appId"].join('.')
			);
			return;
		}
		options.appId = appId;
		return handler.call(this, platform, platformAppId, onSuccess, onCancel, options);
	};

	Users.getPlatformAppId = function (platform, appId) {
		return Q.getObject([platform, appId, 'appIdForAuth'], Users.apps)
			|| Q.getObject([platform, '*', 'appIdForAuth'], Users.apps)
			|| Q.getObject([platform, appId, 'appId'], Users.apps);
	};
	
	Users.authenticate.ios = 
	Users.authenticate.android = function (platform, platformAppId, onSuccess, onCancel, options) {
		_doAuthenticate({
			udid: Q.info.udid, // TODO: sign this with private key on cordova side
			platform: platform
		}, platform, platformAppId, onSuccess, onCancel, options);
	};
	
	Users.authenticate.facebook = function (platform, platformAppId, onSuccess, onCancel, options) {
		options = options || {};
		var fields = {};

		// make sure facebook is initialized
		Users.init.facebook(function () {
			// check if user is connected to facebook
			Users.Facebook.getLoginStatus(function (response) {
				if (response.status === 'connected') {
					_handleXid(
						platform, platformAppId, response.authResponse.userID,
						onSuccess, onCancel, Q.extend({response: response}, options)
					);
				} else if (platformAppId) {
					// let's delete any stale facebook cookies there might be
					// otherwise they might confuse our server-side authentication.
					Q.cookie('fbs_' + platformAppId, null, {path: '/'});
					Q.cookie('fbsr_' + platformAppId, null, {path: '/'});
					_doCancel(platform, platformAppId, null, onSuccess, onCancel, options);
				}
			}, options.force ? true : false);
		}, {
			appId: options.appId
		});
	};
	
	Users.authenticate.web3 = function (platform, platformAppId, onSuccess, onCancel, options) {
		options = Q.extend(Users.authenticate.web3.options, options);
		Users.init.web3(function () {
			try {
				var wsr_json = Q.cookie('Q_Users_w3sr_' + platformAppId);
				if (wsr_json) {
					var wsr = JSON.parse(wsr_json);	
					var hash = ethers.utils.hashMessage(wsr[0]);
					var xid = ethers.utils.recoverAddress(hash, wsr[1]);
					if (xid) {
						return _handleXid(
							platform, platformAppId, xid,
							onSuccess, onCancel, options
						);	
					}
				}
			} catch (e) {
				console.warn(e);
				// wasn't able to get the current authenticated xid from cookie
			}

			var web3Modal = Users.Web3.getWeb3Modal();
			Users.prevDocumentTitle = document.title;
			document.title = Users.communityName;
			Users.Web3.connect(function (err, provider) {
				if (err) {
					return _cancel();
				}
				Users.Web3.provider = provider;

				// Subscribe to accounts change
				provider.on("accountsChanged", function (accounts) {
					console.log('provider.accountsChanged', accounts);
				});

				// Subscribe to chainId change
				provider.on("chainChanged", function (chainId) {
					console.log('provider.chainChanged', chainId);
				});
				// Subscribe to provider disconnection
				provider.on("connect", function (info) {
					console.log('provider.connect', info);
				});
				// Subscribe to provider disconnection
				provider.on("disconnect", function (error) {
					console.log("provider.disconnect: ", error);

					if (Users.logout.occurring || Users.Web3.switchChainOccuring) {
						if (Users.Web3.switchChainOccuring === true) {
							Users.Web3.switchChainOccuring = false;
						}

						return;
					}

					Q.Users.logout({using: 'web3', url: ''});
				});
				var payload = Q.text.Users.login.web3.payload.interpolate({
					host: location.host,
					timestamp: Math.floor(Date.now() / 1000)
				});
				var w3 = new Web3(provider);
				w3.eth.getAccounts().then(function (accounts) {
					var web3Address = Q.cookie('Q_Users_web3_address') || '';
					if (web3Address && accounts.includes(web3Address)) {
						var loginExpires = Q.cookie('Q_Users_web3_login_expires');
						if (loginExpires > Date.now() / 1000) {
							_proceed();
						}
					}
					if (provider.wc) {
						Q.alert(Q.text.Users.login.web3.alert.content, {
							title: Q.text.Users.login.web3.alert.title,
							onClose: function () {
								var web3 = new Web3();
								var address = accounts[0];
								const res = provider.request({
									method: 'personal_sign',
									params: [ 
										ethers.utils.hexlify(ethers.utils.toUtf8Bytes(payload)), 
										address.toLowerCase()
									]
								}).then(_proceed)
								.catch(_cancel);	
							}
						});
					} else {
						var signer = new ethers.providers.Web3Provider(provider).getSigner();
						  signer.signMessage(payload)
						.then(_proceed)
						.catch(_cancel);
					}
					function _proceed(signature) {
						_doAuthenticate({
							xid: accounts[0],
							payload: payload,
							signature: signature,
							platform: 'web3',
							chainId: provider.chainId
						}, platform, platformAppId, onSuccess, onCancel, options);
					}
				}).catch(_cancel);
			});
			function _cancel() {
				if ('prevDocumentTitle' in Users) {
					document.title = Users.prevDocumentTitle;
					delete Users.prevDocumentTitle;
				}
				Q.handle(onCancel, Users, [options]);
			}
		});
	};
	
	Users.authenticate.web3.options = {
		chain: 'ETH',
		network: 'mainnet'
	};
	
	function _authenticate(platform) {
		Users.authenticate(platform, function (user) {
			priv.login_onConnect(user);
		}, function () {

			priv.login_onCancel();
		}, {"prompt": false});
	}
	
	function _handleXid(platform, platformAppId, xid, onSuccess, onCancel, options) {
		var ignoreXid = Q.cookie('Users_ignorePlatformXids_'+platform+"_"+platformAppId);

		// the following line prevents multiple prompts for the same user,
		// which can be a problem especially if the authenticate() is called
		// multiple times on the same page, or because the page is reloaded
		Q.cookie('Users_ignorePlatformXids_'+platform+"_"+platformAppId, xid);

		var key = platform + "_" + platformAppId;
		if (Users.loggedInUser && Users.loggedInUser.xids[key] == xid) {
			// The correct user is already logged in.
			// Call onSuccess but do not pass a user object -- the user didn't change.
			_doSuccess(null, platform, platformAppId, onSuccess, onCancel, options);
			return;
		}
		if (options.prompt === undefined || options.prompt === null) {
			// show prompt only if we aren't ignoring this platform xid
			if (xid == ignoreXid) {
				_doCancel(null, platform, platformAppId, onSuccess, onCancel, options);
			} else {
				Users.prompt(platform, xid, __doAuthenticate, __doCancel);
			}
		} else if (options.prompt === false) {
			// authenticate without prompting
			__doAuthenticate();
		} else if (options.prompt === true) {
			// show the usual prompt no matter what
			Users.prompt(platform, xid, __doAuthenticate, __doCancel);
		} else if (typeof options.prompt === 'function') {
			// custom prompt
			options.prompt(platform, xid, __doAuthenticate, __doCancel);
		} else {
			Users.authenticate.occurring = false;
			throw new Q.Error("Users.authenticate: options.prompt is the wrong type");
		}
		
		function __doCancel(x) {
			_doCancel.call(this, platform, platformAppId, x, onSuccess, onCancel, options);
		}

		function __doAuthenticate() {
			var fields = {};
			var appId = (options && options.appId) || Q.info.app;
			if (platform === 'facebook') {
				var ar = Users.Facebook.getAuthResponse();
				if (!ar) {
					// in some rare cases, the user may have logged out of facebook
					// while our prompt was visible, so there is no longer a valid
					// facebook authResponse. In this case, even though they want
					// to authenticate, we must cancel it.
					alert("Connection to facebook was lost. Try connecting again.");
					_doCancel(platform, platformAppId, null, onSuccess, onCancel, options);
					return;
				}
				ar.expires = Math.floor(Date.now() / 1000) + ar.expiresIn;
				ar.fbAppId = platformAppId;
				ar.appId = appId;
				fields['Q.Users.facebook.authResponse'] = ar;
			}
			_doAuthenticate(fields, platform, platformAppId, onSuccess, onCancel, options);
		}
	}
	
	function _doSuccess(user, platform, platformAppId, onSuccess, onCancel, options) {
		// if the user hasn't changed then user is null here
		Users.connected[platform] = true;
		Users.onConnected.handle.call(Users, platform, user, options);
		Q.handle(onSuccess, this, [user, options]);
		Users.authenticate.occurring = false;
	}

	function _doCancel(platform, platformAppId, xid, onSuccess, onCancel, options) {
		if (xid) {
			// NOTE: the following line makes us ignore this xid
			// until the user explicitly wants to connect.
			// This usually has the right effect -- because the user
			// doesn't want to see the prompt all the time.
			// However, sometimes if the user is already logged in
			// and then the javascript discovers that the platform connection was lost,
			// the user will not be prompted to restore it when it becomes available again.
			// They will have to do it explicitly (calling Users.authenticate with prompt: true)
			Q.cookie('Users_ignorePlatformXids_'+platform+"_"+platformAppId, xid);
		}
		delete Users.connected[platform];
		Users.onDisconnected.handle.call(Users, platform, options);
		Q.handle(onCancel, Users, [options]);
		Users.authenticate.occurring = false;
	}
	
	function _doAuthenticate(fields, platform, platformAppId, onSuccess, onCancel, options) {
		Q.req('Users/authenticate', 'data', function (err, response) {
			if ('prevDocumentTitle' in Users) {
				document.title = Users.prevDocumentTitle;
				delete Users.prevDocumentTitle;
			}
			var fem = Q.firstErrorMessage(err, response);
			if (fem) {
				alert(fem);
				return _doCancel(platform, platformAppId, fields.xid, onSuccess, onCancel, options);
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
			_doSuccess(user, platform, platformAppId, onSuccess, onCancel, options);
		}, {
			method: "post",
			fields: Q.extend({ platform: platform }, fields)
		});
	}

	Q.request.options.beforeRequest.push(
	function (url, slotNames, options, callback) {
		var fields = options.fields || {};
		var found = false;
		Q.each(Users.requireLogin, function (u, v) {
			if (url.split('?')[0] != u) {
				return;
			}
			var nonce = Date.now();
			fields[Users.signatures.nonceField] = nonce;
			found = true;
			var fieldNames = Q.isArrayLike(v) ? v : Object.keys(fields);
			Users.sign(fields,
			function (err, signature) {
				if (err) {
					callback(url, slotNames, options);
				}
				fields[Users.signatures.sigField] = {
					signature: signature,
					fieldNames: fieldNames
				}
				callback(url, slotNames, options);
			}, fieldNames);
		});
		if (!found) {
			return callback(url, slotNames, options);
		}
	});

	/**
	 * Sign a specific payload with the user's private key, if it has been saved in IndexedDB.
	 * Gets canonical serialization of the payload with Q.serialize(),
	 * then gets the key from IndexedDB and signs the serialization.
	 * It can be verified with Users.verify() or Q_Users::verify()
	 * @method sign
	 * @static
	 * @param {Object} payload The payload to sign. It will be serialized with Q.serialize()
	 * @param {Function} callback Receives the signature, if one was computed
	 * @param {Array} [fieldNames] The names of the fields from the payload to sign, otherwise signs all.
	 */
	Users.sign = function (payload, callback, fieldNames) {
		if (fieldNames && fieldNames.indexOf(Users.signatures.nonceField) < 0) {
			fieldNames.push(Users.signatures.nonceField);
		}
		var serialized = Q.serialize(
			fieldNames ? Q.take(payload, fieldNames) : payload
		);
		var key = Users.Session.key.loaded;
		if (key) {
			_sign(key);
		} else {
			Q.IndexedDB.open('Q.Users', 'keys', 'id',
			function (err, store) {
				if (err) {
					return Q.handle(callback, null, [err]);
				}
				var request = store.get('Users.Session');
				request.onsuccess = function (event) {
					_sign(Users.Session.key.loaded = event.target.result.key);
				};
				request.onerror = function (event) {
					Q.handle(callback, null, [event]);
				};
			});
		}
		function _sign(key) {
			crypto.subtle.sign(
				{
					name: 'ECDSA',
					hash: 'SHA-256'
				}, 
				key.privateKey,
				new TextEncoder().encode(serialized)
			).then(function (arrayBuffer) {
				var signature = Array.prototype.slice.call(
					new Uint8Array(arrayBuffer), 0
				).toHex();
				Q.handle(callback, null, [signature]);
			});
		}
	}

	/**
	 * Used when platform user is logged in to platform but not to app.
	 * Shows prompt asking if user wants to log in to the app as platform user.
	 * @method prompt
	 * @param {String} platform For now, only "facebook" is supported
	 * @param {String} xid The platform xid
	 * @param {Function} authCallback , this function will be called after user authentication
	 * @param {Function} cancelCallback , this function will be called if user closed social platform login window
	 * @param {object} options
	 *     @param {DOMElement} [options.dialogContainer=document.body] param with jQuery identifier of dialog container
	 * @param {Object} options
	 *   @param {String} [options.appId=Q.info.app] Only needed if you have multiple apps on platform
	 */
	Users.prompt = function (platform, xid, authCallback, cancelCallback, options) {
		if (platform !== 'facebook') {
			throw new Q.Error("Users.authenticate prompt: The only supported platform for now is facebook");
		}

		var appId = (options && options.appId) || Q.info.app;
		var platformAppId = Users.getPlatformAppId(appId);
		var platformCapitalized = platform.toCapitalized();

		if (!Users.prompt.overlay) {
			Q.addStylesheet(Q.url('{{Users}}/css/Users.css'));
			var o = Q.extend({}, Users.prompt.options, options);
			var title = Q.text.Users.prompt.title.interpolate({
				'platform': platform,
				'Platform': platformCapitalized
			});
			var areUsing = Q.text.Users.prompt.areUsing.interpolate({
				'platform': platform,
				'Platform': platformCapitalized
			});
			var noLongerUsing = Q.text.Users.prompt.noLongerUsing.interpolate({
				'platform': platform,
				'Platform': platformCapitalized
			});
			var caption;
			var tookAction = false;

			var content_div = $('<div />');
			var xid2 = Q.getObject(['loggedInUser', 'xids', platform], Users);
			var queries = ['me'];
			if (xid2) {
				queries.push('xid')
			}
			var pipe = new Q.Pipe(queries, function (params, subjects) {
				var meName = Q.getObject(['me', 0, 'name'], params);
				var mePicture = Q.getObject(['me', 0, 'picture', 'data', 'url'], params);
				var xidName = Q.getObject(['xid', 0, 'name'], params);
				var xidPicture = Q.getObject(['xid', 0, 'picture', 'data', 'url'], params);
				if (xidName) {
					content_div.append(_usingInformation(xidPicture, xidName, noLongerUsing));
					caption = Q.text.Users.prompt.doSwitch.interpolate({
						'platform': platform,
						'Platform': platformCapitalized
					});
				} else {
					caption = Q.text.Users.prompt.doAuth.interpolate({
						'platform': platform,
						'Platform': platformCapitalized
					});
				}
				content_div.append(_usingInformation(mePicture, meName, areUsing))
					.append(_authenticateActions(caption));
			});
			FB.api("/me?fields=name,picture.width(50).height(50)", pipe.fill('me'));
			if (xid2) {
				FB.api("/"+xid2+"?fields=name,picture.width(50).height(50)", pipe.fill('xid'));;
			}

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
			alignByParent: false,
			doNotRemove: true,
			onActivate: function () {
				Users.init.facebook(function () {
					FB.XFBML.parse(content_div.get(0));
				}, {
					appId: appId
				});
			},
			onClose: function () {
				if (!tookAction) {
					if (cancelCallback) cancelCallback(xid);
				}
				tookAction = false;
			}
		});

		function _usingInformation(icon, name, explanation) {
			return $("<table />").append(
				$("<tr />").append(
					$("<td class='Users_profile_pic' />").append(
						$('<img />', {src: icon})
					)
				).append(
					$("<td class='Users_explanation_name' />").append(
						$("<div class='Users_explanation' />").html(explanation)
					).append(
						name
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
		var platformAppId = Users.getPlatformAppId(appId);
		Users.init.facebook(function () {
			if (!Users.Facebook.getAuthResponse()) {
				callback(null);
			}
			FB.api('/me/permissions', function (response) {
				if (response && response.data) {
					var checked = [];
					Q.each(options && options.check, function (a, s) {
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
			appId: platformAppId
		});
	};

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
	 *  @param  {String} [options.accountStatusUrl] if passed, this URL is hit to determine if the account is complete
	 *  @param {Function} [options.onRequireComplete] function to call if the user logged in but account is incomplete.
	 *  It is passed the user information as well as the response from hitting accountStatusUrl
	 *  @param {String} [options.using] can be "native", "facebook" or "native,facebook"
	 *  @param {Boolean} [options.tryQuietly] if true, this is same as Users.authenticate, with platform = "using" option
	 *  @param {Boolean} [options.unlessLoggedIn] if true, this only proceeds with the login flow if the user isn't already logged in. Can be combined with tryQuietly option.
	 *  @param {Array} [options.scope=['email'] permissions to request from the authentication platform
	 *  @param {String} [options.identifierType="email,mobile"] the type of the identifier, which could be "mobile" or "email" or "email,mobile"
	 *  @param {Object} [options.appIds={}] Can be used to set custom {platform: appId} pairs
	 *  @param {String} [options.identifier] If passed, automatically enters this identifier and clicks the Go button
	 */
	Users.login = function (options) {

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
			return;
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
				var appId = (o.appIds && o.appIds.facebook) || Q.info.app;
				var usingPlatforms = {};
				Q.each(['web3', 'facebook'], function (i, platform) {
					if ((o.using.indexOf('facebook') >= 0)) {
						usingPlatforms[platform] = appId;	
					}
				});
				// set up dialog
				login_setupDialog(usingPlatforms, o);
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
				_authenticate('web3');
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
			var pn = priv.used || 'native';
			var ret = Q.handle(o.onResult, this, [user, o, priv.result, pn]);
			if (false !== ret) {
				Q.handle(o.onSuccess, this, [user, o, priv.result, pn]);
			}
			Users.onLogin.handle(user);
			Users.login.occurring = false;
		}
	};

	/**
	 * Log the user out
	 * @method logout
	 * @param {Object} [options] You can pass several options here
	 *  It is passed the user information if the user changed.
	 *  @param {String} [options.url] the URL to hit to log out. You should usually not change this.
	 *  @param {String} [options.using] can be "native", "facebook", "web3", or "native,facebook,web3"
	 *   to log out of multiple platforms in addition to logging out natively
	 *  @param {Q.Event} [options.onSuccess] event that occurs when logout is successful.
	 *  @param {String} [options.welcomeUrl] the URL of the page to show on a successful logout
	 */
	Users.logout = function (options) {
		options = options || {};
		if (typeof options === 'function') {
			options = {onSuccess: {'options': options}};
		}
		var o = Q.extend({}, Users.logout.options, options);
		if (!o.using || o.using === '*') {
			o.using = Q.getObject('login.options.using', Users) || ['native'];
		}
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
			Users.lastSeenNonce = Q.cookie('Q_nonce');
			Users.roles = {};
			var appId = o.appId || Q.info.app;
			var p = new Q.Pipe();
			var loggedOutOf = {};
			if (appId && o.using.indexOf('facebook') >= 0) {
				loggedOutOf.facebook = true;
				Users.disconnect.facebook(appId, p.fill('facebook'));
			}
			if (o.using.indexOf('web3') >= 0) {
				loggedOutOf.web3 = true;
				Users.disconnect.web3(appId, p.fill('web3'));
			}
			if (o.using.indexOf('native') >= 0) {
				if (Q.isEmpty(loggedOutOf)) {
					// if we log out natively without disconnecting others,
					// then we should ignore the logged-in user's xid
					// when authenticating, until it is forced
					var xids = Q.getObject(['loggedInUser', 'xids'], Users) || {};
					for (var key in xids) {
						var parts = key.split("_");
						Q.cookie('Users_ignorePlatformXids_'+parts.join('_'), xids[key]);
					}
					setTimeout(function () {
						Users.logout.occurring = false;
					}, 0);
				}
				Users.loggedInUser = null;
				Q.nonce = Q.cookie('Q_nonce');
				loggedOutOf.native = true;
				p.fill('native')();
			}
			p.add(Object.keys(loggedOutOf), 1, function _disconnected() {
				Users.logout.occurring = false;
				Users.onLogout.handle.call(Users, loggedOutOf, o);
				Q.handle(options.onSuccess, Users, [loggedOutOf, o]);
			}).run();
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
	var User = Users.User = function (fields) {
		Q.extend(this, fields);
		this.typename = 'Q.Users.User';
	};

	/**
	 * Calculate the url of a user's icon
	 * @method
	 * @param {Number|false} [size=40] The last part after the slash, such as "50.png" or "50". Setting it to false skips appending "/basename"
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
	 * @param {String|Number|false} [basename=40] The last part after the slash, such as "50.png" or "50". Setting it to false skips appending "/basename"
	 * @return {String} the url
	 */
	Users.iconUrl = function Users_iconUrl(icon, basename) {
		if (!icon) {
			console.warn("Users.iconUrl: icon is empty");
			return '';
		}
		if ((basename === true) // for backward compatibility
		|| (!basename && basename !== false)) {
			basename = '40';
		}
		basename = (String(basename).indexOf('.') >= 0) ? basename : basename + '.png';
		var src = Q.interpolateUrl(icon + (basename ? '/' + basename : ''));
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
		$(elem || document)
		.off('click.Users', 'a')
		.on('click.Users', 'a', function (e) {
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
		options = Q.extend({}, Users.setIdentifier.options, options);
		var identifierType = Q.getObject("identifierType", options);
		var identifier = Q.getObject("Q.Users.loggedInUser." + identifierType) || null;

		function onSuccess(user) {
			if (false !== Q.handle(options.onResult, this, [user])) {
				Q.handle(options.onSuccess, this, [user]);
			}
		}

		function onCancel(scope) {
			if (false !== Q.handle(options.onResult, this, [scope])) {
				Q.handle(options.onCancel, this, [scope]);
			}
		}

		priv.setIdentifier_onSuccess = onSuccess;
		priv.setIdentifier_onCancel = onCancel;

		options.onActivate = function () {
			var d = this;
			if (d.css('display') === 'none') {
				d.data('Q/dialog').load();
			}
			$('input[name="identifierType"]', d).val(identifierType);
			$('input[name="identifier"]', d).val(identifier);
		};

		$.fn.plugin.load(['Q/dialog', 'Q/placeholders'], function () {
			setIdentifier_setupDialog(identifierType, options);
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
			// this identifier is available. This user has no password set yet and will activate later
			step2_form = setupRegisterForm(identifier_input.val(), json, priv, login_setupDialog.dialog.data('Q/dialog'));
		} else if (json.passphrase_set) {
			// check password
			step2_form = setupLoginForm();
		} else if (json.verified) {
			// var the user gain access by resending an activation message
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
			var passphrase_input = $('<input type="password" name="passphrase" id="current-password" class="Q_password" />')
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
				); // .append($('<input type="hidden" name="isHashed" id="Users_login_isHashed" value="0" />'));
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
			var register_form = $('<form method="post" class="Users_register_form" />')
				.attr('action', Q.action("Users/register"))
				.data('form-type', 'register')
				//.append($('<div class="Users_login_appear" />'))
				.append($formContent)
				.append($('<input type="hidden" name="identifier" />').val(identifier))
				.append($('<input type="hidden" name="icon[40.png]" />').val(src40))
				.append($('<input type="hidden" name="icon[50.png]" />').val(src50))
				.append($('<input type="hidden" name="icon[80.png]" />').val(src80))
				.append(
					$('<div class="Users_login_get_started"></div>')
					.append($b)
				).submit(function () {
					if (_registering) {
						return false;
					}
					var $this = $(this);
					$this.removeData('cancelSubmit');
					$b.addClass('Q_working')[0].disabled = true;
					document.activeElement.blur();
					if ($('#Users_agree').length && !$('#Users_agree').is(':checked')) {
						$this.data('cancelSubmit', true);
						setTimeout(function () {
							if (confirm(Q.text.Users.login.confirmTerms)) {
								$('#Users_agree').attr('checked', 'checked');
								$('#Users_agree')[0].checked = true;
								$b.addClass('Q_working')[0].disabled = true;
								$this.submit();
							}
						}, 300);
					}
				});

			if (priv.activation) {
				register_form.append($('<input type="hidden" name="activation" />').val(priv.activation));
			}

			if (json.termsLabel) {
				$formContent.append(
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
				var platformAppId = Q.getObject(['facebook', appId, 'appId'], Users.apps);
				if (!platformAppId) {
					console.warn("Users.defaultSetupRegisterForm: missing Users.apps.facebook." + appId + ".appId");
				}
				Users.init.facebook(function () {
					var k;
					if ((authResponse = Users.Facebook.getAuthResponse())) {
						authResponse.appId = appId;
						authResponse.fbAppId = platformAppId;
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
				var $p = $('<p id="Users_login_identifierExists" />')
					.html(
						json.emailExists ? Q.text.Users.login.emailExists : Q.text.Users.login.mobileExists
					);
				$('a', $p).click(function () {
					$.post(
						Q.ajaxExtend(Q.action("Users/resend"), 'data'),
						'identifier=' + encodeURIComponent(identifier_input.val()),
						function () {
							dialog.close();
						}
					);
					return false;
				});
				register_form.prepend($p);
				if (Q.text.Users.login.newUser) {
					$p.append($('<div />').html(Q.text.Streams.login.newUser));
				}
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
			login_setupDialog.dialog.addClass('Users_login_expanded');
			if (Q.info && Q.info.isTouchscreen) {
				step2.show();
				step2_form.plugin('Q/placeholders');
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
	function login_setupDialog(usingPlatforms, options) {
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
		var parts = options.identifierType ? options.identifierType.split(',') : [];
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

		var $a = $('<a id="Users_login_go" class="Q_button Q_main_button" />')
			.append(
				$('<span id="Users_login_go_span">' + Q.text.Users.login.goButton + '</span>')
			).on(Q.Pointer.fastclick, function (e) {
				e.preventDefault(); // prevent automatic submit on click
				submitClosestForm.apply($a, arguments);
			});

		var directions = Q.plugins.Users.login.serverOptions.noRegister
			? Q.text.Users.login.directionsNoRegister
			: Q.text.Users.login.directions;
		step1_form.html(
			$('<label for="Users_login_identifier" />').html(directions)
		).append('<br />').append(
			identifierInput
		).append(
			$('<input id="Users_login_identifierType" type="hidden" name="identifierType" />')
			.val(options.identifierType)
		).append($a)
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
		var $buttons = $([]);
		for (var platform in usingPlatforms) {
			var appId = usingPlatforms[platform];
			var $button = null;
			switch (platform) {
				case 'facebook':
					var platformAppId = Q.getObject([platform, appId, 'appId'], Users.apps);
					if (!platformAppId) {
						console.warn("Users.login: missing Users.apps.facebook." + appId + ".appId");
						break;
					}
					$button = $('<a href="#login_facebook" id="Users_login_with_facebook" />').append(
						$('<img />').attr({
							alt: Q.text.Users.login.facebook.alt,
							src: Q.text.Users.login.facebook.src || Q.url('{{Users}}/img/facebook-login.png')
						})
					).css({'display': 'inline-block', 'vertical-align': 'middle'})
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
							src: Q.text.Users.login.web3Src || Q.url('{{Users}}/img/web3-login.png')
						})
					).css({'display': 'inline-block', 'vertical-align': 'middle'})
					.click(function () {
						if (login_setupDialog.dialog) {
							login_setupDialog.dialog.data('Q/dialog').close();
						}
						_authenticate('web3');
						return false;
					});
					break;
			}
			$buttons = $buttons.add($button);
		}
		if ($buttons.length > 0) {
			step1_usingPlatforms_div.append(Q.text.Users.login.usingOther);
			if ($buttons.length > 1) {
				step1_usingPlatforms_div.append('<br>');
			}
			$buttons.each(function () {
				step1_usingPlatforms_div.append(this);
			});
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
			.prependTo(options.dialogContainer)
			.plugin('Q/dialog', {
				alignByParent: false,
				fullscreen: !!options.fullscreen,
				noClose: !!options.noClose,
				closeOnEsc: Q.typeOf(options.closeOnEsc) === 'undefined' ? true : !!options.closeOnEsc,
				beforeLoad: function () {
					$('#Users_login_step1').css('opacity', 1).nextAll().hide();
					setTimeout(function () {
						$('input[type!=hidden]', dialog).val('').trigger('change');
					}, 0);
				},
				onActivate: function () {
					var $input = $('input[type!=hidden]', dialog)
					dialog.plugin('Q/placeholders');
					if (Q.info.platform === 'ios') {
						$input.eq(0).plugin('Q/clickfocus');	
					}
					setTimeout(function () {
						$input.val('').trigger('change');
						if (options.identifier) {
							$input.val(options.identifier).trigger('change');
							setTimeout(function () {
								Users.submitClosestForm.apply($a, arguments);
							}, 300);
						} else {
							$input.val('').trigger('change').eq(0).plugin('Q/clickfocus');
						}
					}, 0);
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
			login_setupDialog.dialog.removeClass('Users_login_expanded');
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
		options = options || {};
		var placeholder = Q.text.Users.setIdentifier.placeholders.identifier;
		var type = Q.info.isTouchscreen ? 'email' : 'text';
		var parts = identifierType ? identifierType.split(',') : [];
		if (parts.length === 1) {
			if (parts[0] === 'email') {
				type = 'email';
				placeholder = Q.text.Users.setIdentifier.placeholders.email;
			} else if (parts[0] === 'mobile') {
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
			var $identifier = $('#Users_setIdentifier_identifier');
			var h = $identifier.outerHeight() - 5;
			$identifier.css({
				'background-image': 'url(' + Q.info.imgLoading + ')',
				'background-repeat': 'no-repeat',
				'background-position': 'right center',
				'background-size': 'auto ' + h + 'px'
			});
			var url = Q.action('Users/identifier') + '?' + $(this).serialize();
			Q.request(url, 'data', setIdentifier_callback, {"method": "post"});
			event.preventDefault();
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
			alignByParent: false,
			fullscreen: false,
			beforeLoad: function () {
				setTimeout(function () {
					$('input[type!=hidden]', dialog).val('').trigger('change');
				}, 0);
			},
			onActivate: function () {
				dialog.plugin('Q/placeholders');
				var $input = $('input[type!=hidden]', dialog).eq(0).plugin('Q/clickfocus');
				setTimeout(function () {
					$input.val('').trigger('change');
					Q.handle(options.onActivate, dialog);
				}, 0);
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
	 * @method vote
	 * @param {String} forType The type of thing to vote for
	 * @param {String} forId The id of thing to vote for
	 * @param {Number} [value=1] the value the user has voted for, such as a rating etc.
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
	 * @param {boolean} [option.dontStopBeforeShown=false] Don't var Q.Pointer.stopHints stop this hint before it's shown.
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
	 * Shows the next hint for an event
	 * @static
	 * @method nextHint
	 * @param {String} eventName Pass the name of an event, previously set with
	 *  Q.Users.addHint(), and the function will show the next unshown hint for that event.
	 * @return {Boolean} whether a hint was shown or not
	 */
	Users.nextHint = function (eventName) {
		var key, info, index, targets, options;
		info = Q.Users.nextHint.hints[eventName];
		if (!info || !Q.isArrayLike(info)) {
			return false;
		}
		Q.each(info, function (hintIndex) {
			var k = [eventName, hintIndex].join('/');
			if (Q.Users.hinted.indexOf(k) < 0) {
				index = hintIndex;
				key = k;
				return false;
			}
		});
		if (!key) {
			return false; // all hints have been shown
		}
		targets = info[index][0];
		options = info[index][1];
		Users.hint(key, targets, options);
		return true;
	};
	
	Q.Users.nextHint.hints = {};
	
	/**
	 * Adds the hint information for use with Q.Users.nextHint() function.
	 * @static
	 * @method setHint
	 * @param {String} eventName Pass the name of an event, previously set with
	 *  Q.Users.setHint(), and the function will show the next unshown hint for that event.
	 * @param {Element|Object|String|Array} targets see Q.Pointer.hint()
	 * @param {Object} [options] see Q.Pointer.hint()
	 * @param {Number} [hintHindex] You can specify this to override an existing hint,
	 *  otherwise it just adds this hint as the next in the queue.
	 */
	Users.addHint = function (eventName, targets, options, hintIndex) {
		var h = Q.Users.nextHint.hints[eventName] = Q.Users.nextHint.hints[eventName] || [];
		if (hintIndex >= 0) {
			h[hintIndex] = [targets, options];
		} else {
			h.push([targets, options]);
		}
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
	 * Methods for OAuth
	 * @class Users.OAuth
	 * @constructor
	 * @param {Object} fields
	 */
	var OAuth = Users.OAuth = {
		/**
		 * Generate a URL based on the oAuth spec, with a redirect back to our
		 * own endpoint hosted by the Users plugin, to save the information in the database
		 * and possibly close any popup window.
		 * @method url
		 * @static
		 * @param {String} authorizeUri The url of the oAuth service endpoint
		 * @param {String} client_id The id of this client app on the externa; platform.
		 *    Typically found in Users_ExternalTo under appId in the Qbix server database.
		 * @param {String} scope The scopes to request from the platform. See their docs.
		 * @param {Object} [options={}]
		 * @param {String} [options.redirect_uri] You can override the redirect URI.
		 *    Often this has to be added to a whitelist on the platform's side.
		 * @param {String} [options.response_type='code']
		 * @param {String} [options.state=Math.random()] If state was not provided, this
		 *    method also modifies the passed options object and sets options.state on it
		 * @return {String} The URL to redirect to or open in a window
		 */
		url: function (authorizeUri, client_id, scope, options) {
			options = options || {};
			var responseType = options.responseType || 'code';
			var redirectUri = options.redirectUri || Users.OAuth.redirectUri;
			if (options.openWindow) {
				redirectUri = Q.url(redirectUri + '?openWindow=1');
			}
			if (!options.state) {
				options.state = String(Math.random());
			}
			Q.cookie('Users_latest_oAuth_state', options.state);
			Q.url(authorizeUri, {
				client_id: client_id,
				redirect_uri: redirectUri,
				state: options.state,
				response_type: responseType,
				scope: scope
			});
		},
		/**
		 * Start an oAuth flow, and let the Users plugin handle it
		 * @method start
		 * @static
		 * @param {String} platform The name of an external platform under Q.plugins.Users.apps
		 * @param {String} scope The scopes to request from the platform. See their docs.
		 * @param {Function} [callback] This function is called after the oAuth flow ends,
		 *    unless options.openWindow === false, because then the redirect would happen.
		 * @param {Object} [options={}]
		 * @param {Object|String} [openWindow={closeUrlRegExp:Q.url("Users/oauthed")+".*"}] 
		 *    Set to false to start the oAuth flow in the
		 *    current window. Otherwise, this object can be used to set window features
		 *    passed to window.open() as a string.
		 * @param {Object|String} [finalRedirect=location.href] If openWindow === false,
		 *    this can be used to specify the url to redirect to after Users plugin has
		 *    handled the oAuth redirect. Defaults to current window location.
		 * @param {String} [appId=Q.info.app] Override appId to under Q.Users.apps[platform]
		 * @param {String} [options.redirect_uri] You can override the redirect URI.
		 *    Often this has to be added to a whitelist on the platform's side.
		 * @param {String} [options.response_type='code']
		 * @param {String} [options.state=Math.random()] If state was not provided, this
		 *    method also modifies the passed options object and sets options.state on it
		 * @return {String}
		 */
		start: function (platform, scope, callback, options) {
			options = options || {};
			var finalRedirect = options.finalRedirect || location.href;
			var appId = options.appId || Q.info.appId;
			var appInfo = Q.getObject([platform, appId], Users.apps)
			var authorizeUri = options.authorizeUri || appInfo.authorizeUri;
			var client_id = options.client_id || appInfo.client_id || appInfo.appId;
			if (!authorizeUri) {
				throw new Q.Exception("Users.OAuth.start: authorizeUri is empty");
			}
			var redirectUri = options.redirectUri || Users.OAuth.redirectUri;
			var responseType = options.responseType || 'code';
			if (!options.state) {
				options.state = String(Math.random());
			}
			if (!('openWindow' in options)) {
				options.openWindow = {};
			}
			// this cookie will be sent on the next request, probably to Users/oauthed action
			Q.cookie('Q_Users_oAuth', JSON.stringify({
				platform: platform,
				appId: appId,
				scope: scope,
				state: options.state,
				finalRedirect: finalRedirect
			}));
			var url = OAuth.url(authorizeUri, appId, scope, options);
			if (options.openWindow === false) {
				location.href = url;
			} else {
				var w = window.open(url, 'Q_Users_oAuth', options.openWindow);
				var ival = setInterval(function () {
					var regexp = new RegExp(
						options.openWindow.closeUrlRegExp
						|| Q.url("Users/close") + ".*"
					);
					if (w.name === 'Q_Users_oAuth_success'
					|| w.location.href.match(regexp)) {
						w.close();
						callback(w.url);
						clearInterval(ival);
					}
					if (w.name === 'Q_Users_oAuth_error') {
						w.close();
						callback(false);
						clearInterval(ival);
					}
				}, 300);
			}
		}
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
	 * @param {Number|false} [size=40] The last part after the slash, such as "50.png" or "50". Setting it to false skips appending "/basename"
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
		"Users/contacts": "{{Users}}/js/tools/contacts.js",
		"Users/status": "{{Users}}/js/tools/status.js",
		"Users/friendSelector": "{{Users}}/js/tools/friendSelector.js",
		"Users/getintouch": "{{Users}}/js/tools/getintouch.js",
		"Users/sessions": "{{Users}}/js/tools/sessions.js",
		"Users/language": "{{Users}}/js/tools/language.js"
	});

	Q.beforeInit.add(function _Users_beforeInit() {

		var where = Q.getObject("cache.where", Users) || 'document';

		if (Q.Frames) {
			Users.get = Q.Frames.useMainFrame(Users.get, 'Q.Users.get');
		}
		Users.get = Q.getter(Users.get, {
			cache: Q.Cache[where]("Users.get", 100),
			throttle: 'Users.get',
			prepare: function (subject, params, callback) {
				if (subject instanceof User) {
					return callback(subject, params);
				}
				if (params[0]) {
					return callback(subject, params);
				}
				var user = params[1] = new User(subject);
				return callback(user, params);
			}
		});
		
		Users.getContacts = Q.getter(Users.getContacts, {
			cache: Q.Cache[where]("Users.getContacts", 100),
			throttle: 'Users.getContacts',
			prepare: function (subject, params, callback) {
				if (params[0]) {
					return callback(subject, params);
				}
				for (var i in params[1]) {
					params[1][i] = new Users.Contact(params[1][i]);
				};
				return callback(subject, params);
			}
		});

		Users.getLabels = Q.getter(Users.getLabels, {
			cache: Q.Cache[where]("Users.getLabels", 100),
			throttle: 'Users.getLabels',
			prepare: function (subject, params, callback) {
				if (params[0]) {
					return callback(subject, params);
				}
				for (var i in params[1]) {
					params[1][i] = new Users.Label(params[1][i]);
				};
				return callback(subject, params);
			}
		});

		Contact.get = Q.getter(Contact.get, {
			cache: Q.Cache[where]("Users.Contact.get", 100),
			throttle: 'Users.Contact.get',
			prepare: function (subject, params, callback) {
				if (subject instanceof Contact) {
					return callback(subject, params);
				}
				if (params[0]) {
					return callback(subject, params);
				}
				var contact = params[1] = new Contact(subject);
				return callback(contact, params);
			}
		});
		
		Label.get = Q.getter(Label.get, {
			cache: Q.Cache[where]("Users.Label.get", 100),
			throttle: 'Users.Label.get',
			prepare: function (subject, params, callback) {
				if (subject instanceof Contact) {
					return callback(subject, params);
				}
				if (params[0]) {
					return callback(subject, params);
				}
				var contact = params[1] = new Label(subject);
				return callback(contact, params);
			}
		});

		Users.Web3.getContract = Q.getter(Users.Web3.getContract, {
			cache: Q.Cache.document("Users.Web3.getContract")
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
			scope: ['email'], // the permissions to ask for
			linkToken: null,
			dialogContainer: 'body',
			setupRegisterForm: null,
			identifierType: 'email,mobile',
			activation: 'activation'
		}, Q.Users.login.options, Q.Users.login.serverOptions);

		Q.Users.logout.options = Q.extend({
			url: Q.action('Users/logout'),
			using: '*',
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
		Q.Text.get('Users/content', function (err, text) {
			if (!text) {
				return;
			}
			Q.extend(Q.text.Users, 10, text);
		});
		if (Q.Users.loggedInUser
		&& Q.typeOf(Q.Users.loggedInUser) !== 'Q.Users.User') {
			Q.Users.loggedInUser = new Users.User(Q.Users.loggedInUser);
			Q.nonce = Q.cookie('Q_nonce');
		}
		document.documentElement.addClass(Users.loggedInUser ? ' Users_loggedIn' : ' Users_loggedOut');

		var appId = Q.info.app;
		for (var platform in Users.apps) {
			var platformAppId = Users.getPlatformAppId(platform, appId);
			if (platformAppId) {
				Q.handle(Users.init[platform]);
			}
		}
		OAuth.redirectUri = Q.action('Users/oauthed');
	}, 'Users');
	
	function _setSessionFromQueryString(querystring)
	{
		if (!querystring) {
			return;
		}
		if (querystring.queryField('Q.Users.newSessionId')) {
			var fieldNames = [
				'Q.Users.appId', 'Q.Users.newSessionId',
				'Q.Users.deviceId', 'Q.timestamp', 'Q.Users.signature'
			];
			var fields = querystring.queryField(fieldNames);
			var storedDeviceId = localStorage.getItem("Q.Users.Device.deviceId");
			fields['Q.Users.deviceId'] = fields['Q.Users.deviceId'] || storedDeviceId;
			if (fields['Q.Users.newSessionId']) {
				Q.req('Users/session', function () {
					// Q.request.options.onProcessed would have changed loggedInUser already
					// but maybe we want to redirect anyway, after a handoff
					var href = Q.getObject("Q.Cordova.handoff.url");
					if (href) {
						location.href = href;
					}
				}, {
					method: 'post',
					fields: fields
				});
			}
		} else if (querystring.queryField('facebookLogin') == 1) {
			Users.login({using: 'facebook'});
		} 
//      else if ( querystring.queryField('access_token')) {
// 			//  this is not enabled because malicious users can handleOpenUrl to set some token
// 			if (Users.Facebook.accessToken) {
// 				Users.Facebook.doLogin({
// 					status: 'connected',
// 					authResponse: {
// 						accessToken: Users.Facebook.accessToken
// 					}
// 				});
// 			}
// 		}
	}

	Q.Page.onActivate('').add(function _Users_Q_Page_onActivate_handler() {
		$.fn.plugin.load('Q/dialog');
		$.fn.plugin.load('Q/placeholders');
		$('#notices_set_email, #notices_set_mobile')
			.on(Q.Pointer.fastclick, function () {
				Q.plugins.Users.setIdentifier();
				return false;
			});
		_setSessionFromQueryString(location.hash);
	}, 'Users');

	// handoff action
	Q.onHandleOpenUrl.set(function (url) {
		window.cordova.plugins.browsertabs.close();
		_setSessionFromQueryString(url.split('#')[1]);
	}, 'Users.handoff');

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
			Users.Session.key.loaded = null;
			Q.Users.roles = {};
			Q.Session.clear();
			Q.Users.hinted = [];
		}
	}, 'Users');

	Users.init.facebook.onInit = new Q.Event();
	var ddc = document.documentElement;
	Users.onLogin = new Q.Event(function () {
		ddc.className = ddc.className.replace(' Users_loggedOut', '') + ' Users_loggedIn';

		// set language
		var preferredLanguage = Q.getObject("loggedInUser.preferredLanguage", Q.Users);
		var info = preferredLanguage ? [preferredLanguage] : Q.first(Q.info.languages);
		if (info) {
			Q.Text.setLanguage.apply(Q.Text, info);
		}

		// generate a new session key, and tell the server
		var keyConfig = Q.Users.Session.key;
		if (!Q.Users.Session.key.generateOnLogin) {
			return;
		}
		crypto.subtle.generateKey({
			name: keyConfig.name,
			namedCurve: keyConfig.namedCurve
		}, false, ['sign', 'verify'])
		.then(function (key) {
			var dbName = 'Q.Users';
			var storeName = 'keys';
			Q.IndexedDB.open(dbName, storeName, 'id', function (err, store) {
				// try to store non-extractable private key in IndexedDB
				store.put({
					id: 'Users.Session',
					key: key
				}).onsuccess = function (event) {
					// if successfully saved on the client,
					// then tell the server the exported public key
					crypto.subtle.exportKey('spki', key.publicKey)
					.then(function (pk) {
						var key_hex = Array.prototype.slice.call(
							new Uint8Array(pk), 0
						).toHex();
						Q.req('Users/key', ['saved'], function () {
							// now server will require it
						}, {
							method: 'post',
							fields: {
								publicKey: key_hex,
								info: Users.Session.key
							}
						});
					});
				}
			});
		});


	}, 'Users');
	Users.onLogout = new Q.Event(function () {
		Users.Session.key.loaded = null;
		Q.Users.loggedInUser = null;
		Q.Users.roles = {};
		Q.Users.hinted = [];
		Q.Session.clear();
		ddc.className = ddc.className.replace(' Users_loggedIn', '') + ' Users_loggedOut';
	});
	Users.onLoginLost = new Q.Event(function () {
		console.warn("Call to server was made which normally requires user login.");
	});
	Users.onConnected = new Q.Event();
	Users.onDisconnected = new Q.Event();
	
	Q.Socket.onConnect('Users').set(function (socket, ns, url) {
		Q.loadNonce(function () {
			socket.emit('Users/user', Q.Users.capability, Q.clientId(),
			function () {
				Q.handle(Users.Socket.onSession);
			});
		});
	}, 'Users');

	/**
	 * Trying to grab contacts from device
	 * @class Users.chooseContacts
	 */
	Users.chooseContacts = function (callback) {
		// unified object of contacts
		var contacts = [];

		// method to get contacts for Cordova navigator.contacts plugin
		var _getCordovaContacts = function () {
			var contactOptions = new ContactFindOptions();
			contactOptions.filter = "";
			contactOptions.multiple = true;
			contactOptions.desiredFields = [
				navigator.contacts.fieldType.id,
				navigator.contacts.fieldType.displayName,
				navigator.contacts.fieldType.name,
				navigator.contacts.fieldType.phoneNumbers,
				navigator.contacts.fieldType.emails
			];
			var fields = [
				navigator.contacts.fieldType.displayName,
				navigator.contacts.fieldType.name
			];

			navigator.contacts.find(fields, function (data) {
				data = data.sort(function (a, b) {
					return (a.name.formatted > b.name.formatted) ? 1 : ((b.name.formatted > a.name.formatted) ? -1 : 0)
				});

				Q.each(data, function (i, obj) {
					obj.displayName = obj.displayName || obj.name.formatted;

					if (!obj.displayName) {
						return;
					}

					var exist = {};
					Q.each(obj.phoneNumbers, function (i, contact) {
						var value = contact.value.replace(/\D/g, '');

						if (exist[value]) {
							return obj.phoneNumbers.splice(i, 1);
						}
						exist[value] = 1;

						obj.phoneNumbers[i] = value;
					});

					Q.each(obj.emails, function (i, contact) {
						var value = contact.value;

						if (exist[value]) {
							return obj.emails.splice(i, 1);
						}
						exist[value] = 1;

						obj.emails[i] = value;
					});

					contacts.push(obj);
				});

				Q.handle(callback, contacts, ["cordova"]);
			}, function (err) {
				throw new Error("Users.chooseContacts._getCordovaContacts: " + err);
			}, contactOptions);
		};

		// method to get contacts for browser Picker Contacts API (if exists)
		function _getPickerContacts () {
            navigator.contacts.getProperties().then(function (supportedProperties) {
                navigator.contacts.select(supportedProperties, {multiple:true})
                    .then(function (results) {
                        Q.each(results, function (i, obj) {
                            obj.displayName = obj.name[0];

                            if (!obj.displayName) {
                                return;
                            }

                            obj.emails = Array.from(new Set(obj.email));
                            obj.icons = Array.from(new Set(obj.icon));

                            obj.phoneNumbers = Array.from(new Set(obj.tel));
                            obj.phoneNumbers = obj.phoneNumbers.map(function(e) {
                                return e.replace(/\D/g, '');
                            });

                            obj.id = obj.emails.join() + obj.phoneNumbers.join();

                            obj.emails = obj.emails.length ? obj.emails : null;
                            obj.phoneNumbers = obj.phoneNumbers.length ? obj.phoneNumbers : null;
                            obj.icons = obj.icons.length ? obj.icons : null;

                            contacts.push(obj);
                        });

                        Q.handle(callback, contacts, ["browser"]);
                    }).catch(function (ex) {
                    throw new Error("Users.chooseContacts._getPickerContacts: " + ex);
                });
            })
		};

		if (Q.info.isCordova) { // if cordova use navigator.contacts plugin
			_getCordovaContacts(callback);
		} else if ('contacts' in navigator && 'ContactsManager' in window) { // if Picker Contacts API available
			_getPickerContacts(callback);
		} else { // if none available
			Q.handle(callback, null);
		}
	};

	/**
	 * Operates with dialogs.
	 * @class Users.Dialogs
	 */
	Users.Dialogs = {
		/**
	 	* Show a dialog with contacts.
	 	* @static
	 	* @method contacts
		 * @param {object} [options]
	 	* @param {Function} [callback] The function to call after dialog is activated
	 	*/
		contacts: function(options, callback) {
			var allOptions = Q.extend({}, Users.Dialogs.contacts.options, options);
			var selectedContacts = allOptions.data || {};

			Q.addStylesheet('{{Users}}/css/Users/contacts.css', {slotName: 'Users'});

			var _addContact = function (options) {
				var c = {
					id: options.id,
					name: options.name,
					icon: options.icon,
					prefix: options.contactType
				};
				c[options.contactType] = options.contact;
				selectedContacts[options.id] = c;
			};
			var _removeContact = function (id, dialog) {
				$('.tr[data-rawid="'+ id +'"] .Users_contacts_dialog_' + selectedContacts[id].prefix, dialog)
					.removeClass("checked");
				delete selectedContacts[id];

				return false;
			};
			var _prepareContacts = function (dialog) {
				var $parent = $(".Q_dialog_content", dialog);
				var $sticky = $(".Users_contacts_sticky", $parent);

				for(var i in selectedContacts) {
					$('.tr[data-rawid="'+ selectedContacts[i].id +'"] .Users_contacts_dialog_' + selectedContacts[i].prefix, dialog)
						.addClass("checked");
				}

				// adjust letters size to fit all letters to column
				var _adjustHeight = function () {
					var $letters = $("div", $sticky);
					var totalHeight = 0;

					$sticky.height($parent.height());

					Q.each($letters, function (i, element) {
						totalHeight += $(element).height();
					});

					if (totalHeight > $parent.height()) {
						$letters.css('font-size', parseInt($letters.css('font-size')) - 1 + 'px');
						setTimeout(_adjustHeight, 100);
					}
				};
				setTimeout(_adjustHeight, 1000);
			};
			var _rowClick = function ($row, dialog, text) {
				var $email = $row.find(".Users_contacts_dialog_email");
				var $phone = $row.find(".Users_contacts_dialog_phone");
				var emailContact = $email.closest(".td").data("email");
				var phoneContact = $phone.closest(".td").data("phone");
				var name = $row.find(".Users_contacts_dialog_name").text();
				var rawid = $row.data("rawid");

				$row.addClass("Users_contacts_flash");
				setTimeout(function () {
					$row.removeClass("Users_contacts_flash");
				}, 1000);

				if ($row.find(".checked").length) {
					return _removeContact(rawid, dialog);
				}

				if (Q.getObject('length', emailContact)) {
					if (emailContact.length > 1) {
						Users.Dialogs.select({
							displayName: name,
							contacts: emailContact,
							prefix: "email",
							text: text
						}, function (data) {
							if (!data) {
								return;
							}
							$email.addClass("checked");
							_addContact({id: rawid, name: name, icon: icon, contact: data, contactType:"email"});
						})
					} else if (emailContact.length === 1) {
						$email.addClass("checked");
						_addContact({id: rawid, name: name, icon: icon, contact: emailContact[0], contactType:"email"});
					}
				} else if (Q.getObject('length', phoneContact)) {
					if (phoneContact.length > 1) {
						Users.Dialogs.select({
							displayName: name,
							contacts: phoneContact,
							prefix: "phone",
							text: text
						}, function (data) {
							if (!data) {
								return;
							}
							$phone.addClass("checked");
							_addContact({id: rawid, name: name, icon: icon, contact: data, contactType: "phone"});
						})
					} else if (phoneContact.length === 1) {
						$phone.addClass("checked");
						_addContact({id: rawid, name: name, icon: icon, contact: phoneContact[0], contactType: "phone"});
					}
				}
			};

			var _groupContacts = function (contacts) {
				var contactsAlphabet = {};

				// construct contactsAlphabet object: contacts grouped by first name letter
				Q.each(contacts, function (i, contact) {
					var firstLetter = contact.displayName.charAt(0).toUpperCase();

					if (!contactsAlphabet[firstLetter]) {
						contactsAlphabet[firstLetter] = [];
					}

					contactsAlphabet[firstLetter].push(contact);
				});

				// sort contacts letters alphabet
				contactsAlphabet = Object.keys(contactsAlphabet).sort().reduce(function (acc, key) {
					acc[key] = contactsAlphabet[key];
					return acc;
				}, {});

				return contactsAlphabet;
			};

			var pipe = Q.pipe(['contacts', 'text'], function (params) {
				var contacts = params.contacts[0];
				var text = params.text[0];

				Q.Dialogs.push({
					title: text.title,
					template: {
						name: allOptions.templateName,
						fields: {
							contacts: _groupContacts(contacts),
							isCordova: Q.info.isCordova,
							text: text
						}
					},
					apply: true,
					onActivate: function (dialog) {
						var $parent = $(".Q_dialog_content", dialog);

						$($parent).on(Q.Pointer.fastclick, function (e) {
							if (!$(e.target).hasClass("Users_contacts_input")) {
								$(".Users_contacts_input", $parent).trigger('blur');
							}
						});

						$(dialog).on(Q.Pointer.fastclick, '.Users_contacts_dialog_buttons', function () {
							var $this = $(this);
							var $row = $this.closest(".tr");
							var rawid = $row.data("rawid");
							var name = $row.find(".Users_contacts_dialog_name").text();
							var contact = $this.closest(".td").data();
							var contactType = Object.keys(contact)[0];
							contact = Q.getObject(contactType, contact);
							if (!contact || $this.hasClass("checked")) {
								return _removeContact(rawid, dialog);
							}

							$row.find(".checked").removeClass("checked");
							$this.addClass("checked");

							if (contact.length > 1) {
								Users.Dialogs.select({
									displayName: name,
									contacts: contact,
									prefix: contactType,
									text: text
								}, function (data) {
									if (!data) {
										$this.removeClass("checked");
										return;
									}
									_addContact({id: rawid, name: name, contact: data, contactType: contactType});
								})
							} else {
								_addContact({id: rawid, name: name, contact: contact[0], contactType: contactType});
							}

							return false;
						});

						$(dialog).on(Q.Pointer.fastclick, '.tr[data-rawid]', function () {
							var $row = $(this);

							_rowClick($row, dialog, text);
						});

						// scroll to letter
						$(dialog).on(Q.Pointer.fastclick, ".Users_contacts_sticky > div", function () {
							var $offsetElement = $(".Users_contacts_dialog_letter .td:contains(" + $(this).text() + ")", $parent);
							var $header = $(".Users_contacts_header", $parent);

							$parent.animate({
								scrollTop: $parent.scrollTop() - $header.outerHeight() + $offsetElement.position().top
							}, 1000);
						});

						// filter users by name
						$(dialog).on('change keyup input paste', ".Users_contacts_input", function () {
							var filter = $(this).val();
							if (filter) {
								$parent.addClass('Users_contacts_filtering');
							} else {
								$parent.removeClass('Users_contacts_filtering');
							}

							Q.each($(".tr[data-rawId]", $parent), function () {
								var $name = $(".td.Users_contacts_dialog_name", this);
								var text = $name.html().replace(/\<(\/)?b\>/gi, '');

								$name.html(text);

								if (!filter) {
									return;
								}

								if (text.toUpperCase().indexOf(filter.toUpperCase()) >= 0) {
									$name.html(text.replace(new RegExp(filter,'gi'), function(match) {
										return '<b>' + match + '</b>'
									}));
									$(this).addClass('Users_contacts_filter_match');
								} else {
									$(this).removeClass('Users_contacts_filter_match');
								}
							});
						});

						// create new contact
						$(dialog).on(Q.Pointer.fastclick, ".Users_contacts_create", function () {
							var method = Q.getObject("Cordova.UI.create", Users);

							if (!method) {
								return Q.alert(text.CreateAccountNotFound);
							}

							method(function(contactId){
								Users.chooseContacts(function () {
									Q.Template.render(allOptions.templateName, {
										contacts: _groupContacts(this),
										text: text
									}, function (err, html) {
										if (err) {
											return;
										}

										$parent.html(html);
										_prepareContacts(dialog);

										setTimeout(function () {
											var $row = $(".tr[data-rawid='" + contactId + "']", $parent);
											var $header = $(".Users_contacts_header", $parent);

											_rowClick($row, dialog, text);

											$parent.animate({
												scrollTop: $parent.scrollTop() - $header.outerHeight() + $row.position().top
											}, 1000);
										}, 100);
									});
								});
							}, function(err){
								console.warn(err);
							});
						});

						_prepareContacts(dialog);
					},
					onClose: function () {
						Q.handle(callback, Users, [selectedContacts]);
					}
				});
			});

			Q.Text.get("Users/content", function (err, result) {
				pipe.fill('text')(Q.getObject(["contacts", "dialog"], result));
			});

			Users.chooseContacts(function (dataType) {
				var identifierTypes = Q.getObject("identifierTypes", options);
				var contacts = this;

				// clear contacts from objects in email and phoneNumbers
				$.each(contacts, function (i, contact) {
					if (!contact || typeof contact !== "object") {
						return;
					}

					$.each(contact, function (j, obj) {
						if (!obj || typeof obj !== "object" || (j !== "emails" && j !== "phoneNumbers")) {
							return;
						}

						var cleared = [];
						$.each(obj, function (k, element) {
							if (typeof element === "string") {
								cleared.push(element);
							}
						});
						contact[j] = cleared;
					});
				});

				if (!Q.isEmpty(identifierTypes) && dataType === 'browser') {
					Q.each(contacts, function (i, contact) {
						var added = false;

						Q.each(identifierTypes, function (j, type) {
							if (added) {
								return;
							}

							if (type === 'email' && !Q.isEmpty(contact.emails)) {
								added = true;
								return _addContact({
									id: contact.id,
									name: contact.displayName,
									icon: contact.icon,
									contact: contact.emails[0],
									contactType:'email'
								});
							}

							if (type === 'mobile' && !Q.isEmpty(contact.phoneNumbers)) {
								added = true;
								return _addContact({
									id: contact.id,
									name: contact.displayName,
									icon: contact.icon,
									contact: contact.phoneNumbers[0],
									contactType:'phone'
								});
							}
						});
					});

					return Q.handle(callback, Users, [selectedContacts]);
				}

				pipe.fill('contacts')(contacts);
			});
		},
		/**
		 * Show a select dialog with several emails/phones.
		 * @static
		 * @method contacts
		 * @param {object} options
		 * @param {Function} [callback] The function to call after dialog is activated
		 */
		select: function (options, callback) {
			var allOptions = Q.extend({}, Users.Dialogs.select.options, options);
			if (!allOptions.contacts) {
				return;
			}

			var selectedContact = null;
			Q.Dialogs.push({
				title: allOptions.text.title.interpolate({
					displayName: allOptions.displayName
				}),
				template: {
					name: allOptions.templateName,
					fields: {
						contacts: allOptions.contacts,
						prefix: allOptions.prefix
					}
				},
				stylesheet: '{{Users}}/css/Users/contacts.css',
				apply: true,
				onActivate: function (dialog) {
					$('td', dialog).on(Q.Pointer.fastclick, function () {
							var $tr = $(this).closest("tr");
							var $icon = $(".Users_contacts_dialog_buttons", $tr);

							if($icon.hasClass('checked')) {
								return;
							}

							$(dialog).find(".checked").removeClass("checked");
							$icon.addClass("checked");
							selectedContact = $icon.closest("td").data("contact");
						});
				},
				onClose: function () {
					Q.handle(callback, Users, [selectedContact]);
				}
			});
		}
	};
	Users.Dialogs.contacts.options = {
		templateName: "Users/templates/contacts/dialog",
		prefix: "Users"
	};

	Users.Dialogs.select.options = {
		templateName: "Users/templates/contacts/select"
	}

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
			var qs = Q.Socket.get('Users', nodeUrl);
			if (qs && qs.socket &&
			(qs.socket.io.connected || !Q.isEmpty(qs.socket.io.connecting))) {
				_waitForSession.call(qs.socket, 'Users', nodeUrl);
			}
			Q.Socket.connect('Users', nodeUrl, _waitForSession);
			function _waitForSession() {
				var t = this, a = arguments;
				Users.Socket.onSession.addOnce(function (socket, ns, url) {
					callback && callback(socket, ns, url);
				});
			}
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
		onSession: new Q.Event(),

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
		scope: 'email',

		disconnect: function (appId, callback) {
			var platformAppId = Q.getObject(['facebook', appId, 'appId'], Users.apps);
			if (!platformAppId) {
				console.warn("Users.logout: missing Users.apps.facebook." + appId + ".appId");
			}
			Q.cookie('fbs_' + platformAppId, null, {path: '/'});
			Q.cookie('fbsr_' + platformAppId, null, {path: '/'});
			Users.init.facebook(function logoutCallback(err) {
				if (err) {
					return Q.handle(callback);
				}

				Users.Facebook.getLoginStatus(function (response) {
					setTimeout(function () {
						Users.logout.occurring = false;
					}, 0);
					if (!response.authResponse) {
						return Q.handle(callback);
					}
					return FB.logout(function () {
						delete Users.connected.facebook;
						Q.handle(callback);
					});
				}, true);
			}, {
				appId: appId
			});
		},

		construct: function () {
			Users.Facebook.appId = Q.getObject(['facebook', Q.info.app, 'appId'], Users.apps);

			if (Q.info.isCordova) {
				Users.Facebook.scheme = Q.getObject([Q.info.platform, Q.info.app, 'scheme'], Users.apps);
				Users.Facebook.scheme = Users.Facebook.scheme && Users.Facebook.scheme.replace('://', '');
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

		login: function (callback) {
			var scope = Users.Facebook.scope;
			if (Q.isArrayLike(scope)) {
				scope = scope.join(',');
			}
			switch (Users.Facebook.type) {
			case 'web':
				FB.login(function (response) {
					Users.Facebook.doLogin(response);
					callback && callback(response);
				}, scope ? {scope: scope} : undefined);
				break;
			case 'native':
				facebookConnectPlugin.login(["email"], function (response) {
					Users.Facebook.doLogin(response);
					callback && callback(response);
				}, function (err) {
					console.warn(err);
				});
				break;
			case 'oauth':
				var url = 'https://www.facebook.com/v2.11/dialog/oauth' +
					'?client_id=' + Users.Facebook.appId +
					'&redirect_uri=' + Q.baseUrl() + '/login/facebook%3Fscheme%3D' + Users.Facebook.scheme +
					'&state=' + _stringGen(10) +
					'&response_type=token&scope=' + Users.Facebook.scope.join(",");
				cordova.plugins.browsertabs.openUrl(url,
					{scheme: Users.Facebook.scheme + '://'},
					function(success) { console.log(success); },
					function(err) { console.log(err); }
				);
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
				var $usersLoginIdentifier = $('#Users_login_identifier');
				if (!me.email) {
					step1_form.data('used', null);
					alert(Q.text.Users.login.facebook.noEmail);
					$usersLoginIdentifier.plugin('Q/clickfocus');
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

				if ($usersLoginIdentifier.length) {
					$usersLoginIdentifier
						.val(me.email)
						.closest('form')
						.submit();
					// The login onSuccess callback is about to be called
				} else {
					var url = Q.action(Users.login.options.userQueryUri) + '?' + $.param({
						identifier: me.email,
						identifierType: 'email'
					});
					Q.request(url, ['data'], function (err, response) {
						if (response.errors) {
							return;
						}

						// auto-login by authenticating with facebook
						Users.authenticate('facebook', function (user) {
							priv.login_connected = true;
							priv.login_onConnect && priv.login_onConnect(user);
						}, function () {
							priv.login_onCancel && priv.login_onCancel();
						}, {"prompt": false});

					}, {xhr: Q.info.isTouchscreen ? 'sync' : {}});
				}
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
					var timeout = 5000;
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
						if (FB.getAuthResponse()) {
							FB.getLoginStatus(cb, force);
						}
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
	
	Users.Web3 = {
		provider: null,
		web3Modal: null,
		onAccountsChanged: new Q.Event(),
		onChainChanged: new Q.Event(),
		onConnect: new Q.Event(),
		onDisconnect: new Q.Event(),

		disconnect: function (appId, callback) {
			if (Users.disconnect.web3.occurring) {
				return false;
			}
			localStorage.removeItem('walletconnect');
			localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
			Users.disconnect.web3.occurring = true;
			var p = Users.Web3.provider;
			if (window.Web3Modal && Web3Modal.default) {
				var w = new window.Web3Modal.default;
				if (w.clearCachedProvider) {
					w.clearCachedProvider();
				}
			}
			if (!p) {
				Q.handle(callback);
				Users.disconnect.web3.occurring = false;
				return false;
			}
			if (p.close) {
				p.close().then(function (result) {
					delete Users.connected.web3;
					Users.Web3.provider = null;
					setTimeout(function () {
						Users.disconnect.web3.occurring = false;
						Q.handle(callback);
					}, 0);
				});
				Users.disconnect.web3.cleanupT = setTimeout(function () {
					Users.disconnect.web3.occurring = false;
					delete Users.disconnect.web3.cleanupT;
				}, 300);
			} else {
				setTimeout(function () {
					Users.logout.occurring = false;
				}, 0);
				if (p._handleDisconnect) {
					p._handleDisconnect();
				}
				delete Users.connected.web3;
				Users.Web3.provider = null;
				Q.handle(callback);
				Users.disconnect.web3.occurring = false;
			}
			return true;
		},

		/**
		 * Get web3Modal instance
		 * @method getWeb3Modal
		 * @static
		 */
		getWeb3Modal: function (appId) {
			appId = appId || Q.info.app;
			var wcOptions = {};
			var rpc, infuraId;
			if (rpc = Q.getObject(['web3', appId, 'providers', 'walletconnect', 'rpc'], Users.apps)) {
				wcOptions.rpc = rpc;
			} else if (infuraId = Q.getObject(['web3', appId, 'providers', 'walletconnect', 'infura', 'projectId'], Users.apps)) {
				wcOptions.infuraId = infuraId;
			}
			var providerOptions = {};
			providerOptions.walletconnect = {
				package: window.WalletConnectProvider.default,
				options: wcOptions
			};
			var fortmatic_key = Q.getObject(['web3', appId, 'providers', 'fortmatic', 'key'], Users.apps);
			if (fortmatic_key) {
				providerOptions.fortmatic = {
					package: window.Fortmatic, // required
					options: {
						key: fortmatic_key // required
					}
				};
			} else {
				console.warn("key required for Fortmatic wallet");
			}
			var portis_id = Q.getObject(['web3', appId, 'providers', 'portis', 'id'], Users.apps);
			if (portis_id) {
				providerOptions.portis = {
					package: window.Portis, // required
					options: {
						id: portis_id // required
					}
				};
			} else {
				console.warn("id required for Portis wallet");
			}

			var disableInjectedProvider = Q.getObject(['web3', appId, 'disableInjectedProvider'], Users.apps);
			Users.Web3.web3Modal = new window.Web3Modal.default({
				// chain: options.chain,
				cacheProvider: false, // optional
				providerOptions: providerOptions, // required
				disableInjectedProvider: disableInjectedProvider // optional. For MetaMask / Brave / Opera.
			});

			return Users.Web3.web3Modal;
		},

		/**
		 * Connect web3 wallet session
		 * @method connect
		 * @param {Function} callback
		 */
		connect: function (callback) {
			if (Users.Web3.provider) {
				return Q.handle(callback, null, [null, Users.Web3.provider]);
			}

			// Try with MetaMask-type connection first
			if (window.ethereum && ethereum.request) {
				return ethereum.request({ method: 'eth_requestAccounts' })
				.then(function (accounts) {
					Users.Web3.provider = ethereum;
					return Q.handle(callback, null, [null, Users.Web3.provider]);
				}).catch(function (e) {
					Q.handle(callback, null, [e]);
				});
			}

			var web3Modal = Users.Web3.web3Modal || Users.Web3.getWeb3Modal();
			web3Modal.clearCachedProvider();
			web3Modal.resetState();
			web3Modal.connect().then(function (provider) {
				Users.Web3.provider = provider;
				Q.handle(callback, null, [null, provider]);
			}).catch(function (ex) {
				Q.handle(callback, null, [ex]);
				throw new Error(ex);
			});
		},
		/**
		 * Execute method on contract
		 * @method execute
		 * @param {string} contractABIName Name of the view template that contains the ABI JSON
		 * @param {string} contractAddress Starts with "0x"
		 * @param {String} contractABIName
		 * @param {String} contractAddress
		 * @param {String} methodName
		 * @param {Array} params
		 * @param {function} callback Called from the ethers.js contract method with the results
		 */
		execute: function (contractABIName, contractAddress, methodName, params, callback) {
			Users.Web3.getContract(
				contractABIName, 
				contractAddress, 
				function (err, contract) {
					if (!contract[methodName]) {
						return Q.handle(callback, null, ["WrongMethod"]);
					}
					contract[methodName].apply(null, params).then(function (result) {
						Q.handle(callback, null, [null, result]);
					}, function (err) {
						Q.handle(callback, null, [err]);
					});
				}
			);
		},
		/**
		 * Get currently selected wallet address
		 * @method execute
		 * @param {string} methodName
		 * @param {mixed} params
		 * @param {string|object} contract
		 * @param {function} callback
		 */
		getWallet: function (callback) {
			Users.Web3.connect(function (err, provider) {
				if (err) {
					return Q.handle(callback, null, [err]);
				}

				(new Web3(provider)).eth.getAccounts().then(function (accounts) {
					return Q.handle(callback, null, [null, accounts[0]]);
				});
			});
		},
		/**
		 * Get currently selected chain id
		 * @method getChainId
		 * @param {Function} callback
		 */
		getChainId: function (callback) {
			Users.Web3.connect(function (err, provider) {
				if (err) {
					return Q.handle(callback, null, [err]);
				}

				(new Web3(provider)).eth.net.getId().then(function (chainId) {
					return Q.handle(callback, null, [null, chainId]);
				});
			});
		},
		/**
		 * Switch provider to a different Web3 chain
		 * @method switchChain
		 * @static
		 * @param {Object} info
		 * @param {String} info.chainId
		 * @param {String} info.name
		 * @param {String} info.currency
		 * @param {String} info.currency.name
		 * @param {String} info.currency.symbol
		 * @param {Number} info.currency.decimals
		 * @param {Array} info.rpcUrls
		 * @param {Array} info.blockExplorerUrls
		 * @param {Function} onSuccess
		 * @param {Function} onError
		 */
		switchChain: function (info, onSuccess, onError) {
			Users.Web3.connect(function (err, provider) {
				if (err) {
					return Q.handle(onError, null, [err]);
				}

				Users.Web3.switchChainOccuring = true;
				
				provider.request({
					method: 'wallet_switchEthereumChain',
					params: [{ chainId: info.chainId }],
				}).then(_continue)
				.catch(function (switchError) {
					// This error code indicates that the chain has not been added to MetaMask.
					if (switchError.code !== 4902) {
						return Q.handle(onError, null, [switchError]);
					}
					provider.request({
						method: 'wallet_addEthereumChain',
						params: [{
							chainId: info.chainId,
							chainName: info.name,
							nativeCurrency: {
								name: info.currency.name,
								symbol: info.currency.symbol,
								decimals: info.currency.decimals
							},
							rpcUrls: info.rpcUrls,
							blockExplorerUrls: info.blockExplorerUrls
						}]
					}).then(_continue)
					.catch(function (error) {
						Q.handle(onError, null, [error]);
					});
				});

				function _continue() {
					provider.once("chainChanged", onSuccess);
				}
			});
		},

		/**
		 * Used get the currently selected address on current ethereum chain
		 * @method getSelectedXid
		 * @static
		 * @return {string} the currently selected address of the user in web3
		 */
		getSelectedXid: function () {
			var result, provider
			provider = Q.Users.Web3.provider || window.ethereum;
			result = provider.selectedAddress || provider.accounts[0];
			if (result) {
				return result;
			}
		},

		/**
		 * Used to get the logged-in user's ID on any chain
		 * @method getLoggedInUserXid
		 * @static
		 * @return {string} the currently selected address of the user in web3
		 */
		getLoggedInUserXid: function () {
			var xids = Q.getObject('Q.Users.loggedInUser.xids');
			var key = 'web3_all';
			if (xids && xids[key]) {
				return xids[key];
			}
		},

		/**
		 * Used to fetch the ethers.Contract object to use with a smart contract.
		 * @method getContract
		 * @static
		 * @param {string} contractABIName Name of the view template that contains the ABI JSON
		 * @param {string} contractAddress Starts with "0x"
		 * @param {Function} [callback] receives (err, contract)
		 * @return {Promise} that would resolve with the ethers.Contract
		 */
		getContract: function(contractABIName, contractAddress, callback) {
			Q.Template.set(contractABIName, undefined, "abi.json");
			Q.Template.render(contractABIName, function (err, json) {
				try {
					var ABI = JSON.parse(json);
				} catch (e) {
					return Q.handle(callback, null, [e]);
				}
				if (window.ethereum
				&& parseInt(ethereum.chainId) === parseInt(Q.getObject([
					'Q', 'Users', 'apps', 'web3', Q.info.app, 'appId'
				]))) {
					_continue(ethereum);
				} else {
					Q.Users.Web3.connect(function (err, provider) {
						if (err) {
							return Q.handle(callback, null, [err]);
						}
						_continue(provider);
					});
				}
				function _continue(provider) {
					try {
						var signer = new ethers.providers.Web3Provider(provider).getSigner();
						var contract = new ethers.Contract(contractAddress, ABI, signer);
						contract.ABI = ABI;
						Q.handle(callback, contract, [null, contract]);
					} catch (err) {
						Q.handle(callback, null, [err]);
					};
				}
			});
		}
	};

	/**
	 * Disconnect external platforms
	 */
	Users.disconnect = {};
	Users.disconnect.facebook = Users.Facebook.disconnect;
	Users.disconnect.web3 = Users.Web3.disconnect;

	Q.onReady.add(function () {
		Users.Facebook.construct();

		if (window.ethereum) {
			window.ethereum.on("accountsChanged", function (accounts) {
				Q.handle(Users.Web3.onAccountsChanged, this, [accounts]);
			});
			window.ethereum.on("chainChanged", function (chainId) {
				Q.handle(Users.Web3.onChainChanged, this, [chainId]);
			});
			window.ethereum.on("connect", function (info) {
				Q.handle(Users.Web3.onConnect, this, [info]);
			});
		}
	}, 'Users');

	Q.Dialogs.push.options.onActivate.set(function (dialog) {
		var $dialog = $(dialog);
		Users.hint("Users/dialogCloseHint", $dialog.find('.Q_close')[0], {
			show: {delay: 5000},
			dontStopBeforeShown: true
		});
	}, 'Users.dialogCloseHint');
	
	Q.Users.cache = Q.Users.cache || {};
	
	Q.ensure.loaders['Q.Users.Faces'] = '{{Users}}/js/Faces.js';

})(Q, jQuery);

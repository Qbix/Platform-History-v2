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
		roles: {},
		urls: {}
	};
    
	var dc = Q.extend.dontCopy;
	dc["Q.Users.User"] = true;

	/**
	 * Text for Users plugin, will be overridden by loaded language file
	 * @property Q.text.Users
	 * @type {Object}
	 */
	Q.text.Users = {

		avatar: {
			Someone: "Someone"
		},

		identifier: {
			types: {
				Email: "Email",
				Mobile: "Mobile",
				Web3: "Web3"
			}
		},

		platforms: {
			Wallet: "Wallet",
			Broadcast: "Broadcast"
		},

		login: {
			title: 'Welcome',
			directions: {
				"GetStarted": "Create an account, or log in.",
				"NoRegister": "Log in if you have an account.",
				"WasInvited": "What's the best way to reach you?"
			},
			explanation: null,
			goButton: "&#10132",
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
			connectPlatforms: "or connect using:",
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
				ConnectWallet: "Connect Wallet",
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

		clipboard: {
			Copied: "Copied! Now you can paste it anywhere."
		},

		authorize: {
			mustAgree: "First you must agree to the terms."
		},

		labels: {
			addToPhonebook: "Add To My Phone Contacts",
			addLabel: "New Relationship",
			"prompt": "Give it a name"
		},

		web3: {
			PasteAddress: "Paste a valid Web3 address"
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
				if (window.FB) {
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
		if (Q.getObject("init.web3.complete", Users)) {
			callback && callback();
		}

		if (!Q.getObject('web3', Users.apps)) {
			return;
		}

		var scriptsToLoad = [
			'{{Users}}/js/web3/ethers-5.2.umd.min.js',
			'{{Users}}/js/web3/evm-chains.min.js',
			'{{Users}}/js/web3/ethereumProvider.2.10.1.min.js' //'https://unpkg.com/@walletconnect/ethereum-provider'
		];

		Q.addScript(scriptsToLoad, function () {
			Users.init.web3.complete = true;

			if (Users.Web3.ethereumProvider || Q.getObject("ethereum.request", window)) {
				return callback && callback(null);
			}
			var projectId = Q.getObject(['web3', Users.communityId, 'providers', 'walletconnect', 'projectId'], Q.Users.apps);
			if (!projectId) {
				return callback && callback("Users.init.web3: Missing Q.Users.apps.web3." + Users.communityId + ".providers.walletconnect.projectId");
			}

			var optionalChains = [];
			var rpcMap = {};
			if (typeof Users.Web3.chains === "object") {
				for (var chainId in Users.Web3.chains) {
					var c = Web3.chains[chainId];
					var r = c.rpcUrls;
					optionalChains.push(parseInt(chainId));
					rpcMap[chainId] = Q.isArrayLike(r) ? r[0]: 0;
				};
			}
			window['@walletconnect/ethereum-provider'].EthereumProvider.init({
				projectId: projectId, // REQUIRED your projectId
				showQrModal: true, // REQUIRED set to "true" to use @walletconnect/modal
				qrModalOptions: { themeMode: "light" },
				optionalChains: optionalChains,
				rpcMap: rpcMap,
				methods: ["eth_sendTransaction", "personal_sign", "eth_sign", "wallet_switchEthereumChain", "wallet_addEthereumChain"],
				//optionalMethods: ["eth_accounts","eth_requestAccounts","eth_sendRawTransaction","eth_sign","eth_signTransaction","eth_signTypedData","eth_signTypedData_v3","eth_signTypedData_v4","wallet_switchEthereumChain","wallet_addEthereumChain","wallet_getPermissions","wallet_requestPermissions","wallet_registerOnboarding","wallet_watchAsset","wallet_scanQRCode"],
				events: ["chainChanged", "accountsChanged","disconnect","connect"],
				optionalEvents: ["message"],
				metadata: {
					name: Q.info.app,
					description: 'Web3 Client',
					url: Q.info.baseUrl,
					icons: [Q.url("{{baseUrl}}/img/icon/icon.png")]
				},
			}).then(function (ethereumProvider) {
				Users.Web3.ethereumProvider = ethereumProvider;
				callback && callback();
			});
		}, options);
	};

	Users.init.web3 = Q.getter(Users.init.web3);

	/**
	 * Check whether string is community id
	 * @method isCommunityId
	 * @static
	 * @param {String} id
	 * @return {boolean}
	 */
	Users.isCommunityId = function (id) {
		if (!id || id[0] !== id[0].toUpperCase()) {
			return false;
		}

		return true;
	};
	
	/**
	 * Check if an icon is custom or whether it's been automatically generated
	 * @method isCustomIcon
	 * @static
	 * @param {String} icon
	 * @param {Boolean} [unlessImported=false] - If true, don't treat imported icon as custom
	 * @return {boolean}
	 */
	Users.isCustomIcon = function (icon, unlessImported=false) {
		if (!icon) {
			return false;
		}
		return !!((!unlessImported && icon.indexOf('imported') >= 0)
		|| icon.match(/\/icon\/[0-9]+/)
		|| icon.indexOf('invited') >= 0);
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

    Users.authenticate = new Q.Method();
        
    
	Users.getPlatformAppId = function (platform, appId) {
		return Q.getObject([platform, appId, 'appIdForAuth'], Users.apps)
			|| Q.getObject([platform, '*', 'appIdForAuth'], Users.apps)
			|| Q.getObject([platform, appId, 'appId'], Users.apps);
	};

	
	function _authenticate(platform) {
		Users.authenticate(platform, function (user) {
			priv.login_onConnect(user);
		}, function () {
			priv.login_onCancel();
		}, {"prompt": false});
	}
	
	priv.handleXid = function _handleXid(platform, platformAppId, xid, onSuccess, onCancel, options) {
		var ignoreXid = Q.cookie('Users_ignorePlatformXids_'+platform+"_"+platformAppId);

		// the following line prevents multiple prompts for the same user,
		// which can be a problem especially if the authenticate() is called
		// multiple times on the same page, or because the page is reloaded
		Q.cookie('Users_ignorePlatformXids_'+platform+"_"+platformAppId, xid);

		var key = platform + "_" + platformAppId;
		if (Users.loggedInUser && Users.loggedInUser.xids[key] == xid) {
			// The correct user is already logged in.
			// Call onSuccess but do not pass a user object -- the user didn't change.
			priv._doSuccess(null, platform, platformAppId, onSuccess, onCancel, options);
			return;
		}
		if (options.prompt === undefined || options.prompt === null) {
			// show prompt only if we aren't ignoring this platform xid
			if (xid == ignoreXid) {
				priv._doCancel(null, platform, platformAppId, onSuccess, onCancel, options);
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
			priv._doCancel.call(this, platform, platformAppId, x, onSuccess, onCancel, options);
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
					priv._doCancel(platform, platformAppId, null, onSuccess, onCancel, options);
					return;
				}
				ar.expires = Math.floor(Date.now() / 1000) + ar.expiresIn;
				ar.fbAppId = platformAppId;
				ar.appId = appId;
				fields['Q.Users.facebook.authResponse'] = ar;
			} else if (platform === 'web3') {
				Q.extend(fields, Web3.authResponse);
				fields.updateXid = !!Q.getObject("updateXid", options);
			}
			priv._doAuthenticate(fields, platform, platformAppId, onSuccess, onCancel, options);
		}
	}
	
	priv._doSuccess = function _doSuccess(user, platform, platformAppId, onSuccess, onCancel, options) {
		// if the user hasn't changed then user is null here
		Users.connected[platform] = true;
		Users.onConnected.handle.call(Users, platform, user, options);
		Q.handle(onSuccess, this, [user, options]);
		Users.authenticate.occurring = false;
	}

	priv._doCancel = function _doCancel(platform, platformAppId, xid, onSuccess, onCancel, options) {
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
	
	priv._doAuthenticate = function _doAuthenticate(fields, platform, platformAppId, onSuccess, onCancel, options) {
		Q.req('Users/authenticate', 'data', function (err, response) {
			var fem = Q.firstErrorMessage(err, response);
			if (fem) {
				alert(fem);
				return priv._doCancel(platform, platformAppId, fields.xid, onSuccess, onCancel, options);
			}
			Q.Response.processScriptDataAndLines(response);
			var user = response.slots.data;
			if (user.authenticated !== true) {
				priv.result = user.authenticated;
			}
			priv.used = platform;
			user.result = user.authenticated;
			user.used = platform;
			Users.loggedInUser = new Users.User(user);
			Q.nonce = Q.cookie('Q_nonce') || Q.nonce;
			priv._doSuccess(user, platform, platformAppId, onSuccess, onCancel, options);
		}, {
			method: "post",
			loadExtras: "session",
			fields: Q.extend({ platform: platform, appId: platformAppId }, fields)
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
			Users.sign(fields, function (err, fields) {
				options.fields = fields;
				callback(url, slotNames, options);
			}, fieldNames);
		});
		if (!found) {
			return callback(url, slotNames, options);
		}
	});

	/**
	 * Generates a signature for a specific payload with the user's private key, if it has been saved in IndexedDB.
	 * Gets canonical serialization of the payload with Q.serialize(),
	 * then gets the key from IndexedDB and signs the serialization.
	 * It can be verified with Users.verify() in JS or Q_Users::verify() in PHP.
	 * @method signature
	 * @static
	 * @param {Object} payload The payload to sign. It will be serialized with Q.serialize()
	 * @param {Function} callback Receives err and then the signature, if one was computed, followed by the keypair
	 * @param {Object} options
	 * @param {Object} [options.key] Set the key to use, to sign the payload with
	 * @param {Array} [options.fieldNames] The names of the fields from the payload to sign, otherwise signs all.
	 * @return {Boolean} Returns true unless crypt.subtle is undefined because the page is in insecure context
	 */
	Users.signature = function (payload, callback, options) {
		if (!crypto || !crypto.subtle) {
			return false;
		}
		var fieldNames = options && options.fieldNames;
		// if (fieldNames && fieldNames.indexOf(Users.signatures.nonceField) < 0) {
		// 	fieldNames.push(Users.signatures.nonceField);
		// }
		var serialized = Q.serialize(
			fieldNames ? Q.take(payload, fieldNames) : payload
		);
		var key = (options && options.key) || Users.Session.key.loaded;
		if (key) {
			_sign(null, key);
		} else {
			Users.Session.getKey(_sign);
		}
		function _sign(err, key) {
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
				Q.handle(callback, null, [null, signature, key]);
			}).catch(function (e) {
				Q.handle(callback, null, [e]);
			});
		}
	};

	Users.prompt = new Q.Method({
		options: {
			dialogContainer: 'body'
		}
	});
	Users.scope = new Q.Method();
	Users.sign = new Q.Method();

	Users.login = new Q.Method({
		options: {
			onCancel: new Q.Event(),
			onSuccess: new Q.Event(function Users_login_onSuccess(user, options, priv) {
				// default implementation
				if (Q.isEmpty(user)) {
					return;
				}

				// the user changed, redirect to their home page
				var urls = Q.urls || {};
				var nextUrl = options.successUrl;
				if (priv.result === 'register' && options.onboardingUrl) {
					nextUrl = options.onboardingUrl;
				}
				var url = nextUrl || urls[Q.info.app + '/home'] || Q.url('');
				Q.handle(url);
				Q.handle(options.onComplete);
			}, 'Users'),
			onResult: new Q.Event(),
			onRequireComplete: new Q.Event(),
			onComplete: new Q.Event(),
			onboardingUrl: null,
			successUrl: null,
			accountStatusURL: null,
			tryQuietly: false,
			using: 'native', // can also be a platform name like 'facebook'
			scope: ['email'], // the permissions to ask for
			linkToken: null,
			dialogContainer: 'body',
			setupRegisterForm: null,
			identifierType: 'email,mobile',
			activation: 'activation'
		}
	});
	Users.onComplete = new Q.Event();

	Users.logout = new Q.Method({
		options: {
			url: Q.action('Users/logout'),
			using: '*',
			onSuccess: new Q.Event(function (options) {
				var urls = Q.urls || {};
				Q.handle(options.welcomeUrl
					|| urls[Q.info.app + '/welcome']
					|| Q.url(''));
			}, 'Users')
		}
	});

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
	 * @param {String|Number|false} [size=40] The last part after the slash, such as "50.png" or "50".
	 *  Setting it to false skips appending "/size".
	 *  Setting it to "largestWidth"or "largestHeight" gets the size with largest explicit width or height, respectively.
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
 	 * @param {String|Number|false} [size=40] The last part after the slash, such as "50.png" or "50".
	 *  Setting it to false skips appending "/size".
 	 *  Setting it to "largestWidth"or "largestHeight" gets the size with largest explicit width or height, respectively.
	 * @return {String} the url
	 */
	Users.iconUrl = function Users_iconUrl(icon, size) {
		if (!icon) {
			console.warn("Users.iconUrl: icon is empty");
			return '';
		}
		if ((size === true) // for backward compatibility
		|| (!size && size !== false)) {
			size = '40';
		}
		if (size === 'largestWidth' || size === 'largestHeight') {
			size = Q.largestSize(Q.image.sizes['Users/icon'], size === 'largestHeight');
		}
		size = (String(size).indexOf('.') >= 0) ? size : size + '.png';
		var src = Q.interpolateUrl(icon + (size ? '/' + size : ''));
		return src.isUrl() || icon.substr(0, 2) === '{{'
			? Q.url(src)
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

	Users.setIdentifier = new Q.Method({
		options: {
			onCancel: null,
			onSuccess: null, // gets passed session
			identifierType: 'email,mobile',
			dialogContainer: 'body'
		}
	});

	priv._submitting = false;
	Users.submitClosestForm = function submitClosestForm() {
		priv._submitting = true;
		$(this).closest('form').submit();
		setTimeout(function () {
			priv._submitting = false;
		}, 500);
		return false;
	}

	Users.vote = new Q.Method();

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
	 * @param {Boolean|Object} [options.waitUntilVisible=false] Wait until it's visible, then show hint right away. You can also pass an options here for Q.Pointer.waitUntilVisible(). Typically used together with dontStopBeforeShown.
	 * @param {boolean} [option.dontStopBeforeShown=false] Don't var Q.Pointer.stopHints stop this hint before it's shown. If waitUntilVisible is true, the stopHints checks are deferred.
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
		info = Users.nextHint.hints[eventName];
		if (!info || !Q.isArrayLike(info)) {
			return false;
		}
		Q.each(info, function (hintIndex) {
			var k = [eventName, hintIndex].join('/');
			if (Users.hinted.indexOf(k) < 0) {
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
	
	Users.nextHint.hints = {};
	
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
		var h = Users.nextHint.hints[eventName] = Users.nextHint.hints[eventName] || [];
		if (hintIndex >= 0) {
			h[hintIndex] = [targets, options];
		} else {
			h.push([targets, options]);
		}
	};

	Users.facebookDialog = new Q.Method();

	Users.getContacts = new Q.Method();

	Users.getLabels = new Q.Method();
    
    Users.getPermissions = new Q.Method();
    
    Users.managePermissions = new Q.Method();

	/**
	 * Methods for setting up common user interface elements
	 * @class Users.Interface
	 */
	Users.Interface = {
		/**
		 * Set up cover photo editor
		 * @method coverPhoto
		 * @static
		 * @param {Element} trigger the button
		 * @param {Element} container 
		 * @param {Object} options
		 */
		coverPhoto: function (trigger, container, options) {
			var userId = Q.Users.loggedInUserId();
			if (!userId) {
				return false;
			}
			var splitId = userId.splitId('');
			var url = Q.url("{{baseUrl}}/Q/uploads/Users/" + splitId + "/cover/" + Q.image.defaultSize['Users/cover'] + ".png?" + new Date().getTime());
			container.style['background-image'] = "url(" + url + ")";
			Q.Tool.setUpElement(trigger, 'Q/imagepicker', Q.extend({
				saveSizeName: 'Users/cover',
				//showSize: state.icon || $img.width(),
				path: 'Q/uploads/Users',
				subpath: splitId + '/cover',
				save: "Users/cover",
				onSuccess: function () {
					var newUrl = Q.url("{{baseUrl}}/Q/uploads/Users/" + splitId + "/cover/" + Q.image.defaultSize['Users/cover'] + ".png?" + new Date().getTime());
					container.style['background-image'] = "url(" + newUrl + ")";
				}
			}, options));
			Q.activate(trigger);
		}
	};

	/**
	 * Methods for user sessions
	 * @class Users.Session
	 */
	Users.Session = Q.Method.define({
		key: {
			generateOnLogin: true,
			name: 'ECDSA', 
			namedCurve: 'P-256',
			hash: 'SHA-256'
		},
		getKey: new Q.Method(),
		generateKey: new Q.Method()
	}, "{{Users}}/js/methods/Users/Session",
	function() {
		return [Users, priv];
	});
	
	/**
	 * Methods for OAuth
	 * @class Users.OAuth
	 * @constructor
	 * @param {Object} fields
	 */
	var OAuth = Users.OAuth = Q.Method.define({
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
		start: new Q.Method()
	}, "{{Users}}/js/methods/Users/OAuth",
	function() {
		return [Users, priv];
	});

	priv._Users_manage = function(action, method, fields, field, Constructor, getter, callback) {
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
	 * Constructs a contact from fields, which are typically returned from the server.
	 * @class Users.Contact
	 * @constructor
	 * @param {Object} fields
	 */
	var Contact = Users.Contact = function Users_Contact(fields) {
		Q.extend(this, fields);
		this.typename = 'Q.Users.Contact';
	};
	Contact.get = new Q.Method();
	Contact.add = new Q.Method();
	Contact.remove = new Q.Method();
	Q.Method.define(Contact,
		"{{Users}}/js/methods/Users/Contact", 
		function() {
			return [Users, priv];
		}
	);

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
	 * Calculate the url of a label's icon
	 * @method
	 * @param {Number|false} [size=40] The last part after the slash, such as "50.png" or "50". Setting it to false skips appending "/size"
	 * @return {String} the url
	 */
	Lp.iconUrl = function Users_Label_iconUrl(size) {
		return Users.iconUrl(this.icon.interpolate({
			userId: this.userId.splitId()
		}), size);
	};

	Label.isExternal = function (label) {
		return label.startsWith(Label.externalPrefix);
	};

	Label.labelTitle = function (label) {
		return Q.getObject([label, 'title'], Q.Users.labels)
			|| label.split('/').pop().toUpperCase();
	};

	Label.get = new Q.Method();
	Label.add = new Q.Method();
	Label.update = new Q.Method();
	Label.remove = new Q.Method();

	Q.Method.define(Label,
		"{{Users}}/js/methods/Users/Label", 
		function() {
			return [Users, priv];
		}
	);

	Q.Text.addFor(
		['Q.Tool.define', 'Q.Template.set'],
		'Users/', ["Users/content"]
	);
	Q.Tool.define({
		"Users/avatar": "{{Users}}/js/tools/avatar.js",
		"Users/list": {
			js: "{{Users}}/js/tools/list.js",
			css: "{{Users}}/css/tools/list.css"
		},
		"Users/pile": {
			js: "{{Users}}/js/tools/pile.js",
			css: "{{Users}}/css/tools/pile.css"
		},
		"Users/labels": {
			js: "{{Users}}/js/tools/labels.js",
			css: ["{{Users}}/css/tools/labels.css", "{{Q}}/css/bootstrap-custom/bootstrap.css"],
            text: ["Users/content","Users/labels"]
		},
		"Users/roles": {
			js: "{{Users}}/js/tools/roles.js",
			css: "{{Users}}/css/tools/roles.css"
		},
		"Users/contacts": {
			js: "{{Users}}/js/tools/contacts.js",
			css: "{{Users}}/css/tools/contacts.css"
		},
		"Users/status": "{{Users}}/js/tools/status.js",
		"Users/friendSelector": "{{Users}}/js/tools/friendSelector.js",
		"Users/getintouch": "{{Users}}/js/tools/getintouch.js",
		"Users/sessions": "{{Users}}/js/tools/sessions.js",
		"Users/language": "{{Users}}/js/tools/language.js",
		"Users/people": {
			js: "{{Users}}/js/tools/people.js",
			css: "{{Users}}/css/tools/people.css"
		},
		"Users/web3/address": {
			js: "{{Users}}/js/tools/web3/address.js",
			css: "{{Users}}/css/tools/web3/address.css"
		},
		"Users/web3/community": {
			js: "{{Users}}/js/tools/web3/community.js",
			css: ["{{Users}}/css/tools/web3/community.css", "{{Q}}/css/bootstrap-custom/bootstrap.css"],
            text: ["Users/content", "Users/web3/community"]
		}
	});

	Q.beforeInit.add(function _Users_beforeInit() {

		Q.Users.cacheWhere = Q.getObject("cache.where", Users) || 'document';

		var preferredLanguage = Q.getObject("loggedInUser.preferredLanguage", Q.Users);
		if (preferredLanguage) {
			Q.Text.setLanguage.apply(Q.Text, [preferredLanguage]);
		}

		if (Q.Frames) {
			Users.get = Q.Frames.useMainFrame(Users.get, 'Q.Users.get');
		}
		Users.get = Q.getter(Users.get, {
			cache: Q.Cache[Users.cacheWhere]("Users.get", 100),
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
		
		Users.lastSeenNonce = Q.cookie('Q_nonce');

		Q.extend(Users.login.options, Users.login.serverOptions);
		Q.extend(Users.logout.options, Users.logout.serverOptions);
		Q.extend(Users.setIdentifier.options, Users.setIdentifier.serverOptions);
		Q.extend(Users.prompt.options, Users.prompt.serverOptions);

	}, 'Users');

	Q.Socket.connect.validateAuth = function (ns, url, options) {
		if (!options.auth || !options.auth.capability) {
			return false;
		}
		var c = JSON.parse(options.auth.capability);
		if (Q.isEmpty(c.permissions)) {
			return false;
		}
		return true;
	};

	Q.onInit.add(function () {
		if (Users.capability) {
			Q.setObject('Q.Socket.connect.options.auth.capability', JSON.stringify(Users.capability));
		}
		priv._register_localStorageKey = "Q.Users.register.success " + Q.info.baseUrl;
		Q.Text.get('Users/content', function (err, text) {
			if (!text) {
				return;
			}
			Q.extend(Q.text.Users, 10, text);
		});
		if (Users.loggedInUser
		&& Q.typeOf(Users.loggedInUser) !== 'Q.Users.User') {
			Users.loggedInUser = new Users.User(Users.loggedInUser);
			Q.nonce = Q.cookie('Q_nonce') || Q.nonce;
		}

		var appId = Q.info.app;
		for (var platform in Users.apps) {
			var platformAppId = Users.getPlatformAppId(platform, appId);
			if (platformAppId) {
				Q.handle(Users.init[platform]);
			}
		}
		OAuth.redirectUri = Q.action('Users/oauthed');

		var sessionId = Q.cookie(Q.info.sessionName);
		var prefix = Q.getObject('Q.info.sessionIdPrefixes.authenticated');
		if (prefix && sessionId && sessionId.startsWith(prefix)
		&& !Q.Users.loggedInUser) {
			// happens for instance when webserver loads a pre-rendered
			// static file instead of the latest result of a PHP script
			_fetchUserData();
		}
		Q.request.options.onProcessed.set(_fetchUserData, 'Users');
	}, 'Users');
	
	function _setSessionFromQueryString(querystring)
	{
		if (!querystring) {
			return;
		}
		if (querystring.queryField('Q.Users.newSessionId')) {
			var fieldNames = [
				'Q.Users.appId', 'Q.Users.newSessionId', 'Q.Users.platform',
				'Q.Users.deviceId', 'Q.timestamp', 'Q.Users.signature'
			];
			var fields = querystring.queryField(fieldNames);
			var storedDeviceId = localStorage.getItem("Q.Users.Device.deviceId");
			fields['Q.Users.deviceId'] = fields['Q.Users.deviceId'] || storedDeviceId;
			if (fields['Q.Users.newSessionId']) {
				Q.req('Users/session', function (err, response) {
					Q.Response.processScriptDataAndLines(response);
					// Q.request.options.onProcessed would have changed loggedInUser already
					// but maybe we want to redirect anyway, after a handoff
					var href = Q.getObject("Q.Cordova.handoff.url");
					if (href) {
						location.href = href;
					}
				}, {
					method: 'put',
					loadExtras: 'session',
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

	$('body').on('click', '[data-users-login]', function () {
		Q.Users.login({
			successUrl: location.href
		});
		return false;
	});

	Q.Page.onActivate('').add(function _Users_Q_Page_onActivate_handler() {
		if (Users.loggedInUser) {
			Users.loggedInUser = new Users.User(Users.loggedInUser);
		}
		$.fn.plugin.load('Q/placeholders');
		$('#notices_set_email, #notices_set_mobile')
			.on(Q.Pointer.fastclick, function () {
				Q.plugins.Users.setIdentifier();
				return false;
			});

		// 
		_setSessionFromQueryString(location.search);

		document.documentElement.removeClass(Users.loggedInUser ? 'Users_loggedOut' : 'Users_loggedIn');
		document.documentElement.addClass(Users.loggedInUser ? 'Users_loggedIn' : 'Users_loggedOut');
	}, 'Users');

	// handoff action
	Q.onHandleOpenUrl.set(function (url) {
		window.cordova.plugins.browsertabs.close();
		_setSessionFromQueryString(url.split('?')[1]);
	}, 'Users.handoff');

	Q.beforeActivate.add(function (elem) {
		// Every time before anything is activated,
		// process any preloaded users data we find
		Q.each(Users.User.preloaded, function (i, fields) {
			_constructUser(fields);
		});
		Users.preloaded = null;
	}, 'Users');

	function _fetchUserData(err, response) {
		Q.nonce = Q.cookie('Q_nonce') || Q.nonce;
		if (Users.lastSeenNonce 
		&& Users.lastSeenNonce !== Q.nonce
		&& !Users.login.occurring
		&& !Users.authenticate.occurring
		&& !Users.logout.occurring) {
			Q.nonce = Q.cookie('Q_nonce') || Q.nonce;
			Q.req("Users/login", 'data', function (err, res) {
				Q.Response.processScriptDataAndLines(res);
				Users.lastSeenNonce = Q.nonce = Q.cookie('Q_nonce') || Q.nonce;
				var msg = Q.firstErrorMessage(err, res && res.errors);
				if (msg) {
					return Users.onError.handle(msg, err);
				}
				Q.setObject('Q.Socket.connect.options.auth.capability', JSON.stringify(Users.capability));
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
			}, {
				loadExtras: "session"
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
			Users.onLoginLost.handle();
			Users.loggedInUser = null;
			Users.Session.key.loaded = null;
			Users.roles = {};
			Q.Session.clear();
			Users.hinted = [];
		}
	}

	Users.init.facebook.onInit = new Q.Event();
	var ddc = document.documentElement;
	Users.onLogin = new Q.Event(function () {
		for (var role in Users.roles) {
			ddc.addClass('Users_role-' + Q.normalize(role).toCapitalized());
		}
		ddc.className = ddc.className.replace(' Users_loggedOut', '') + ' Users_loggedIn';

		// set language
		var preferredLanguage = Q.getObject("loggedInUser.preferredLanguage", Users);
		var info = preferredLanguage ? [preferredLanguage] : Q.first(Q.info.languages);
		if (info) {
			Q.Text.setLanguage.apply(Q.Text, info);
		}

		// generate a new session key, and tell the server
		if (Users.Session.key.generateOnLogin) {
			Users.Session.generateKey();
		}
		Q.Socket.disconnectAll();
		Q.Socket.reconnectAll(); // to trigger new onConnect
	}, 'Users');
	Users.onLogout = new Q.Event(function () {
		Users.Session.key.loaded = null;
		Users.Session.key.publicKey = null;
		Users.loggedInUser = null;
		Users.roles = {};
		Users.hinted = [];
		Q.Session.clear();
		Web3.authResponse = null;
		Web3.getContract.cache.clear();
		ddc.className = ddc.className.replace(' Users_loggedIn', '') + ' Users_loggedOut';
		ddc.className = ddc.className.replace(/(Users_role-\w+s)+/g, '');
		var language = location.search.queryField('Q.language') || navigator.language;
		Q.Text.setLanguage.apply(Q.Text, language.split('-'));
		Q.Socket.disconnectAll();
		Q.Socket.reconnectAll(); // to trigger new onConnect
	}, 'Users');
	Users.onLoginLost = new Q.Event(function () {
		Q.Socket.disconnectAll();
		Q.Socket.reconnectAll(); // to trigger new onConnect
		console.warn("Call to server was made which normally requires user login.");
	});
	Users.onConnected = new Q.Event();
	Users.onDisconnected = new Q.Event();

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
	Users.Dialogs = Q.Method.define({
		contacts: new Q.Method({
			options: {
				templateName: "Users/templates/contacts/dialog",
				filter: "Users/"
			}
		}),
		select: new Q.Method({
			options: {
				templateName: "Users/templates/contacts/select"
			}
		}),
		activate: new Q.Method()
	}, "{{Users}}/js/methods/Users/Dialogs", function() {
		return [Users, priv];
	});

	Users.Facebook = {

		usingPlatforms: null,
		me: {},
		type: 'web',
		accessToken: null,
		appId: null,
		scheme: null,
		scope: 'email',

		disconnect: function (appId, callback) {
			var platformAppId = Users.getPlatformAppId('facebook', appId);
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
					return window.FB && FB.logout(function () {
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

						Q.Response.processScriptDataAndLines(response);

						// auto-login by authenticating with facebook
						Users.authenticate('facebook', function (user) {
							priv.login_connected = true;
							priv.login_onConnect && priv.login_onConnect(user);
						}, function () {
							priv.login_onCancel && priv.login_onCancel();
						}, {"prompt": false});

					}, {xhr: Q.info.useTouchEvents ? 'sync' : {}});
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
					if (!window.FB) {
						cb({});
					} if (timeout) {
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
	
	var Web3 = Users.Web3 = {
		zeroAddress: '0x0000000000000000000000000000000000000000',
		chains: {},
		provider: null,
		web3Modal: null,
		onAccountsChanged: new Q.Event(),
		onChainChanged: new Q.Event(),
		onConnect: new Q.Event(),
		onDisconnect: new Q.Event(),
        
        getExplorerLink: function(address, chainId, partPrepend = 'token/') {
			if (!Q.Users.Web3.chains[chainId]) {
				return null;
			}
            if (Q.isEmpty(Q.Users.Web3.chains[chainId].blockExplorerUrls)) {
                return address;
            }
            let t = Q.Users.Web3.chains[chainId].blockExplorerUrls;
            t = Q.isArrayLike(t) ? t[0] : t;
            return t + partPrepend + address;
        },
		/**
		 * Abbreviates a Web3 address
		 * @param {String} address A string of the form "0x..."
		 * @param {Number} len The number of digits on either side of the ...""
		 * @return {String|null} Returns null if address is not valid
		 */
		abbreviateAddress: function (address, len) {
			len = len || 5;
			return Users.Web3.validate.address(address)
				? address.substr(0, 2+len) + '...' + address.substr(-len)
				: null;
		},

		disconnect: function (callback) {
			if (Users.disconnect.web3.occurring) {
				return false;
			}
			localStorage.removeItem('walletconnect');
			localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
			Users.disconnect.web3.occurring = true;
			if (Web3.web3Modal) {
				Web3.web3Modal.closeModal();
			}
			if (!Web3.provider) {
				Q.handle(callback);
				Users.disconnect.web3.occurring = false;
				return false;
			}
			if (Web3.provider.close) {
				Web3.provider.close().then(function (result) {
					delete Users.connected.web3;
					Web3.provider = null;
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
				if (Web3.provider._handleDisconnect) {
					Web3.provider._handleDisconnect();
				}
				delete Users.connected.web3;
				Web3.provider = null;
				Q.handle(callback);
				Users.disconnect.web3.occurring = false;
			}
			return true;
		},

		/**
		 * Connect web3 wallet session
		 * @method connect
		 * @param {Function} [callback]
		 * @return {Promise} to be used instead of callback
		 */
		connect: Q.promisify(function (callback) {
			if (Web3.provider) {
				return Q.handle(callback, null, [null, Web3.provider]);
			}

			var _getProvider = function (provider) {
				provider.request({ method: 'eth_requestAccounts' }).then(function () {
					Web3.provider = provider;
					return Q.handle(callback, null, [null, Web3.provider]);
				}).catch(function (ex) {
					Q.handle(callback, null, [ex]);
					throw new Error(ex);
				});
			};
			var _w3m = function () {
				$("w3m-modal").addClass("Q_floatAboveDocument").css({
					position: "fixed",
					"z-index": Q.zIndexTopmost() + 1
				});
				Web3.ethereumProvider.on("connect", function _w3mConnect (info) {
					_getProvider(Web3.ethereumProvider);
					_subscribeToEvents(Web3.ethereumProvider);
					Q.handle(Web3.onConnect, Web3.ethereumProvider, [info]);
				});
				Web3.ethereumProvider.connect();
				return false;
			};
			Users.init.web3(function () {
				var wallets = Q.getObject("web3.wallets", Users);
				// Try with MetaMask-type connection first
				if (window.ethereum && ethereum.request) {
					_subscribeToEvents(ethereum);
					_getProvider(ethereum);
				} else if (wallets) {
					delete wallets.walletconnect; // for now
					Q.Template.set("Users/web3/connect/wallet", `<ul>
						{{#each wallets}}
							<li><a style="background-image: url({{img}})" {{#if url}}href="{{url}}"{{/if}} {{#if data-url}}data-url="{{data-url}}"{{/if}}>{{name}}</a></li>
						{{/each}}
					</ul>`);
					var handOffTimeout;
					Q.Dialogs.push({
						title: Q.text.Users.login.web3.ConnectWallet,
						className: "Users_connect_wallets",
						content: "",
						stylesheet: '{{Users}}/css/Users/wallets.css',
						onActivate: function (dialog) {
							Q.req("Users/session", ["payload"], function (err, response) {
								if (err) {
									return;
								}

								var payload = response.slots.payload.payload;
								var querystring = new URLSearchParams(Q.extend({}, payload, {
									'Q.Users.environment': 'web3'
								})).toString();
								var u = new URL(location);
								var url = u.protocol + "//" + u.host + u.pathname + '?' + querystring;
								var urlParams = {
									url: url,
									urlEncoded: encodeURIComponent(url),
									urlWithoutScheme: url.replace(/.+:\/\//, '')
								};
								var cWallets = Q.extend({}, wallets);

								Q.each(cWallets, function (i, val) {
									cWallets[i]["img"] = Q.url("{{Users}}/img/web3/wallet/"+i+".png");
									if (val.url) {
										cWallets[i]["url"] = val.url.interpolate(urlParams);
									} else {
										cWallets[i]["data-url"] = i;
									}
								});
								Q.Template.render("Users/web3/connect/wallet", {wallets: cWallets}, function (err, html) {
									Q.replace($(".Q_dialog_content", dialog)[0], html);

									$("a[href]", dialog).on(Q.Pointer.start, function (e) {
										Q.req("Users/session", ["result"], function (err, response) {}, {
											method: "post",
											fields: payload
										});
									});
									$("a[data-url]", dialog).on(Q.Pointer.fastclick, function (e) {
										e.preventDefault();
										var url = this.getAttribute("data-url");
										if (url === "walletconnect") {
											_w3m();
										}
									});
								});

								// close dialog on provider connected
								Web3.onConnect.set(function () {
									setTimeout(function () {
										Q.Dialogs.close(dialog);
									}, 1000);
								}, 'Users_connect_wallets');

								// close dialog on timeout
								handOffTimeout = setTimeout(function () {
									Q.Dialogs.close(dialog);
								}, payload['Q.timestamp']*1000 - Date.now());
							}, {
								fields: {
									platform: "web3",
									redirect: Q.info.baseUrl
								}
							});
						},
						onClose: function () {
							Q.handle(callback, null, [true]);
							handOffTimeout && clearTimeout(handOffTimeout);
						}
					});
				} else if (Web3.ethereumProvider) {
					_subscribeToEvents(Web3.ethereumProvider);
					if (Web3.ethereumProvider.session) {
						_getProvider(Web3.ethereumProvider);
					} else {
						_w3m();
					}
				}
			});
		}),

		login: function (signedCallback, authenticatedCallback, cancelCallback, options) {
			var _prevDocumentTitle = document.title;
			document.title = Users.communityName;
			var _prevMetaTitle = $('meta[name="title"]').attr('content');
			$('meta[name="title"]').attr('content', Users.communityName);
			var _prevOGTitle = $('meta[property="og:title"]').attr('content');
			$('meta[property="og:title"]').attr('content', Users.communityName);
			Web3.connect(function (err, provider) {
				if (err) {
					return _cancel();
				}
				_restoreTitle();
				Web3.provider = provider;

				// Subscribe to accounts change
				provider.on("accountsChanged", function (accounts) {
					console.log('provider.accountsChanged', accounts);
					Web3.getContract.cache.clear();
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

					if (Users.logout.occurring || Web3.switchChainOccuring) {
						if (Web3.switchChainOccuring === true) {
							Web3.switchChainOccuring = false;
						}

						return;
					}

					Users.logout({using: 'web3', url: ''});
				});
				var payload = Q.text.Users.login.web3.payload.interpolate({
					host: location.host,
					timestamp: Math.floor(Date.now() / 1000)
				});
				(new ethers.providers.Web3Provider(provider))
				.listAccounts().then(function (accounts) {
					var web3Address = Q.cookie('Q_Users_web3_address') || '';
					if (web3Address && accounts.includes(web3Address)) {
						var loginExpires = Q.cookie('Q_Users_web3_login_expires');
						if (loginExpires > Date.now() / 1000) {
							_proceed();
						}
					}
					if (provider.wc || provider.modal) {
						Q.alert(Q.text.Users.login.web3.alert.content, {
							title: Q.text.Users.login.web3.alert.title,
							onClose: function () {
								var address = accounts[0];
								provider.request({
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
						Web3.authResponse = {
							xid: accounts[0],
							payload: payload,
							signature: signature,
							platform: 'web3',
							chainId: provider.chainId
						}
						if (Q.handle(signedCallback, null, [Web3.authResponse]) === false) {
							return;
						}
						Users.authenticate('web3', function (user) {
							Q.handle(authenticatedCallback, null, [user])
							priv.login_connected = true;
							priv.login_onConnect && priv.login_onConnect(user);
						}, function () {
							priv.login_onCancel && priv.login_onCancel();
						}, Q.extend({"prompt": false}, options));
					}
				}).catch(_cancel);
			});
			function _cancel() {
				_restoreTitle();
				Q.handle(cancelCallback, Users, [null]);
			}
			function _restoreTitle() {
				if (_prevDocumentTitle) {
					document.title = _prevDocumentTitle;
				}
				if (_prevMetaTitle) {
					$('meta[name="title"]').attr('content', _prevMetaTitle)
				}
				if (_prevOGTitle) {
					$('meta[property="og:title"]').attr('content', _prevOGTitle)
				}
			}
		},

		/**
		 * Check if user logged in to MetaMask
		 * @method loggedIn
		 * @param {Function} [callback]
		 * @return {Boolean}
		 */
		loggedIn: function (callback) {
			if (typeof ethereum === 'undefined') {
				return console.log("MetaMask browser plugin not found");
			}
			(new ethers.providers.Web3Provider(ethereum))
			.listAccounts().then(function(accounts){
				return Q.handle(callback, null, [accounts.length]);
			}).catch(function (err) {
				Q.alert(err.message);
			});
		},
		/**
		 * Execute method on contract
		 * @method execute
		 * @param {string} contractABIName Name of the view template that contains the ABI JSON
		 * @param {string|Object} contractAddress Can be a string starts with "0x", or an object with the properties below.
		 * @param {string} [contractAddress.contractAddress] If an object is passed then the contractAddress must go here.
		 * @param {string} [contractAddress.readOnly] This would use a provider, without having to
		 *    connect with a signer or to switch networks. Use if you're only going to use it for reading data.
		 * @param {string} [contractAddress.chainId] This would be the chainId to use for method calls
		 *    on this contract. If readOnly isn't true, then switchChain is called if necessary, to switch
		 *    the wallet to the new chainId for posting transactions. In this case, the user canceiling this switch
		 *    would result in an error in the callback/promise.
		 * @param {String} methodName
		 * @param {Array} params
		 * @param {function} callback receives (err, result) with result from the ethers.js contract method
		 * @return {Promise} to be used instead of callback
		 */
		execute: function (contractABIName, contractAddress, methodName, params, callback) {
			Web3.getContract(
				contractABIName, 
				contractAddress, 
				function (err, contract) {
					if (!contract[methodName]) {
						var possibilities = [];
						var m = methodName.match(/[A-Za-z1-9]+/);
						if (m) {
							for (var k in contract) {
								if (k.startsWith(m[0])) {
									possibilities.push(k);
								}
							}
						}
						var err = "Q.Users.Web3.execute: missing method " + methodName + "\n"
							+ "But perhaps you meant these method names: \n" + possibilities.join("\n");
						console.error(err);
						return Q.handle(callback, null, [err]);
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
		 * Get currently selected wallet address asynchronously
		 * @method getWalletAddress
		 * @param {function} callback receives (err, address)
	     * @return {Promise} to be used instead of callback
		 */
		getWalletAddress: Q.promisify(function (callback) {
			return Web3.connect(function (err, provider) {
				if (err) {
					return Q.handle(callback, null, [err]);
				}

				(new ethers.providers.Web3Provider(provider))
				.listAccounts().then(function (accounts) {
					return Q.handle(callback, null, [null, accounts[0]]);
				});
			});
		}),

		/**
		 * Get currently selected chain id asynchronously
		 * @method getChainId
		 * @param {Function} callback receives (err, chainId) where chainId is in hexadecimal
		 * @return {Promise} to be used instead of callback
		 */
		getChainId: Q.promisify(function (callback) {
			Web3.connect(function (err, provider) {
				if (err) {
					return Q.handle(callback, null, [err]);
				}
				(new ethers.providers.Web3Provider(provider))
				.getNetwork().then(function (network) {
					var chainId = network.chainId;
					return Q.handle(callback, null, [null, '0x' + Number(chainId).toString(16)]);
				});
			});
		}),

		/**
		 * Synchronously get the currently selected address on current provider
		 * @method getSelectedXid
		 * @static
		 * @return {string} the currently selected address of the user in web3
		 */
		 getSelectedXid: function (provider) {
			var result;
			provider = provider || Web3.provider || window.ethereum;
			result = provider.selectedAddress || (provider.accounts && provider.accounts[0]);
			return result || null;
		},

		/**
		 * Synchronously get the logged-in user's ID on any chain
		 * @method getLoggedInUserXid
		 * @static
		 * @return {string} the currently selected address of the user in web3
		 */
		getLoggedInUserXid: function () {
			var xids = Q.getObject('Q.Users.loggedInUser.xids');
			var key = 'web3_all';
			return (xids && xids[key]) || false;
		},

		/**
		 * Get ethers.providers.JsonRpcBatchProvider(rpcUrl of chain)
		 * @param {string} chainId
		 * @return {ethers.providers.JsonRpcBatchProvider}
		 */
		getBatchProvider(chainId) {
			var url = Q.getObject([chainId, 'rpcUrls', 0], Web3.chains);
			if (!url) {
				throw new Q.Exception('Users.Web3.getContract: Web3.chains['+chainId+'].rpcUrls is empty');
			}
			return new ethers.providers.JsonRpcBatchProvider(url);
		},

		/**
		 * Switch provider to a different Web3 chain
		 * @method switchChain
		 * @static
		 * @param {String|Object} info Can be the chainId (e.g. "0x1")
		 *   or an object with chain info to pass to the wwallet
		 * @param {String} info.chainId
		 * @param {String} info.name
		 * @param {String} info.currency
		 * @param {String} info.currency.name
		 * @param {String} info.currency.symbol
		 * @param {Number} info.currency.decimals
		 * @param {String} [info.rpcUrl] or rpcUrls
		 * @param {Array} [info.rpcUrls] or rpcUrl
		 * @param {String} [info.blockExplorerUrl] or blockExplorerUrls
		 * @param {Array} [info.blockExplorerUrls] or blockExplorerUrl
		 * @param {Function} callback receives (error, chainId)
		 * @return {Promise} to be used instead of callback
		 */
		switchChain: Q.promisify(function (info, callback) {
			if (typeof info === 'string') {
				info = Web3.chains[info];
			}
			if (!info || !info.chainId) {
				return Q.handle(callback, null, ["Q.Users.Web3.switchChain: chainId missing"]);
			}
			Web3.connect(function (err, provider) {
				if (err) {
					return Q.handle(callback, null, [err]);
				}

				Web3.switchChainOccuring = true;
				
				provider.request({
					method: 'wallet_switchEthereumChain',
					params: [{ chainId: info.chainId }],
				}).then(_continue)
				.catch(function (switchError) {
					// check if error message is json
					if (JSON.isValid(switchError.message)) {
						switchError = JSON.parse(switchError.message);
					}

					// This error code indicates that the chain has not been added to MetaMask.
					if (switchError.code !== 4902
					&& switchError.code !== -32603) {
						return Q.handle(callback, null, [switchError]);
					}
					var rpcUrls = info.rpcUrls || [info.rpcUrl];
					var blockExplorerUrls = info.blockExplorerUrls || [info.blockExplorerUrl];
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
							rpcUrls: rpcUrls,
							blockExplorerUrls: blockExplorerUrls
						}]
					}).then(_continue)
					.catch(function (error) {
						Q.handle(callback, null, [error]);
					});
				});

				function _continue() {
					Q.handle(callback, null, [null, provider.chainId]);
				}
			});
		}),

		/**
		 * withChain May switch to the chain if it's not selected yet
		 * @static
		 * @param {String} chainId You can pass null here to just use the current chain
		 * @param {Function} callback Takes provider, needSigner
		 */
		withChain: function _withChain(chainId, callback) {
			Web3.connect(function (err, provider) {
				if (err) {
					return Q.handle(callback, null, [err]);
				}

				if (!chainId || parseInt(provider.chainId) === parseInt(chainId)) {
					callback(provider, true);
				} else {
					var chain = Web3.chains[chainId];
					Web3.switchChain(chain, function (err) {
						if (Q.firstErrorMessage(err)) {
							return Q.handle(callback, null, [err]);
						}
						callback(provider, true);
					});
				}
			});
		},

		/**
		 * Transfer some native coin to a recipient,
		 * or issue some other transaction by specifying options.
		 * See https://docs.ethers.org/v5/api/providers/types/#providers-TransactionRequest
		 * @param {String} recipient address of type "0x..."
		 * @param {String} chainId the ID of the chain (may need to switch to it)
		 * @param {Number} amount the amount of native coin to send, with decimal portion
		 * @param {Function} callback can receive (err, transaction)
		 * @param {Object} options see TransactionRequest of ethers.js
		 * @param {String} options.chainId Pass a chain ID here to switch to it, if necessary
		 * @param {String} options.gasPrice One of multiple options you can do
		 * @param {String} [options.wait=0] How many blocks to wait, if > 0 then promise might fail transaction failure
		 * @return {Promise} to be used instead of callback
		 */
		transaction: Q.promisify(function _transaction(recipient, amount, callback, options) {
			options = options || {};
			var wait = Q.getObject("wait", options);
			if (!isNaN(wait)) {
				delete options.wait;
			}
			Web3.withChain(options.chainId, function (provider) {
				try {
					var signer = new ethers.providers.Web3Provider(provider).getSigner();
					Web3.getWalletAddress(function (err, address) {
						signer.sendTransaction(Q.extend({}, options, {
							from: address,
							to: recipient,
							value: ethers.utils.parseEther(String(amount))
						})).then(function (transactionRequest) {
							if (!Q.getObject("wait", transactionRequest)) {
								return Q.handle(callback, null, ["Transaction request invalid", transactionRequest]);
							}
	
							if (!wait) {
								return Q.handle(callback, null, [null, transactionRequest]);
							}
	
							transactionRequest.wait(wait).then(function (transactionReceipt) {
								if (parseInt(Q.getObject("status", transactionReceipt)) === 1) {
									return Q.handle(callback, null, [null, transactionRequest, transactionReceipt]);
								}
	
								Q.handle(callback, null, ["Transaction failed", transactionRequest, transactionReceipt]);
							}, function (err) {
								Q.handle(callback, null, [err, transactionRequest]);
							});
						}).catch(function (err) {
							Q.handle(callback, null, [err]);
						});
					});
				} catch (err) {
					Q.handle(callback, null, [err]);
				}
			});
		}),

		/**
		 * Used to fetch the ethers.Contract object to use with a smart contract.
		 * @method getContract
		 * @static
		 * @param {string} contractABIName Name of the view template that contains the ABI JSON
		 * @param {string|Object} contractAddress Can be a string starts with "0x", or an object with the properties below.
		 * @param {string} [contractAddress.contractAddress] If an object is passed then the contractAddress must go here.
		 * @param {string} [contractAddress.readOnly] This would use a provider, without having to
		 *    connect with a signer or to switch networks. Use if you're only going to use it for reading data.
		 * @param {string} [contractAddress.chainId] This would be the chainId to use for method calls
		 *    on this contract. If readOnly isn't true, then switchChain is called if necessary, to switch
		 *    the wallet to the new chainId for posting transactions. In this case, the user canceiling this switch
		 *    would result in an error in the callback/promise.
		 * @param {Function} [callback] receives (err, contract)
		 * @return {Promise} to be used instead of callback
		 */
		getContract: Q.promisify(Q.getter(
		function(contractABIName, contractAddress, callback) {
			Web3.connect(function () {
				var chainId, address, readOnly;
				if (Q.isPlainObject(contractAddress)) {
					chainId = contractAddress.chainId;
					address = contractAddress.contractAddress;
					readOnly = contractAddress.readOnly;
				} else {
					address = contractAddress;
				}
				Q.Template.set(contractABIName, undefined, "abi.json");
				Q.Template.render(contractABIName, function (err, json) {
					try {
						var ABI = JSON.parse(json);
					} catch (e) {
						return Q.handle(callback, null, [e]);
					}
					if (readOnly) {
						if (chainId) {
							_proceed(chainId);
						} else {
							Web3.getChainId().then(_proceed)
							.catch(console.warn);
						}
						return;
						function _proceed(chainId) {
							return _continue(Web3.getBatchProvider(chainId), false);
						}
					}
					Web3.withChain(chainId, _continue);
					function _continue(provider, needSigner) {
						try {
							var signer, contract;
							if (needSigner) {
								signer = new ethers.providers.Web3Provider(provider).getSigner();
								contract = new ethers.Contract(address, ABI, signer);
							} else {
								contract = new ethers.Contract(address, ABI, provider);
							}
							contract.ABI = ABI;
							Q.handle(callback, contract, [null, contract]);
						} catch (err) {
							Q.handle(callback, null, [err]);
						}
					}
				});
			});
		}, {
			cache: Q.Cache.document("Users.Web3.getContract")
		})),

		/**
		 * Used to fetch the ethers.Contract object to use with a smart contract.
		 * Looks up the factory address using the chainId that is currently selected in the wallet.
		 * @method getFactory
		 * @static
		 * @param {string} contractABIName Name of the view template that contains the ABI JSON
		 * @param {string|Object} [chainId] optional, pass a string here to switch to the indicated chain first,
		 *   or an object with the following properties:
		 * @param {string} [chainId.readOnly] This would use a provider, without having to
		 *    connect with a signer or to switch networks. Use if you're only going to use it for reading data.
		 * @param {string} [chainId.chainId] This would be the chainId to use for method calls
		 *    on this factory contract. If readOnly isn't true, then switchChain is called if necessary, to switch
		 *    the wallet to the new chainId for posting transactions. In this case, the user canceiling this switch
		 *    would result in an error in the callback/promise.
		 * @param {Function} [callback] receives (err, contract)
		 * @return {Promise} to be used instead of callback
		 */
		getFactory: Q.promisify(function(contractABIName, chainId, callback) {
			var readOnly = false;
			if (Q.isPlainObject(chainId)) {
				readOnly = chainId.readOnly;
				chainId = chainId.chainId;
			}
			if (typeof chainId !== 'string'
			|| chainId.substr(0, 2) !== '0x') {
				if (!callback) {
					callback = chainId;
				}
				chainId = null;
			}
			return chainId
				? _continue(chainId)
				: Web3.getChainId().then(_continue);
			function _continue(chainId) {
				var contracts = Web3.contracts[contractABIName];
				if (Q.isEmpty(contracts)) {
					throw new Q.Exception("Users.Web3.getFactory: missing contract address for " + contractABIName);
				}
				var contractAddress = contracts[chainId] || contracts['all'];
				return Web3.getContract(contractABIName, {
					chainId: chainId,
					contractAddress: contractAddress,
					readOnly: readOnly
				}, callback);
			}
		}),
		parseMetamaskError: function (err, contracts=[]) {
            if (err.code != '-32603' || Q.isEmpty(err.data)) {
				return err.message;
			}
			if (err.data.code != 3) {
				// handle "Internal JSON-RPC error."
				return (err.data.message);
			}
			//'execution reverted'
			var str = '';
			Q.each(contracts, function (i, contract) {
				try {
					var customErrorDescription = contract.interface.getError(
						ethers.utils.hexDataSlice(err.data.data, 0, 4)
					); // parsed
					if (customErrorDescription) {
						var decodedStr = ethers.utils.defaultAbiCoder.decode(
							customErrorDescription.inputs.map(function (obj) { return obj.type }),
							ethers.utils.hexDataSlice(err.data.data, 4)
						);
						str = customErrorDescription.name +'('
							+(decodedStr.length > 0 ? '"' + decodedStr.join('","') + '"' : '')
							+')';
						return false;
					}
				} catch (e) {}
			});
			if (Q.isEmpty(str)) {
				// handle: revert("here string message")
				return (err.data.message)
			}
			return (str);
        },
		validate: {
			notEmpty: function _validate_notEmpty(input) {
				return !Q.isEmpty(input);
			},
			integer: function _validate_integer(input) {
				return Q.isInteger(input)
			},
			numeric: function _validate_numeric(input) {
				return !isNaN(parseFloat(input)) && isFinite(input);
			},
			address: function _validate_address(address) {
				// here two ways: simple and custom;
				// since we have a ethers lib we will use it
				if (window.ethers) {
					return ethers.utils.isAddress(address);
				}
				
				//overwise
				// https://github.com/ethereum/go-ethereum/blob/aa9fff3e68b1def0a9a22009c233150bf9ba481f/jsre/ethereum_js.go#L2295-L2329
				if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
					// check if it has the basic requirements of an address
					return false;
				} else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
					// If it's all small caps or all all caps, return true
					return true;
				} else {
					// Otherwise check each case
		            // var address = address.replace('0x','');
		            // var addressHash = Web3.utils.sha3(address.toLowerCase());
		            // for (var i = 0; i < 40; i++ ) {
		            //     // the nth letter should be uppercase if the nth digit of casemap is 1
		            //     if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) || (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
		            //         return false;
		            //     }
		            // }
					return true;
				}
			}
		}
	};

	Users.Communities = {
		Web3: {
			Contract: {
				adjustAbi: new Q.Method(),
				get: new Q.Method()
			},
			Roles: {
				prefixPattern: '<<< web3',
				labelPattern: new Q.Method(),
				isPatternCorrect: new Q.Method(),
				parsePattern: new Q.Method(),
				getAll: new Q.Method(),
				byUser: new Q.Method(),
				add: new Q.Method(),
				setRoleURI: new Q.Method(),
				manage: new Q.Method(),
				grantRole: new Q.Method(),
				revokeRole: new Q.Method(),
				getIndex: new Q.Method()
			}
		}
	};

	/**
	 * Disconnect external platforms
	 */
	Users.disconnect = {};
	Users.disconnect.facebook = Users.Facebook.disconnect;
	Users.disconnect.web3 = Web3.disconnect;

	Q.onReady.add(function () {
		Users.urls.onComplete = Q.urls['Communities/home'];
		Users.Facebook.construct();
		_subscribeToEvents(window.ethereum || Web3.ethereumProvider);
	}, 'Users');

	function _subscribeToEvents(provider) {
		if (!provider || !provider.on
		|| provider.subscribedToEvents) {
			return;
		}
		provider.on("accountsChanged", function (accounts) {
			Q.handle(Web3.onAccountsChanged, this, [accounts]);
		});
		provider.on("chainChanged", function (chainId) {
			Q.handle(Web3.onChainChanged, this, [chainId]);
		});
		provider.on("connect", function (info) {
			Web3.provider = provider;
			Q.handle(Web3.onConnect, this, [info]);
		});
		provider.on("disconnect", function (info) {
			Web3.disconnect();
			Q.handle(Web3.onDisconnect, this, [info]);
		});
		provider.subscribedToEvents = true;
	}

	Q.Dialogs.push.options.onActivate.set(function (dialog, options) {
		if (!options || !options.apply) {
			return;
		}
		var $dialog = $(dialog);
		Users.hint("Users/dialogCloseHint", $dialog.find('.Q_close')[0], {
			show: {delay: 5000},
			dontStopBeforeShown: true
		});
	}, 'Users.dialogCloseHint');
	
	Users.cache = Users.cache || {};
	
	Q.ensure.loaders['Q.Users.Faces'] = '{{Users}}/js/Faces.js';
    
    // define methods for Users to replace method stubs
    Q.Method.define(
        Users, 
        '{{Users}}/js/methods/Users', 
        function() {
            return [Users, priv];
        }
    );
	

})(Q, Q.jQuery);

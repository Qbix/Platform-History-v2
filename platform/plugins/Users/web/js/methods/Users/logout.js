Q.exports(function (Users, priv) {

    /**
     * Users plugin's front end code
     *
     * @module Users
     * @class Users
     */
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
	return function Users_logout(options) {
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
				Users.disconnect.web3(p.fill('web3'));
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
				Q.nonce = Q.cookie('Q_nonce') || Q.nonce;
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

});
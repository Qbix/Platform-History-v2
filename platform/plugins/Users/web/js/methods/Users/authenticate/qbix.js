Q.exports(function (_doCancel, _handleXid, _doAuthenticate) {
    
    /**
	 * Authenticates this session with a given platform,
	 * if the user was already connected to it.
	 * It tries to do so by checking a cookie that would have been set by the server.
	 * @method authenticate
	 * @param {String} platform Currently it's `qbix`
     * @param {String} platformAppId platformAppId
	 * @param {Function} onSuccess Called if the user successfully authenticates with the platform, or was already authenticated.
	 *  It is passed the user information if the user changed.
	 * @param {Function} onCancel Called if the authentication was canceled. Receives err, options
	 * @param {Object} [options] object of parameters for authentication function
	 *   @param {Function|Boolean} [options.prompt=null] which shows the usual prompt unless it was already rejected once.
	 *     Can be false, in which case the user is never prompted and the authentication just happens.
	 *     Can be true, in which case the usual prompt is shown even if it was rejected before.
	 *     Can be a function with an onSuccess and onCancel callback, in which case it's used as a prompt.
	 *   @param {Boolean} [options.force] forces the getLoginStatus to refresh its status
	 *   @param {String} [options.appId=Q.info.app] Only needed if you have multiple apps on platform
	 */
    function qbix(platform, platformAppId, onSuccess, onCancel, options) {
		Q.onReady.add(function () {
			var browsertab = Q.getObject("cordova.plugins.browsertabs");
			if (!browsertab) {
				return console.warn('Users.authenticate: browsertab plugin not found!');
			}
			var appId = Q.cookie('Q_appId');
			var redirect = Q.info.scheme;
			var deviceId = Q.cookie('Q_udid');
			if (!appId) {
				return console.warn('Users.authenticate: appId undefined!');
			}
			var url = Q.action("Users/session", {
				appId: appId,
				redirect: redirect,
				deviceId: deviceId,
				handoff: 'yes'
			});
			browsertab.openUrl(url, {scheme: Q.info.scheme, authSession: true}, function(returnUrl) {
				location.href = returnUrl;
			}, function(err) {
				console.error(err);
			});
		}, 'Users');
	}
    return qbix;
});
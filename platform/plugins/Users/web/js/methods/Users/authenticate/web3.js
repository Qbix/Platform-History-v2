Q.exports(function (Users, priv) {
    /**
	 * Authenticates this session with a given platform,
	 * if the user was already connected to it.
	 * It tries to do so by checking a cookie that would have been set by the server.
	 * @method authenticate
	 * @param {String} platform Currently it's `web3`
     * @param {String} platformAppId Currently it's `web3`
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
    function web3(platform, platformAppId, onSuccess, onCancel, options) {

        options = Q.extend(Q.Users.authenticate.web3.options, options);
		Q.Users.Web3.connect(function () {
			try {
				var xid, w3sr_json = Q.cookie('Q_Users_w3sr_' + platformAppId);
				if (w3sr_json) {
					var w3sr = JSON.parse(w3sr_json);	
					var hash = ethers.utils.hashMessage(w3sr[0]);
					xid = ethers.utils.recoverAddress(hash, w3sr[1]);
					if (xid) {
						var matches = w3sr[0].match(/[\d]{8,12}/);
						if (!matches) {
							throw new Q.Exception("Users.authenticate: w3sr cookie missing timestamp");
						}
						if (Q.Users.authenticate.expires
						&& matches[0] < Date.now() / 1000 - Q.Users.authenticate.expires) {
							throw new Q.Exception("Users.authenticate: web3 token expired");
						}
					}
				}

				xid = xid || Q.getObject("Web3.authResponse.xid", Q.Users);
				if (xid) {
					return priv.handleXid(
						platform, platformAppId, xid,
						onSuccess, onCancel, options
					);
				}
			} catch (e) {
				console.warn(e);
				// wasn't able to get the current authenticated xid from cookie
				// so let's sign another authenticated message
				Q.cookie('Q_Users_w3sr_' + platformAppId, null, {path: '/'});
				priv._doCancel(platform, platformAppId, null, onSuccess, onCancel, options);
				Q.Web3.authResponse = null;
			}
		});
    };
    web3.options = {
        chain: 'ETH',
        network: 'mainnet'
    };
    return web3;
});
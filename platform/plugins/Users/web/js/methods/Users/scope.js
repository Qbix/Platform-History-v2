Q.exports(function (Users, priv) {

    /**
     * Users plugin's front end code
     *
     * @module Users
     * @class Users
     */

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
	return function Users_scope(platform, callback, options) {
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

});
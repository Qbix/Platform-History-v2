Q.exports(function (Users, priv) {

    /**
     * Methods for OAuth
     * @class Users.OAuth
     * @constructor
     * @param {Object} fields
     */
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
    return function Users_OAuth_start(platform, scope, callback, options) {
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
    };

});
Q.exports(function (Users, priv) {
    /**
	 * Operates with dialogs
     * @module Users
	 * @class Users.Dialogs
	 */
    /**
     * Show a dialog with contacts.
     * @static
     * @method activate
     * @param {String} activateLink
     * @param {Object} [options] options for the dialog
     * @param {Function} [options.onSuccess] receives (data)
     */
    return function Users_Dialogs_activate(activateLink, options) {
        if (!activateLink) {
            return false;
        }
        Q.Dialogs.push(Q.extend(options, {
            url: activateLink,
            className: 'Users_activate_dialog',
            onActivate: {"Users.Dialogs.activate": function () {
                var dialog = this;
                var form = Q.Tool.byId('Q_form-Users_activate');
                form.state.loader.options.onRedirect = null;
                form.state.onResponse.set(function (err, data) {
                    var fem = Q.firstErrorMessage(err, data);
                    if (fem) {
                        alert(fem);
                    } else {
                        priv.login_connected = true;
                        Q.Dialogs.close(dialog);
                        Q.handle(options && options.onSuccess, Users, [data]);
                    }
                    return false; // we handled it
                });
                $('#new-password').plugin('Q/clickfocus');
                document.documentElement.addClass('Users_activate_dialog_showing');
                // priv.login_connected = true;
                // priv.login_onConnect && priv.login_onConnect(user);
            }},
            onClose: {"Users.Dialogs.activate": function () {
                if (!priv.login_connected
                && !priv.login_resent
                && priv.login_onCancel) {
                    priv.login_onCancel && priv.login_onCancel();	
                }
                document.documentElement.removeClass('Users_activate_dialog_showing');
            }}
        }));
    };
});
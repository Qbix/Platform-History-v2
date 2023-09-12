Q.exports(function (Users, priv) {

    /**
     * Users plugin's front end code
     *
     * @module Users
     * @class Users
     */
	/**
	 * Used when platform user is logged in to platform but not to app.
	 * Shows prompt asking if user wants to log in to the app as platform user.
	 * @method prompt
     * @static
	 * @param {String} platform For now, only "facebook" is supported
	 * @param {String} xid The platform xid
	 * @param {Function} authCallback , this function will be called after user authentication
	 * @param {Function} cancelCallback , this function will be called if user closed social platform login window
	 * @param {object} options
	 *     @param {DOMElement} [options.dialogContainer=document.body] param with jQuery identifier of dialog container
	 * @param {Object} options
	 *   @param {String} [options.appId=Q.info.app] Only needed if you have multiple apps on platform
	 */
	return function Users_prompt(platform, xid, authCallback, cancelCallback, options) {
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

});
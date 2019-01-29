(function (Q, $) {

/**
 * Users Tools
 * @module Users-tools
 */

var Users = Q.Users;

/**
 * Renders a dynamic user status area which displays "log in" or the logged-in user's avatar
 * @class Users status
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *   @param {Q.Event} [options.onInvoke] When the tool is clicked
 *	 @param {String} [options.avatar] Options for the user avatar
 *	 @param {String} [options.avatar.icon=80] The default size of the avatar icon
 *	 @param {String} [options.avatar.contents=!Q.info.isMobile] Whether to show the name
 *	 @param {String} [options.avatar.short=true] Whether the name shown should be short
 */
Q.Tool.define("Users/status", function(options) {
	this.refresh(!!this.element.innerHTML);
	Q.Users.onLogin
	.and(Q.Users.onLogout)
	.set(this.refresh.bind(this), this);
},
{
	avatar: {
		icon: 80,
		contents: !Q.info.isMobile,
		short: true
	},
	onInvoke: new Q.Event()
},
{
	refresh: function (skipRefill) {
		var tool = this;
		var state = tool.state;
		if (Q.Users.loggedInUser) {
			if (skipRefill === false) {
				var avatar = $('<div />').tool('Users/avatar', state.avatar);
				$(tool.element).empty().append(
					$('<div class="Users_whenLoggedIn Users_status_avatar" />')
					.append(avatar)
				).activate();
			}
			tool.$('.Users_status_avatar')
			.plugin('Q/clickable')
			.on(Q.Pointer.click, tool, function () {
				Q.handle(state.onInvoke);
			});
			_wireup();
		} else {
			Q.Text.get('Users/content', function (err, text) {
				$(tool.element).empty().append(
					$('<div class="Users_status_login" />')
					.append(text.actions.LogIn)
				);
				_wireup();
			});
		}
		function _wireup() {
			tool.$('.Users_status_login')
			.plugin('Q/clickable')
			.on('click', tool, function () {
				Q.Users.login()
			})
		}
	}
}
);

})(Q, jQuery);
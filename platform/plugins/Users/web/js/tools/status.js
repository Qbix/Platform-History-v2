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
 *	 @param {String} [options.avatar.contents=true] Whether to show the name
 *	 @param {String} [options.avatar.short=true] Whether the name shown should be short
 *   @param {String} [options.clickable=falser] Whether to apply Q/clickable effect
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
		contents: true,
		short: true
	},
	clickable: false,
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
			var $avatar = tool.$('.Users_status_avatar')
			.on(Q.Pointer.click, tool, function () {
				Q.handle(state.onInvoke);
			});
			if (state.clickable) {
				$avatar.plugin('Q/clickable')
			}
			_wireup();
		} else {
			Q.Text.get('Users/content', function (err, text) {
				var $div = $('<div class="Users_status_login_title" />')
					.html(text.actions.LogIn);
				$(tool.element).empty().append(
					$('<div class="Users_status_login" />')
					.append($div)
				);
				_wireup();
			});
		}
		function _wireup() {
			var $status = tool.$('.Users_status_login');
			if (state.clickable) {
				$status.plugin('Q/clickable');
			}
			$status.on(Q.Pointer.fastclick, tool, function () {
				Q.Users.login();
				return false;
			})
		}
	}
}
);

})(Q, jQuery);
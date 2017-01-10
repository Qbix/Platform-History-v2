(function (Q, $, window, undefined) {

var Users = Q.Users;

/**
 * Users Tools
 * @module Users-tools
 */

/**
 * Renders a pile of user icons
 * @class Users pile
 * @constructor
 * @param {Object} options options for the tool
 * @param {Array} options.userIds the user ids of the avatars to render
 * @param {Object} [options.avatar] any options for the avatar tools
 * @param {Number} [options.limit=3] the actual number of avatars to render
 * @param {Number} [options.rotate=20] maximum +/- degrees of "whimsical" random rotation
 * @param {Number|String} [options.caption] you can use this to e.g. display some number of users, or set to null to hide it
 */
Q.Tool.define('Users/pile', function () {
	var tool = this;
	var state = tool.state;
	this.refresh();
	this.Q.onStateChanged('caption').set(function (name, value) {
		this.caption.innerHTML = value;
	});
	this.Q.onStateChanged('userIds').set(function () {
		this.refresh();
	});
}, {
	userIds: null,
	onRefresh: new Q.Event(),
	onLoaded: new Q.Event(),
	clickable: false,
	rotate: 10,
	avatar: {
		icon: 40
	}
}, {
	/**
	 * Refresh the contents
	 */
	refresh: function (callback) {
		var tool = this;
		var state = tool.state;
		var limit = state.limit;
		Q.removeElement(tool.element.children || tool.element.childNodes);
		Q.each(state.userIds, function (k, userId) {
			if (--limit < 0) {
				return false;
			}
			var element = Q.Tool.setUpElement('div', 'Users/avatar', Q.extend(
				{}, state.avatar, { userId: userId }
			), null, tool.prefix);
			if (state.rotate) {
				var r = Math.random() * state.rotate * 2 - state.rotate;
				element.style.transform = 'rotate(' + r + 'deg)';
			}
			tool.element.appendChild(element);
		});
		tool.caption = document.createElement('div');
		tool.caption.addClass('Users_pile_caption');
		tool.caption.innerHTML = state.caption || '';
		tool.element.appendChild(tool.caption);
		if (state.caption == null) {
			tool.caption.style.display = 'none';
		}
		Q.activate(tool.element);
	}
});

})(Q, jQuery, window);
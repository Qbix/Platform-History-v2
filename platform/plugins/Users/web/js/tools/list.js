(function (Q, $, window, undefined) {

var Users = Q.Users;

/**
 * Users Tools
 * @module Users-tools
 */

/**
 * Renders a list of user avatars
 * @class Users list
 * @constructor
 * @param {Object} options options for the tool
 * @param {Array} options.userIds the user ids to render
 * @param {Number} [options.limit=12] positive integer for how many avatars to show at a time
 * @param {Number} [options.preload=0] how many pages (multiples of limit) to preload
 */
Q.Tool.define('Users/list', function () {
	var state = this.state;
	if (!state.userIds) {
		throw new Q.Error("Users/list tool: userIds is required")
	}
	this.loaded = 0;
	this.refresh();
}, {
	userIds: null,
	limit: 3 * 4,
	preload: 1,
	onRefresh: new Q.Event()
}, {
	/**
	 * Refresh
	 */
	refresh: function () {
		var tool = this;
		var state = tool.state;
		var limit2 = state.limit * (state.preload + 1);
		var l = Math.min(this.loaded + limit2, state.userIds.length);
		for (var i=this.loaded; i<l; ++i) {
			tool.element.appendChild(
				Q.Tool.setUpElement('div', 'Users/avatar', {
					userId: state.userIds[i]
				})
			);
		}
		Q.activate(tool.element.children || tool.element.childNodes);
	},
	Q: {
		onInit: function () {
			debugger;
		}
	}
});

})(Q, jQuery, window);
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
 * @param {Object} [options.avatar={icon:80}] options for the child Users/avatar tools
 * @param {Object} [options.clickable=false] options for Q/clickable, if not false
 * @param {Number} [options.preload=0] how many pages (multiples of limit) to preload
 */
Q.Tool.define('Users/list', function () {
	var state = this.state;
	if (!state.userIds) {
		throw new Q.Error("Users/list tool: userIds is required")
	}
	this.refresh();
}, {
	userIds: null,
	limit: 3 * 4,
	preload: 1,
	avatar: {
		short: true,
		icon: 80
	},
	onRefresh: new Q.Event(),
	clickable: false
}, {
	/**
	 * Refresh the contents
	 */
	refresh: function () {
		Q.removeElement(this.element.children || this.element.childNodes);
		this.loaded = 0;
		this.loadMore();
	},
	/**
	 * Load more user avatars.
	 * @return {Number} the number new of avatars loaded
	 */
	loadMore: function () {
		var tool = this;
		var state = tool.state;
		var $te = $(tool.element);
		var l = Math.min(this.loaded + state.limit, state.userIds.length);
		for (var i=this.loaded; i<l; ++i) {
			tool.element.appendChild(
				Q.Tool.setUpElement('div', 'Users/avatar', Q.extend({}, state.avatar, {
					userId: state.userIds[i]
				}))
			);
		}
		this.loaded = l;
		Q.activate(tool.element.children || tool.element.childNodes, function () {
			if (state.clickable) {
				if (state.clickable === true) {
					state.clickable = {};
				}
				tool.forEachChild('Users/avatar', function () {
					var $te = $(this.element);
					this.state.onRefresh.add(function () {
						$te.find('img').on('load', function () {
							$te.plugin('Q/clickable', state.clickable);
						});
					}, tool);
				});
			}
		});
		$te.on('scroll', function () {
			if ($te.scrollTop() >= $te[0].scrollHeight - $te[0].clientHeight) {
				tool.loadMore();
			}
		});
		return 
	},
	Q: {
		onInit: function () {

		}
	}
});

})(Q, jQuery, window);
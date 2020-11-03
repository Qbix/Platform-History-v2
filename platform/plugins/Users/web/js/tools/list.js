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
 * @param {Number} [options.limit=100] positive integer for how many avatars to show at a time
 * @param {Number} [options.preload=0] how many pages (multiples of limit) to preload
 * @param {Object} [options.avatar={icon:80}] options for the child Users/avatar tools
 * @param {Object} [options.clickable=false] options for Q/clickable, if not false
 * @param {Number} [options.preload=0] how many pages (multiples of limit) to preload
 * @param {Q.Event} [options.onRefresh] happens after the refresh method is called
 * @param {Q.Event} [options.onLoadMore] happens when more users are loaded (including first time)
 */
Q.Tool.define('Users/list', function () {
	var tool = this;
	var state = tool.state;
	if (Q.isEmpty(state.userIds)) {
		return;
	}
	var lastScrollTop = 0;
	var $te = $(tool.element);
	$te.addClass('Q_overflow').on('scroll', function () {
		var scrollTop = $te.scrollTop();
		if (scrollTop === lastScrollTop) {
			return;
		}
		if (scrollTop >= $te[0].scrollHeight - $te[0].clientHeight) {
			tool.loadMore();
		}
		lastScrollTop = scrollTop;
	});
	this.refresh();
}, {
	userIds: null,
	limit: 100,
	preload: 1,
	avatar: {
		"short": true,
		icon: (window.devicePixelRatio > 1 ? '200' : '80'),
		reflectChanges: false
	},
	onRefresh: new Q.Event(),
	onLoadMore: new Q.Event(),
	clickable: false
}, {
	/**
	 * Refresh the contents
	 */
	refresh: function (callback) {
		Q.removeElement(this.element.children || this.element.childNodes, true);
		this.loaded = 0;
		this.loadMore(callback);
		Q.handle(this.state.onRefresh, this);
	},
	/**
	 * Load more user avatars.
	 * @return {Number} the number new of avatars loaded
	 */
	loadMore: function (callback) {
		var tool = this;
		var state = tool.state;
		tool.loading = true;
		var length = Q.typeOf(state.userIds) === "object" ? Object.keys(state.userIds).length : state.userIds.length;
		length = Math.min(tool.loaded + state.limit, length);
		var avatars = [], elements = [];
		Q.each(state.userIds, function (i, userId) {
			if (i < tool.loaded || i >= length) {
				return;
			}
			
			var element = Q.Tool.setUpElement('div', 'Users/avatar',
				Q.extend({}, state.avatar, {
					userId: userId
				}), null, tool.prefix);
			tool.element.appendChild(element);
			elements.push(element);
		}, {
			numeric: true
		});
		var count = length - tool.loaded;
		tool.loaded = length;
		Q.activate(tool.element.children || tool.element.childNodes, function () {
			tool.loading = false;
			if (state.clickable) {
				if (state.clickable === true) {
					state.clickable = {};
				}
				Q.each(elements, function () {
					var $te = $(this);
					var avatar = this.Q.tool;
					avatars.push(avatar)
					avatar.state.onRefresh.add(function () {
						if ($te.closest('html').length) {
							return;
						}
						$te.find('img').on('load', function () {
							$te.plugin('Q/clickable', state.clickable);
						});
					}, tool);
				});
				Q.handle(callback, tool);
				Q.handle(state.onLoadMore, tool, [avatars, elements]);
			}
		});
		return count;
	}
});

})(Q, Q.$, window);
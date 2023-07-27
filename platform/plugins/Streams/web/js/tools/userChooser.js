(function (Q, $) {

/**
 * Streams Tools
 * @module Streams-tools
 * @main
 */

/**
 * Interface for selecting an app user
 * @class Streams userChooser
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *   @param {Q.Event} [options.onChoose] is triggered with (userId, avatar)
 *       parameters when a user is chosen
 *   @param {Object} [options.initialList] information for showing a list when focus is placed in textbox
 *   @param {Boolean} [options.initialList.hide] set to true to not use the initialList
 *   @param {String} [options.initialList.key=""] the key under which to store this list, by default it's ""
 *   @param {Number} [options.initialList.limit=10] how many recent users show when the focus is placed in the textbox
 *   @param {String} [options.placeholder] Any placeholder text
 *   @param {Number} [options.delay=500] how long to delay before sending a request
 *    to allow more characters to be entered
 *   @param {bool} [options.communitiesOnly=false] If true, search communities instead regular users
 *   @param {Object} [options.exclude] hash of {userId: true},
 *    where userId are the ids of the users to exclude from the results.
 *    Defaults to id of logged-in user, if logged in.
 *   @param {Object} [options.resultsHeight="auto"] Height of results layer. Sometimes need to set height to make this
 *   layer scrollable, because results go beyond screen.
 *   @param {string} [options.position=bottom] Vertical position of results related to input. Can be 'top', 'bottom'
 */
Q.Tool.define("Streams/userChooser", function(o) {
    Q.Streams.cache.userChooser = Q.Streams.cache.userChooser || {};

	var tool = this;
	var state = this.state;

	tool.onChoose = o.onChoose;
	tool.delay = o.delay;
	tool.exclude = o.exclude;
	tool.lastChooseTime = 0;

	var $te = $(this.element);
	this.$input = $('input', $te);
	if (!this.$input.length) {
		this.$input = $('<input />', {
			"class": "text Streams_userChooser_input",
			placeholder: state.placeholder,
			autocomplete: 'off'
		}).appendTo($te);
	}
	var offset = this.$input && this.$input.offset();
	if (!offset) {
		return; // some error
	}
	var focusedResults = false;
	tool.$results = $('<div style="text-align: left;" class="Streams_userChooser_results" />').css({
		display: 'none',
		position: 'absolute',
		left: offset.left + 'px',
		top: offset.top + tool.$input.outerHeight() + 'px',
		width: tool.$input.outerWidth(),
		'z-index': Q.zIndexTopmost() + 1,
		background: 'white',
		border: 'solid 1px #99a',
		height: state.resultsHeight,
		'tab-index': 9000
	}).on(Q.Pointer.start.eventName + ' focusin', function () {
		focusedResults = true;
	}).appendTo('body');

	tool.Q.onStateChanged('resultsHeight').set(function () {
		tool.$results.css("height", state.resultsHeight);
	}, tool);
	
	var lastQuery = null;

	var doQuery = Q.debounce(function (event) {

		var cur = $('.Q_selected', tool.$results);
		var query = tool.$input.val();

		if (!query && Date.now() - tool.lastChooseTime > 1000) {
			var key = Q.Streams.userChooser.lsKey + "\t" + state.initialList.key;
			var userIds = JSON.parse(localStorage.getItem(key)) || [];
			Q.Streams.Avatar.get.all(userIds, function (params, subjects) {
				Q.Streams.Avatar.byPrefix(tool.$input.val().toLowerCase(), function (err, avatars) {
					onResponse(null, Q.extend({}, subjects, avatars));
				}, {'public': true})
			});
			lastQuery = query;
		}

		switch (event.keyCode) {
			case 38: // up arrow
				if (event.type === 'keyup') {
					return;
				}
				var prev = cur.prev();
				if (!prev.length) {
					prev = tool.$results.children().last();
				}
				tool.$results.children().removeClass('Q_selected');
				prev.addClass('Q_selected');
				if (prev[0]) {
					prev[0].scrollIntoView({
						behavior: 'instant',
						block: 'nearest'
					})
				}
				return false;
			case 40: // down arrow
				if (event.type === 'keyup') {
					return;
				}
				var next = cur.next();
				if (!next.length) {
					next = tool.$results.children().first();
				}
				if (next[0]) {
					next[0].scrollIntoView({
						behavior: 'instant',
						block: 'nearest'
					});
				}
				tool.$results.children().removeClass('Q_selected');
				next.addClass('Q_selected');
				return false;
			case 13: // enter
				if (event.type === 'keyup') {
					return;
				}
				if (cur) {
					onChoose(cur);
				}
				return false;
			default:
				if (query === lastQuery) {
					return;
				}
				lastQuery = query;
				if (event.type === 'keydown') {
					return;
				}
				var hide = (!state.initialList || state.initialList.hide || !state.initialList.limit);
				if (!query && hide) {
					tool.$results.remove();
					return;
				}
				tool.$input.css({
					'background-image': 'url(' +Q.url('/{{Q}}/img/throbbers/loading.gif') + ')',
					'background-repeat': 'no-repeat'
				});
				Q.Streams.Avatar.byPrefix(tool.$input.val().toLowerCase(), onResponse, {'public': true});
		}

		function onChoose (cur) {
			var userId = cur.data('userId');
			var avatar = cur.data('avatar');
			tool.state.chosen = {
				userId: userId,
				avatar: avatar
			}
			tool.$input.blur().val('');
			var key = Q.Streams.userChooser.lsKey + "\t" + state.initialList.key;
			var userIds = JSON.parse(localStorage.getItem(key)) || [];
			userIds.unshift(userId);
			if (userIds.length > state) {
				if (userIds.length > state.initialList.limit) {
					userIds = userIds.slice(0, state.initialList.limit);
				}
			}
			localStorage.setItem(key, JSON.stringify(userIds));
			tool.lastChooseTime = Date.now();
			Q.handle(tool.onChoose, this, [userId, avatar]);
			tool.end();
		}

		function onResponse (err, avatars) {
			tool.$input.css('background-image', 'none');
			if (err) {
				return; // silently return
			}
			if (Q.isEmpty(avatars)) {
				return tool.$results.remove();
			}
			tool.$results.empty();
			var show = 0;
			for (var k in avatars) {
				if (k in tool.exclude && tool.exclude[k]) {
					continue;
				}

				if ((state.communitiesOnly && !Q.Users.isCommunityId(k)) || (!state.communitiesOnly && Q.Users.isCommunityId(k))) {
					continue;
				}

				var result = $('<a class="Q_selectable" style="display: block;" />').append(
					$('<img style="vertical-align: middle; width: 40px; height: 40px;" />')
					.attr('src', Q.plugins.Users.iconUrl(avatars[k].icon, 40))
				).append(
					$('<span />').html(avatars[k].displayName())
				).on(Q.Pointer.enter, function () {
					$('*', tool.$results).removeClass('Q_selected');
					$(this).addClass('Q_selected');
				}).on(Q.Pointer.leave, function () {
					$('*', tool.$results).removeClass('Q_selected');
					$(this).addClass('Q_selected');
				}).on(Q.Pointer.fastclick, function () {
					onChoose($(this));
				}).data('userId', k)
				.data('avatar', avatars[k])
				.on(Q.Pointer.start.eventName + ' focusin', function () {
					focusedResults = true;
				}).appendTo(tool.$results);
				if (!show) {
					result.addClass('Q_selected');
				}
				++show;
			}
			if (show) {
				tool.$results.css({
					left: tool.$input.offset().left + 'px',
					width: tool.$input.outerWidth()
				}).appendTo('body').show();

				var position = tool.$input.offset().top + tool.$input.outerHeight();
				var height = 300 - tool.$input.outerHeight();
				if (state.position === 'top') {
					tool.$results.css({
						'max-height': height,
						'overflow-y': 'auto',
						'overflow-x': 'hidden',
					});
					tool.$results.css({
						top: tool.$input.offset().top - tool.$results.outerHeight() + 'px',
					});
				} else {
					tool.$results.css({
						top: position + 'px',
					});
				}
			} else {
				tool.$results.remove();
			}
		}
	}, 200);

	tool.$input.on('blur', function (event) {
		setTimeout(function () {
			if (!focusedResults) {
				tool.$results.remove();
			} else {
				function _handlePointerEnd() {
					tool.$results.remove();
					$(document).off(Q.Pointer.end, _handlePointerEnd);
				}
				$(document).on(Q.Pointer.end, tool, function () {
					setTimeout(_handlePointerEnd, 0);
				});
			}
			focusedResults = false;
		}, 10);
	}).on('focus change keyup keydown', doQuery)

},

{
	onChoose: new Q.Event(),
	chosen: {
		userId: null,
		avatar: null
	},
	delay: 500,
	placeholder: Q.text.Streams.userChooser.Placeholder,
	communitiesOnly: false,
	resultsHeight: "auto",
	exclude: {},
	initialList: {
		key: "",
		limit: 10
	}
},

{
	end: function () {
		if (this.$input) {
			this.$input.blur().trigger('Q_refresh');	
		}
		if (this.$results) {
			this.$results.remove();	
		}
	},
	Q: {
		beforeRemove: function () {
			this.end();
		}
	}
}

);

Q.Streams.userChooser = {
	lsKey: 'Streams.userChooser.initialList'
};

})(Q, jQuery);
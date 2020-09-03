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
 *   @param {Number} [options.delay=500] how long to delay before sending a request
 *    to allow more characters to be entered
 *   @param {bool} [options.communitiesOnly=false] If true, search communities instead regular users
 *   @param {Object} [options.exclude] hash of {userId: true},
 *    where userId are the ids of the users to exclude from the results.
 *    Defaults to id of logged-in user, if logged in.
 *   @param {string} [options.position=bottom] Vertical position of results related to input. Can be 'top', 'bottom'
 */
Q.Tool.define("Streams/userChooser", function(o) {
    Q.Streams.cache.userChooser = Q.Streams.cache.userChooser || {};

	var tool = this;

	tool.onChoose = o.onChoose;
	tool.delay = o.delay;
	tool.exclude = o.exclude;

	var element = $(this.element);
	this.$input = $('input', element);
	if (!this.$input) {
		return; // some error
	}
	var cached = {};
	var focusedResults = false;
	tool.$results = $('<div style="text-align: left;" class="Streams_userChooser_results" />')
		.css({
			display: 'none',
			position: 'absolute',
			left: tool.$input.offset().left + 'px',
			top: tool.$input.offset().top + tool.$input.outerHeight() + 'px',
			width: tool.$input.outerWidth(),
			'z-index': 80000,
			background: 'white',
			border: 'solid 1px #99a',
			'tab-index': 9000
		}).on(Q.Pointer.start.eventName + ' focusin', function () {
			focusedResults = true;
		}).appendTo('body');

	var t = null;
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
	}).on('focus change', doQuery);
	element.on('keyup keydown', doQuery);
	
	var lastQuery = null;

	function doQuery(event) {

		var cur = $('.Q_selected', tool.$results);
		var query = tool.$input.val();

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
				return false;
			case 40: // down arrow
				if (event.type === 'keyup') {
					return;
				}
				var next = cur.next();
				if (!next.length) {
					next = tool.$results.children().first();
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
				if (!query) {
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
			tool.$input.blur().val('');
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

				if ((tool.state.communitiesOnly && !Q.Users.isCommunityId(k)) || (!tool.state.communitiesOnly && Q.Users.isCommunityId(k))) {
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
				if (tool.state.position === 'top') {
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
	}

},

{
	onChoose: new Q.Event(),
	delay: 500,
	communitiesOnly: false,
	exclude: {}
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

})(Q, jQuery);
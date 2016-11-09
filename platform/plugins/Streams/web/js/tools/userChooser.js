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
 *   @param {Function} [options.onChoose] callback function with (userId, avatar)  parameters
 *   @param {Number} [options.delay]
 *   @default 500
 *   @param {Object} [options.exclude]
 *   @default {}
 */
Q.Tool.define("Streams/userChooser", function(o) {
	Q.plugins.Streams.cache = Q.plugins.Streams.cache || {};
    Q.plugins.Streams.cache.userChooser = Q.plugins.Streams.cache.userChooser || {};

	var me = this;

	me.onChoose = o.onChoose;
	me.delay = o.delay;
	me.exclude = o.exclude;

	var element = $(this.element);
	var input = $('input', element);
	var cached = {};
	var focusedResults = false;
	var $results = $('<div style="text-align: left;" class="Streams_userChooser_results" />')
		.css({
			display: 'none',
			position: 'absolute',
			left: input.offset().left + 'px',
			top: input.offset().top + input.outerHeight() + 'px',
			width: input.outerWidth(),
			'z-index': 80000,
			background: 'white',
			border: 'solid 1px #99a',
			'tab-index': 9000
		}).on('mousedown focusin', function () {
			focusedResults = true;
		}).appendTo('body');

	var t = null;
	element.on('Q-closingOverlay', function() {
		input.blur();
		$results.remove();
	});
	input.on('blur', function (event) {
		setTimeout(function () {
			if (!focusedResults) {
				$results.remove();
			} else {
				$(document).one('mouseup', function () {
					$results.remove();
				});
			}
			focusedResults = false;
		}, 10);
	}).on('focus change', doQuery);
	element.on('keyup keydown', doQuery);

	function doQuery(event) {

		var query = input.val();

		var cur = $('.Q_selected', $results);

		switch (event.keyCode) {
			case 38: // up arrow
				if (event.type === 'keyup') {
					return;
				}
				var prev = cur.prev();
				if (!prev.length) {
					prev = $results.children().last();
				}
				$results.children().removeClass('Q_selected');
				prev.addClass('Q_selected');
				return false;
			case 40: // down arrow
				if (event.type === 'keyup') {
					return;
				}
				var next = cur.next();
				if (!next.length) {
					next = $results.children().first();
				}
				$results.children().removeClass('Q_selected');
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
				if (event.type === 'keydown') {
					return;
				}
				if (!query) {
					$results.remove();
					return;
				}
				input.css({
					'background-image': 'url(' +Q.url('/plugins/Q/img/throbbers/loading.gif') + ')',
					'background-repeat': 'no-repeat'
				});
				Q.Streams.Avatar.byPrefix(input.val().toLowerCase(), onResponse, {'public': true});
		}

		function onChoose (cur) {
			var userId = cur.data('userId');
			var avatar = cur.data('avatar');
			input.blur().val('');
			Q.handle(me.onChoose, this, [userId, avatar]);
		}

		function onResponse (err, avatars) {
			input.css('background-image', 'none');
			if (err) {
				return; // silently return
			}
			if (Q.isEmpty(avatars)) {
				return $results.remove();
			}
			$results.empty();
			var show = 0;
			for (var k in avatars) {
				if (k in me.exclude && me.exclude[k]) {
					continue;
				}

				var result = $('<a class="Q_selectable" style="display: block;" />').append(
					$('<img style="vertical-align: middle; width: 40px; height: 40px;" />')
					.attr('src', Q.plugins.Users.iconUrl(avatars[k].icon, 40))
				).append(
					$('<span />').html(avatars[k].displayName())
				).on(Q.Pointer.enter, function () {
					$('*', $results).removeClass('Q_selected');
					$(this).addClass('Q_selected');
				}).on(Q.Pointer.leave, function () {
					$('*', $results).removeClass('Q_selected');
					$(this).addClass('Q_selected');
				}).on(Q.Pointer.fastclick, function () {
					onChoose($(this));
				}).data('userId', k)
				.data('avatar', avatars[k])
				.on('mousedown focusin', function () {
					focusedResults = true;
				}).appendTo($results);
				if (!show) {
					result.addClass('Q_selected');
				}
				++show;
			}
			if (show) {
				$results.css({
					left: input.offset().left + 'px',
					top: input.offset().top + input.outerHeight() + 'px',
					width: input.outerWidth()
				}).appendTo('body').show();
			} else {
				$results.remove();
			}
		}
	}

},

{
	onChoose: function (userId, avatar) {
		alert("Chose userId "+userId+".\nPlease pass onChoose to userChooser tool");
	},
	delay: 500,
	exclude: {}
}

);

})(Q, jQuery);
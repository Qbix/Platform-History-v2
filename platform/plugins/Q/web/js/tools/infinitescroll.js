(function (Q, $) {
	/**
	 * @module Q-tools
	 */

	/**
	 * When you scroll and reach the end of a list, more has already been loaded.
	 * @class Q infinitescroll
	 * @constructor
	 * @param {Object} [options] Override various options for this tool
	 *  @param {Float} [options.future.threshold=0.8] Required. How much to scroll to load future elements.
	 *  @param {Boolean} [options.flipped=false] If true, seek for scrolling from bottom to top.
	 *  @param {Object} [options.onInvoke] Event fired when need load new elements.
	 * @return {Q.Tool}
	 */
	Q.Tool.define('Q/infinitescroll', function (options) {
		var tool = this;
		var state = tool.state;
		var $te = $(tool.element);

		state.lastScrollHeight = $te[0].scrollHeight;

		$te.on('scroll', tool, function () {
			var scrolled;

			if (state.flipped) {
				scrolled = 1 - $te[0].scrollTop/$te[0].scrollHeight;
			} else {
				scrolled = ($te[0].scrollTop + $te[0].clientHeight)/$te[0].scrollHeight;
			}

			if (scrolled >= state.future.threshold && !state.waiting) {
				state.waiting = true;
				Q.handle(state.onInvoke, tool, [scrolled]);
			}
		});

		// watch for tool.element scrollHeight change
		this.watchingScrollHeight = setInterval(function () {
			if (state.lastScrollHeight < $te[0].scrollHeight) {
				// if flipped, scroll down to the value of scrollHeight diff
				if (state.flipped) {
					$te[0].scrollTop += $te[0].scrollHeight - state.lastScrollHeight;
				}

				state.waiting = false;
			}
			
			if (!$te.is(":visible")) {
				clearInterval(tool.watchingScrollHeight);
			}

			state.lastScrollHeight = $te[0].scrollHeight;
		}, 100);
	}, {
		future: {
			threshold: 0.8
		},
		past: {
			threshold: 0.2
		},
		flipped: false,
		onInvoke: new Q.Event()
	}, {
		Q: {
			beforeRemove: function () {
				if (this.watchingScrollHeight) {
					clearInterval(this.watchingScrollHeight);
				}
			}
		}
	});

})(Q, jQuery);
(function (Q, $) {

/**
 * Q Tools
 * @module Q-tools
 */

/**
 * This renders a ticker that scrolls its items
 * @class Q ticker
 * @constructor
 * @param {Object} [options] This is an object of parameters for this function
 *  @param {Boolean} [options.vertical]
 *  @default true
 *  @param {Number} [options.speed]
 *  @default 1
 *  @param {Number} [options.pause_ms]
 *  @default 2000
 *  @param {Boolean} [options.scrollbars]
 *  @default true
 *  @param {Number} [options.scrollbars_pause_ms]
 *  @default 500
 *  @param {Number} [options.anim_ms]
 *  @default 100
 */

Q.Tool.define("Q/ticker", function(options) {
	// private variables:
	var threshold = 5; // how many pixels until manual scrolling kicks in

	if (!('vertical' in options))
		options['vertical'] = true;

	if (!('pause_ms_min' in options))
		options['pause_ms_min'] = options['pause_ms'];

	// constructor
	var me = this;
	var $ticker = $('#'+this.prefix+'tool .Q_ticker');
	var $container = $ticker.children();
	var $children = $container.children();
	if ($children.length && $children.get(0).tagName.toUpperCase() == 'TABLE') {
		$children = $children.children();
	}
	if ($children.length && $children.get(0).tagName.toUpperCase() == 'TBODY') {
		$children = $children.children();
	}
	if ($children.length && !options.vertical) {
		$children = $children.children();
	}
	
	Q.addStylesheet('{{Q}}/css/tools/ticker.css', { slotName: 'Q' });

	this.onHitStart = function() {}; // override this to handle this event
	this.onHitEnd = function() {}; // override this to handle this event

	this.ready = function() {
		if ($ticker.data('isTicker'))
			return;

		$ticker.data('isTicker', true);

		if (!$ticker.hasClass('ticker'))
			$ticker.addClass('ticker');

		if (!$ticker.hasClass('vertical') && !$ticker.hasClass('horizontal'))
			$ticker.addClass(options['vertical'] ? 'vertical' : 'horizontal');

		me.setScrollbars(options['scrollbars']);

		$container.css('visibility','hidden');

		setTimeout(function(){
			me.calculateDimensions();

			if (options['speed'] < 0) {
				if (options['vertical'])
					$ticker.scrollTop($container.height());
				else
					$ticker.scrollLeft($container.width());
			}

			$container.css('visibility','visible');

			me.anim_ms = options['anim_ms'] ? options['anim_ms'] : 100;

			setInterval(me.autoScroll, me.anim_ms);
		}, 1000);
	};

	this.setScrollbars = function(shouldShow) {
		$ticker.toggleClass('scrollbars', shouldShow);
	};

	this.pause = function() {
		me.scrollMode = 'paused';
		me.msSincePaused = 0;
		me.pause_ms = options['pause_ms_min'] + Math.random() * (options['pause_ms'] - options['pause_ms_min']);
	};

	this.resume = function(curScrollPos) {
		me.scrollMode = 'auto';
		me.frameIndex = 0;
		me.startScrollPos = curScrollPos;
		me.newScrollPos = me.getNextScrollPos(curScrollPos);
	};

	this.autoScroll = function () {
		var curScrollPos = (options['vertical']) ? $ticker.scrollTop() : $ticker.scrollLeft();

		// Raise scrolling events, if any
		if (! ('lastScrollPos' in me) || me.lastScrollPos != curScrollPos)
		{
			me.raisedOnHitStart = false;
			me.raisedOnHitEnd = false;
		}

		if (curScrollPos === 0)
		{
			if (!me.raisedOnHitStart)
				me.onHitStart();

			me.raisedOnHitStart = true;
		}
		else
		{
			if (options['vertical'])
			{
				if (curScrollPos == $ticker[0].scrollHeight - $ticker[0].clientHeight) //FIXME: check scrollHeight && clientHeight
				{
					if (!me.raisedOnHitEnd)
						me.onHitEnd();
					me.raisedOnHitEnd = true;
				}
			}
			else
			{
				if (curScrollPos == $ticker[0].scrollWidth - $ticker[0].clientWidth) //FIXME: check scrollHeight && clientHeight
				{
					if (!me.raisedOnHitEnd)
						me.onHitEnd();

					me.raisedOnHitEnd = true;
				}
			}
		}

		// Handle the auto scrolling

		if (! ('scrollMode' in me)) {
			if ('initial_scroll_mode' in options) {
				me.scrollMode = options.initial_scroll_mode;
			} else {
				me.scrollMode = 'auto';
			}
			if (me.scrollMode == 'auto') {
				me.resume(curScrollPos);
				me.newScrollPos = me.getFirstScrollPos(curScrollPos);
			} else {
				me.msSincePaused = 0;
				me.pause_ms = options['pause_ms_min'] + Math.random() *
						(options['pause_ms'] - options['pause_ms_min']);
			}
		}

		if (speed === 0) {
			return -1;
		}

		if (! ('frameIndex' in me)) {
			me.frameIndex = 0;
		}

		if (! ('startScrollPos' in me)) {
			me.startScrollPos = 0;
		}

		if (me.scrollMode != 'manual'
				&& 'lastAutoScrollPos' in me
				&& !isNaN(me.lastAutoScrollPos)
				&& Math.abs(me.lastAutoScrollPos - curScrollPos) > threshold) {

			// the scrollbar has started moving by some other means
			// stop this function from executing, start waiting
			// until it stops and options['scrollbars_pause_ms']
			// milliseconds have elapsed since then.
			me.scrollMode = 'manual';

			// reset # of msec passed since manual scrolling
			me.msSinceManual = 0;

		} else if (me.scrollMode == 'manual') {

			if ('lastScrollPos' in me
					&& me.lastScrollPos != curScrollPos) {
				// the scrollbar continues to move,
				// reset # of msec to wait since manual scrolling
				me.msSinceManual = 0;

				// keep the scroll mode as 'manual'
			} else {
				// increment the # of msec passed since manual scrolling
				me.msSinceManual += me.anim_ms;

				if (options['scrollbars_pause_ms'] >= 0
						&& me.msSinceManual > options['scrollbars_pause_ms']) {
					me.resume(curScrollPos);
				}
			}

		} else if (me.scrollMode == 'paused') {

			// increment the # of msec passed since manual scrolling
			me.msSincePaused += me.anim_ms;

			if (me.pause_ms >= 0 && me.msSincePaused > me.pause_ms) {
				me.resume(curScrollPos);
			}
		}

		if (me.scrollMode == 'auto') {
			var speed = options['speed'];
			var fraction = me.frameIndex * (me.anim_ms / 1000 * Math.abs(speed));

			var nextScrollPos;
			if (fraction >= 1) {
				me.pause();
			}

			nextScrollPos = me.startScrollPos +
					(me.newScrollPos - me.startScrollPos) * me.ease(fraction);

			if (options['vertical']) {
				$ticker.scrollTop(nextScrollPos);
				me.lastAutoScrollPos = $ticker.scrollTop();
			} else {
				$ticker.scrollLeft(nextScrollPos);
				me.lastAutoScrollPos = $ticker.scrollLeft();
			}

			++me.frameIndex;
		} else {
			me.lastScrollPos = curScrollPos;
		}

		// This makes sure the scrolling events don't happen twice
		if (! ('lastScrollPos' in me) || me.lastScrollPos != curScrollPos) {
			me.lastScrollPos = curScrollPos;
		}

		return 0;
	};

	this.getFirstScrollPos = function(curScrollPos) {
		var ticker = document.getElementById(options['element_id']);
		var speed = options['speed'];
		var i;

		me.calculateDimensions();

		if (speed >= 0) {
			return 0;
		}

		if (options['vertical']) {
			var bottom = 0;
			var top = 0;
			for (i = 0; i < me.heights.length; ++i) {
				bottom += me.heights[i];
			}
			for (i = 0; i < me.heights.length; ++i) {
				top += me.heights[i];
				if (top + me.heights[i] > bottom - $ticker.innerHeight()) {
					return top;
				}
			}
			return top;
		} else {
			var right = 0;
			var left = 0;
			for (i = 0; i < me.widths.length; ++i) {
				right += me.widths[i];
			}
			for (i = 0; i < me.widths.length; ++i) {
				left += me.widths[i];
				if (left + me.widths[i] > right - $ticker.innerWidth()) {
					return left;
				}
			}
			return left;
		}
		return -2;
	};

	this.getNextScrollPos = function(curScrollPos) {
		var speed = options['speed'];
		var i;

		me.calculateDimensions();

		if (speed === 0) {
			return -1;
		}

		if (options['vertical']) {
			var top = 0;
			for (i = 0; i < me.heights.length; ++i) {
				if (speed > 0) {
					if (top + me.heights[i] > curScrollPos)
						return top + me.heights[i];
				} else {
					if (top + me.heights[i] >= curScrollPos - 1)
						return top;
				}
				top += me.heights[i];
			}
		} else {
			var left = 0;
			for (i = 0; i < me.widths.length; ++i) {
				if (speed > 0) {
					if (left + me.widths[i] > curScrollPos) {
						return left + me.widths[i];
					}
				} else {
					if (left + me.widths[i] >= curScrollPos - 1) {
						return left;
					}
				}
				left += me.widths[i];
			}
		}
		return -2;
	};

	this.ease = ('ease' in options)
			? Q.Animation.ease[options['ease']]
			: Q.Animation.ease.smooth;

	this.calculateDimensions = function () {
		me.widths = [];
		me.heights = [];

		$children.each(function(index){
			var $el = $(this);
			me.widths.push($el.outerWidth());
			me.heights.push($el.outerHeight());
		});
	};

	this.ready();
},

{
	vertical: true,
	speed: 1,
	pause_ms: 2000,
	scrollbars: true,
	scrollbars_pause_ms: 500,
	anim_ms: 100
}

);

})(Q, jQuery);
(function (Q, $, window, document, undefined) {

/**
 * Just a helper for iScroll plugin.
 * Needed to simplify applying iScroll and Q/scrollIndicators plugins.
 * @method iScroll
 * @param {Mixed} [object_or_string]
 * @param {Object} [object_or_string.Object]
 * If an Object, then it's a hash of options, similar to these passed to iScroll plus additional parameters:
 *		 "indicators": Defaults to true. Whether to show scroll indicators (apply Q/scrollIndicators plugin).
 * @param {Number} [object_or_string.Object.x] x
 * @default 0
 * @param {Number} [object_or_string.Object.y] y
 * @default 0
 * @param {Boolean} [object_or_string.Object.hScrollbar] hScrollbar
 * @default false
 * @param {Boolean} [object_or_string.Object.vScrollbar] vScrollbar
 * @default false
 * @param {Boolean} [object_or_string.Object.hScroll] hScroll
 * @default false
 * @param {Boolean} [object_or_string.Object.hideScrollbar] hideScrollbar
 * @default true
 * @param {Boolean} [object_or_string.Object.fadeScrollbar] fadeScrollbar
 * @default true
 * @param {Boolean} [object_or_string.Object.useTransition] useTransition
 * @default false
 * @param {Number} [object_or_string.Object.topOffset] topOffset
 * @default 0
 * @param {Q.Event} [object_or_string.Object.onRefresh] onRefresh
 * @default null
 * @param {Q.Event} [object_or_string.Object.onBeforeScrollStart] onBeforeScrollStart
 * @default null
 * @param {Q.Event} [object_or_string.Object.onScrollStart] onScrollStart
 * @default null
 * @param {Q.Event} [object_or_string.Object.onScrollMove] onScrollMove
 * @default null
 * @param {Q.Event} [object_or_string.Object.onScrollEnd] onScrollEnd
 * @default null
 * @param {Q.Event} [object_or_string.Object.onTouchEnd] onTouchEnd
 * @default null
 * @param {Boolean} [object_or_string.Object.showArrows] showArrows
 * @default true
 * @param {Number} [object_or_string.Object.horizontalGutter] horizontalGutter
 * @default 1
 * @param {Number} [object_or_string.Object.verticalGutter] verticalGutter
 * @default 1
 * @param {Boolean} [object_or_string.Object.maintainPosition] maintainPosition
 * @default true
 * @param {Boolean} [object_or_string.Object.autoReinitialize] autoReinitialize
 * @default true
 * @param {Boolean} [object_or_string.Object.animateScroll] animateScroll
 * @default true
 * @param {Boolean} [object_or_string.Object.hijackInternalLinks] hijackInternalLinks
 * @default true
 * @param {Boolean} [object_or_string.Object.indicators] indicators
 * @default true
 * @param {String} [object_or_string.String]
 *	 If a string, then it's a command which may be:
 *		 "remove": Destroys iScroll together with Q/scrollIndicators.
 */
Q.Tool.jQuery("Q/iScroll", function (o) {

	var $this = $(this);
	Q.addScript(['{{Q}}/js/contextual', '{{Q}}/js/iscroll.js'],
	function () {
		if (o.jScrollPane) {
			$this.jScrollPane(o);	
		} else if ($this[0].children.length) {
			$this.data('Q/iScroll', new iScroll($this[0], o));
		}
		if (o.indicators)
		{
			setTimeout(function()
			{
				$('.jspContainer').css('top', '0px');
				if ($this.data('Q/iScroll'))
				{
					$this.plugin('Q/scrollIndicators', 'remove')
					.plugin('Q/scrollIndicators', {
						'type': 'iScroll',
						'scroller': $this.data('Q/iScroll'),
						'orientation': ($this[0].scrollHeight > $this[0].offsetHeight ? 'v' : 'h')
					});
				}
			}, 0);
		}
	});
},

{
	'x': 0,
	'y': 0,
	'hScrollbar': false,
	'vScrollbar': false,
	'hScroll': false,
	'hideScrollbar': true,
	'fadeScrollbar': true,
	'useTransition': false,
	'topOffset': 0,
	'onRefresh': null,
	'onBeforeScrollStart': null,
	'onScrollStart': null,
	'onScrollMove': null,
	'onScrollEnd': null,
	'onTouchEnd': null,
	
	'showArrows': true,
	'horizontalGutter': 1,
	'verticalGutter': 1,
	'maintainPosition': true,
	'autoReinitialize': true,
	'animateScroll': true,
	'hijackInternalLinks': true,
	
	'indicators': true
},

{
	refresh: function () {
		return this.each(function() {
			var $this = $(this);
			if ($this.state('Q/iScroll'))
			{
				//$this.data('Q/iScroll').refresh();
				$this.plugin('Q/scrollIndicators', 'remove')
				.plugin('Q/scrollIndicators', {
					'type': 'iScroll',
					'scroller': $this.data('Q/iScroll'),
					'orientation': ($this[0].scrollHeight > $this[0].offsetHeight ? 'v' : 'h')
				});
			}
		});
	},

	remove: function () {
		return this.each(function() {
			var $this = $(this);
			$this.plugin('Q/scrollIndicators', 'remove');
			var iScroll = $this.data('Q/iScroll');
			if (iScroll)
				$this.data('Q/iScroll').destroy();
			$this.removeData('Q/iScroll');
			$this.removeData('Q/iScroll options');
		});
	}
}

);

})(Q, Q.$, window, document);
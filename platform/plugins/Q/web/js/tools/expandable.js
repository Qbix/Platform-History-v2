(function (Q, $) {
/**
 * @module Q-tools
 */
	
/**
 * Implements expandable containers that work on most modern browsers,
 * including ones on touchscreens.
 * @class Q expandable
 * @constructor
 * @param {Object} [options] Override various options for this tool
 *  @param {String} [options.title] Required. The title for the expandable.
 *  @param {String} [options.content] Required. The content.
 *  @param {Number} [options.count] A number, if any, to display when collapsed.
 *  @param {Number} [options.spaceAbove] How many pixels of space to leave above at the end of the scrolling animation
 *  @param {Boolean} [options.expanded] Whether it should start out expanded
 *  @param {Boolean} [options.evenIfFilled=false] If true, fill tool.element with content event if tool.element have children
 *  @param {Boolean} [options.autoCollapseSiblings=true] Whether, when expanding an expandable, its siblings should be automatically collapsed.
 *  @param {Boolean} [options.scrollContainer] Whether to scroll a parent container when necessary
 *   @param {Q.Event} [options.onRefresh] Event occurs when tool element has rendered with content
 * @return {Q.Tool}
 */
Q.Tool.define('Q/expandable', function (options) {
	var tool = this;
	var state = tool.state;
	var $te = $(tool.element);
	
	Q.addStylesheet('{{Q}}/css/expandable.css');

	if (state.evenIfFilled || !$te.children().length) {
		// set it up with javascript
		var count = options.count || '';
		var h2 = "<h2 class='Q_clearfix'>"
			+"<span class='Q_expandable_count '>"+count+"</span>"
			+options.title
			+"</h2>";
		var div = "<div class='Q_expandable_container'><div class='Q_expandable_content'>"
			+options.content+"</div></div>";
		this.element.innerHTML = h2 + div;
		setTimeout(function () {
			Q.handle(state.onRefresh, tool);
		}, 0);
	}
	
	var $h2 = $('>h2', $te);
	if (state.expanded == null) {
		state.expanded = $h2.next().is(':visible');
	} else if (state.expanded) {
		$h2.addClass('Q_expanded')
		.next().addClass('Q_expanded')
		.css('display', 'block');
	}
	
	this.element.preventSelections(true);
	$h2.on(Q.Pointer.fastclick, function () {
		if ($h2.hasClass('Q_expanded')) {
			tool.collapse();
		} else {
			tool.expand();
		}
	}).on(Q.Pointer.start, function () {
		var $this = $(this);
		$this.addClass('Q_pressed');
		function f() {
			$this.removeClass('Q_pressed');
			$(window).off(Q.Pointer.end, f);
		}
		$(window).on(Q.Pointer.end, f);
	});
	if (!Q.info.isTouchscreen) {
		$h2.on('mouseenter', function () {
			$(this).addClass('Q_hover');
		}).on('mouseleave', function () {
			$(this).removeClass('Q_hover');
		});
	}
	tool.Q.onStateChanged('count').set(function () {
		$h2.find('.Q_expandable_count').html(state.count);
	});
}, {
	count: 0,
	spaceAbove: null,
	expanded: null,
	autoCollapseSiblings: true,
	scrollContainer: true,
	duration: 300,
	evenIfFilled: false,
	onRefresh: new Q.Event(),
	beforeExpand: new Q.Event(),
	onExpand: new Q.Event(),
	beforeCollapse: new Q.Event()
}, {
	/**
	 * @method expand
	 * @param {Object} [options]
	 *  @param {Boolean} [options.autoCollapseSiblings] Whether, when expanding an expandable,
	 *  @param {Boolean} [options.scrollContainer] Whether to scroll a parent container
	 *  @param {Boolean} [options.scrollToElement] Can be used to specify another element to scroll to when expanding. Defaults to the title element of the expandable.
 *  @param {Number} [options.spaceAbove] How many pixels of space to leave above at the end of the scrolling animation
	 * @param {Function} [callback] the function to call once the expanding has completed
	 */
	expand: function (options, callback) {
		var tool = this;
		var state = tool.state;
		if (false === Q.handle(state.beforeExpand, this, [])) {
			return false;
		}
		var o = Q.extend({}, tool.state, options);
		var $te = $(this.element);
		var $h2 = $('>h2', $te);
		var $parent = $te.parent();
		if (o.autoCollapseSiblings) {
			$parent[0].forEachTool("Q/expandable", function () {
				if (this.id === tool.id) {
					return;
				}

				this.collapse();
			});
		}
		var $expandable = $h2.next().slideDown(state.duration, 'linear');
		state.expanded = true;
		if (!o.scrollContainer) {
			return;
		}
		Q.Animation.play(function (x, y) {
			var $scrollable = (o.scrollContainer instanceof Element)
				? $(o.scrollContainer) : tool.scrollable();
			var offset = $scrollable
				? $scrollable.offset()
				: {left: 0, top: 0};
			var $element = o.scrollToElement ? $(o.scrollToElement) : $h2;
			var t1 = $element.offset().top - offset.top;
			var spaceAbove;
			var defaultSpaceAbove = $element.height() / 2;
			var moreSpaceAbove = 0;
			var $ts = $expandable.closest('.Q_columns_column').find('.Q_columns_title');
			var scrollableRect = $scrollable[0].getBoundingClientRect();
			if ($ts.length && $ts.css('position') === 'fixed') {
				moreSpaceAbove = $ts.outerHeight();
			} else {
				$('body').children().each(function () {
					var $this = $(this);
					var fixedRect = this.getBoundingClientRect();
					var midpoint = (scrollableRect.left + scrollableRect.right) / 2;
					if ($this.css('position') === 'fixed'
					&& fixedRect.left <= midpoint
					&& fixedRect.right >= midpoint
					&& fixedRect.top <= scrollableRect.top) {
						var top = $this.offset().top - Q.Pointer.scrollTop();
						if (top < 100) {
							moreSpaceAbove = top + $this.outerHeight();
							return false;
						}
					}
				});
			}
			defaultSpaceAbove += moreSpaceAbove;
			var spaceAbove = (state.spaceAbove == null)
				? defaultSpaceAbove
				: state.spaceAbove;
			var isBody = $scrollable &&
				['BODY', 'HTML'].indexOf($scrollable[0].tagName.toUpperCase()) >= 0;
			if (isBody) {
				t1 -= Q.Pointer.scrollTop();
			}
			if ($scrollable) {
				var t = $element.offset().top - offset.top;
				if (isBody) {
					t -= Q.Pointer.scrollTop();
				}
				var scrollTop = $scrollable.scrollTop() + t - t1 * (1-y) - spaceAbove * y;
				$scrollable.scrollTop(scrollTop);
			}
		}, state.duration).onComplete.set(function () {
			Q.handle(callback, tool, []);
			Q.handle(state.onExpand, tool, []);
			$h2.add($expandable).addClass('Q_expanded');
		});
	},
	
	collapse: function () {
		var tool = this;
		var state = this.state;
		var $h2 = $('>h2', this.element);
		$h2.removeClass('Q_expanded')
		.next().removeClass('Q_expanded')
		.slideUp(state.duration).each(function () {
			var t = this.parentNode.Q("Q/expandable");
			Q.handle(t.state.beforeCollapse, t, [tool]);
		});
		state.expanded = false;
	},
	
	scrollable: function () {
		return $(this.element.scrollingParent(true, 'vertical'));
	}
});

})(Q, jQuery);
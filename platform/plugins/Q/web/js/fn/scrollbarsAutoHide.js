(function (Q, $, window, document, undefined) {

/**
 * Q Tools
 * @module Q-tools
 */

/**
 * jQuery plugin for automatically hiding scrollbars
 * on 'overflow: scroll' or 'overflow: auto' elements when
 * mouse cursor is not over them.
 * Usable on desktop browsers for not overloading interface
 * with unneeded visual elements (such as scrollbars)
 * if there are lot of scrollable areas.
 * @class Q scrollbarsAutoHide
 * @constructor
 * @param {Mixed} [Object_or_String] function could have String or Object parameter
 * @param {Object} [Object_or_String.Object] If an object then it's a hash of options, that can include:
 *   @param {Boolean} [Object_or_String.Object.scrollbarPadding] Boolean which indicates whether to preserve padding in a container based on scrollbar
 *   width. Padding preserved on the right side (for vertical scrolling) or on the bottom side (for horizontal scrolling).
 *	 @default true
 *	 @param {Q.Event} [Object_or_String.Object.showHandler] callback which is called when scrollbar is just shown.
 *	 @param {Q.Event} [Object_or_String.Object.hideHandler] callback which is called when scrollbar is just hidden.
 * @param {String} [Object_or_String.String]
 *	 If a string then it's a command and it can have following values:
 *	 "remove": Removes the plugin functionality so the container won't hide its scrollbars automatically anymore.
 */

    Q.Tool.jQuery('Q/scrollbarsAutoHide',

        function (o) {

            var $this = this;
			var element = this[0];
            if (element.scrollHeight <= element.offsetHeight
                && element.scrollWidth <= element.offsetWidth) {
                return;
            }
            var scrollbarWidth = Q.Browser.getScrollbarWidth();
            var oldOverflow = $this.css('overflow');
            var oldPaddingRight = parseInt($this.css('padding-right'));
            var oldPaddingBottom = parseInt($this.css('padding-bottom'));
            $this.data('Q/scrollbarsAutoHide old_overflow', oldOverflow);
            $this.data('Q/scrollbarsAutoHide old_padding_right', oldPaddingRight);
            $this.data('Q/scrollbarsAutoHide old_padding_bottom', oldPaddingBottom);
            var scrollbarRight = element.scrollHeight > element.offsetHeight;
            var scrollbarBottom = element.scrollWidth > element.offsetWidth;
            if (scrollbarRight) {
				var newPaddingRight = Math.max(oldPaddingRight, scrollbarWidth);
				var paddingDiffRight = Math.max(0, newPaddingRight - scrollbarWidth);
                $this.css('overflow', 'hidden' );
                if (o.scrollbarPadding) {
                    $this.css('padding-right', newPaddingRight + 'px');
                } else {
                    $this.css('padding-right', paddingDiffRight + 'px');
                }
                var dataKey = 'Q/scrollbarsAutoHide margin';
                $this.on({
                    'mouseenter.Q_scrollbar_autohide': function() {
                        var t, w1, h1, w2, h2, m;
                        t = $this[0];
                        w1 = t.offsetWidth - t.clientWidth;
                        h1 = t.offsetHeight - t.clientHeight;
                        $this.css({ 'overflow': 'auto' });
                        w2 = t.offsetWidth - t.clientWidth;
                        h2 = t.offsetHeight - t.clientHeight;
                        $this.data(dataKey, $this.css('margin'));
                        if (w2 !== w1) {
                            m = parseInt($this.css('margin-right'));
                            $this.css('margin-right', m + w2 - w1);
                        }
                        if (w2 !== w1) {
                            m = parseInt($this.css('margin-right'));
                            $this.css('margin-bottom', m + h2 - h1);
                        }
                        $this.css('margin-bottom', $this.css('margin-bottom'))
                        if (o.scrollbarPadding) {
                            $this.css({ 'padding-right': paddingDiffRight + 'px' });
                        }
                        if (Q.Browser.detect().OS == 'mac') {
                            var scrollTop = $this.scrollTop();
                            $this.scrollTop(0);
                            $this.scrollTop(scrollTop);
                        }
                        Q.handle(o.showHandler);
                    },
                    'mouseleave.Q_scrollbar_autohide': function() {
                        var m;
                        $this.css({ 'overflow': 'hidden' });
                        if (o.scrollbarPadding) {
                            $this.css({ 'padding-right': newPaddingRight + 'px' });
                        }
                        if (m = $this.data(dataKey)) {
                            $this.css('margin', m);
                        }
                        Q.handle(o.hideHandler);
                    }
                });
            } else if (scrollbarBottom) {
				var newPaddingBottom = Math.max(oldPaddingBottom, scrollbarWidth);
				var paddingDiffBottom = Math.max(0, newPaddingRight - scrollbarWidth);
                $this.css({ 'overflow': 'hidden' });
                if (o.scrollbarPadding) {
                    $this.css('padding-bottom', newPaddingBottom + 'px');
                } else {
                    $this.css('padding-bottom', paddingDiffBottom + 'px');
                }
                $this.on({
                    'mouseenter.Q_scrollbar_autohide': function() {
                        $this.css({ 'overflow': 'auto' });
                        if (o.scrollbarPadding) {
                            $this.css({ 'padding-right': paddingDiffBottom + 'px' });
                        }
                        if (Q.Browser.detect().OS == 'mac') {
                            var scrollLeft = $this.scrollLeft();
                            $this.scrollLeft(0);
                            $this.scrollLeft(scrollLeft);
                        }
                        Q.handle(o.showHandler);
                    },
                    'mouseleave.Q_scrollbar_autohide': function() {
                        $this.css({ 'overflow': 'hidden' });
		                if (o.scrollbarPadding) {
		                    $this.css('padding-bottom', newPaddingBottom + 'px');
		                }
                        Q.handle(o.hideHandler);
                    }
                });
            }

            $this.on('mousemove.Q_scrollbar_autohide', function() {
                $this.off('mousemove.Q_scrollbar_autohide').trigger('mouseenter');
            });
        },

        {
            'scrollbarPadding': true,
            'showHandler': new Q.Event(function() {}),
            'hideHandler': new Q.Event(function() {})
        },

        {
			/**
			 * Removes the scrollbarsAutoHide functionality from the element
			 * @method remove
			 */
            remove: function () {
                var $this = this;
                if ($this.data('Q/scrollbarsAutoHide old_overflow') !== undefined)
                {
                    $this.off('mouseenter.Q_scrollbar_autohide mouseleave.Q_scrollbar_autohide mousemove.Q_scrollbar_autohide');
                    $this.css({
                        'overflow': $this.data('Q/scrollbarsAutoHide old_overflow'),
                        'padding-right': $this.data('Q/scrollbarsAutoHide old_padding_right') + 'px',
                        'padding-bottom': $this.data('Q/scrollbarsAutoHide old_padding_bottom') + 'px'
                    });
                    $this.removeData(['Q/scrollbarsAutoHide old_overflow', 'Q/scrollbarsAutoHide old_padding_right', 'Q/scrollbarsAutoHide old_padding_bottom']);
                }
            }
        }

    );

})(Q, Q.$, window, document);
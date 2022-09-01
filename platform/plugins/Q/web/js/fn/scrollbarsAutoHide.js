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
 * @param {Boolean} [horizontal=true] where to enable/disable horizontal scrolling
 * @param {Boolean} [vertical=false] whether to enable/disable vertical scrolling
 * @param {Boolean} [scrollbarPadding=true] Boolean which indicates whether to preserve margin in a container based on scrollbar
 *   width. Margin preserved on the right side (for vertical scrolling) or on the bottom side (for horizontal scrolling).
 * @param {Boolean} [skipOnMobile=true] - If true, skip this tool on mobile devices.
 * @param {Q.Event} [onShow] callback which is called when scrollbar is just shown.
 * @param {Q.Event} [onHide] callback which is called when scrollbar is just hidden.
 */

    Q.Tool.jQuery('Q/scrollbarsAutoHide', function (o) {
        var $this = this;
        var state = $this.state('Q/scrollbarsAutoHide');
        if (state.skipOnMobile && Q.info.isMobile) {
            return;
        }
        var element = this[0];
        if (element.scrollHeight <= element.offsetHeight
            && element.scrollWidth <= element.offsetWidth) {
            Q.onLayout(element).set(function () {
                $this.plugin("Q/scrollbarsAutoHide", state);
            });
            return;
        }
        var scrollbarWidth = Q.Browser.getScrollbarWidth();
        var scrollbarHeight = Q.Browser.getScrollbarHeight();
        var oldOverflow = $this.css('overflow');
        var oldMarginRight = parseInt($this.css('margin-right'));
        var oldMarginBottom = parseInt($this.css('margin-bottom'));
        $this.data('Q/scrollbarsAutoHide old_overflow', oldOverflow);
        $this.data('Q/scrollbarsAutoHide old_margin_right', oldMarginRight);
        $this.data('Q/scrollbarsAutoHide old_margin_bottom', oldMarginBottom);
        var scrollbarRight = element.scrollHeight > element.offsetHeight;
        var scrollbarBottom = element.scrollWidth > element.offsetWidth;
        if (scrollbarRight) {
            var newMarginRight = oldMarginRight + scrollbarWidth;
            var marginDiffRight = Math.max(0, newMarginRight - scrollbarWidth);
            $this.css('overflow', 'hidden' );
            if (o.scrollbarPadding) {
                $this.css('padding-right', newMarginRight + 'px');
            } else {
                $this.css('padding-right', marginDiffRight + 'px');
            }
        }
        if (scrollbarBottom) {
            var newMarginBottom = oldMarginBottom + scrollbarHeight;
            var marginDiffBottom = Math.max(0, newMarginBottom - scrollbarHeight);
            $this.css({ 'overflow': 'hidden' });
            if (o.scrollbarPadding) {
                $this.css('padding-bottom', newMarginBottom + 'px');
            } else {
                $this.css('padding-bottom', marginDiffBottom + 'px');
            }
        }
        $this.on({
            'mouseenter.Q_scrollbar_autohide': function() {
                if (state.horizontal && state.vertical) {
                    $this.css('overflow', 'auto');
                } else if (state.horizontal) {
                    $this.css('overflow-x', 'auto');
                } else if (state.vertical) {
                    $this.css('overflow-y', 'auto');
                }
                if (o.scrollbarPadding) {
                    $this.css({ 'padding-right': marginDiffRight + 'px' });
                    $this.css({ 'padding-bottom': marginDiffBottom + 'px' });
                }
                if (Q.Browser.detect().OS === 'mac') {
                    var scrollTop = $this.scrollTop();
                    $this.scrollTop(0);
                    $this.scrollTop(scrollTop);
                    var scrollLeft = $this.scrollLeft();
                    $this.scrollLeft(0);
                    $this.scrollLeft(scrollLeft);
                }
                Q.handle(o.onShow);
            },
            'mouseleave.Q_scrollbar_autohide': function() {
                $this.css({ 'overflow': 'hidden' });
                if (o.scrollbarPadding) {
                    $this.css({ 'padding-right': newMarginRight + 'px' });
                    $this.css('padding-bottom', newMarginBottom + 'px');
                }
                Q.handle(o.onHide);
            },
            'mousemove.Q_scrollbar_autohide':  function() {
                $this.off('mousemove.Q_scrollbar_autohide').trigger('mouseenter');
            }
        });
    },

    {
        scrollbarPadding: true,
        skipOnMobile: true,
        horizontal: true,
        vertical: false,
        onShow: new Q.Event(function() {}),
        onHide: new Q.Event(function() {})
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
                        'margin-right': $this.data('Q/scrollbarsAutoHide old_margin_right') + 'px',
                        'margin-bottom': $this.data('Q/scrollbarsAutoHide old_margin_bottom') + 'px'
                    });
                    $this.removeData(['Q/scrollbarsAutoHide old_overflow', 'Q/scrollbarsAutoHide old_margin_right', 'Q/scrollbarsAutoHide old_margin_bottom']);
                }
            }
        }
    );

})(Q, Q.$, window, document);
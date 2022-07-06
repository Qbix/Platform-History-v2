(function (Q, $, window, document, undefined) {

    /**
     * Makes shadows at the top and bottom of the scrollable area which indicates that scrolling is possible in these directions.
     * Automatically dissappears when no scrolling is possible in that direction.
     * @method scrollIndicators
     * @param {Mixed} [Object_or_String] function could have String or Object parameter
     *  @param {Object} [Object_or_String.Object] If an Object, then it's a hash of options, that can include:
     *   @param {String} [Object_or_String.Object.type] Type of scroller to which scroll indicators will be bound.
     *	  Can be either 'iScroll', 'touchscroll', 'scroller' or 'native'.
     *         'iScroll', 'touchscroll' and 'scroller' are corresponding jQuery plugins while 'native' means that
     *         scroll indicators consider native browser scrolling availability as a condition to show them
     *         (useful when indicators applied to whole natively-scrolled document).
     *
     *	 @param {String} [Object_or_String.Object.scroller] Object of the scroller. For 'iScroll' type this is exact iScroll instance,
     *	 for 'scroller' this is jQuery object on which $.fn.scroller was previously called.
     *	 @required
     *	 @param {String} [Object_or_String.Object.scroller] Affects indicators positioning and should depend on scroll direction of container element.
     *	 Can be value of 'v' or 'h'. Defaults to 'v'. On 'v' indicators are place at the top and bottom and on 'h'
     *	 they are placed at the left and right. Optional.
     *	 @param {String} [Object_or_String.Object.startClass] css class for indicator on the top or left (depending on scroll orientation).
     *	 May be used to change shadow image (background) and other styles. Optional.
     *	 @param {String} [Object_or_String.Object.endClass] css class for indicator on the bottom or right (depending on scroll orientation).
     *	 May be used to change shadow image (background) and other styles. Optional.
     *	 @param {Number} [Object_or_String.Object.fadeTime] Time to fadeIn / fadeOut for indicators.
     *	 If set to zero, indicators will appear immediately.
     *	 @default 200
     * @param {String} 	[Object_or_String.String]
     *	 If a string, then it's a command which may be:
     *	 "remove": Destroys plugin so scroll indicators won't be shown anymore.
     */
    Q.Tool.jQuery('Q/scrollIndicators',

        function _Q_scrollIndicators(o) {

            if (!o.type)
            {
                console.warn("Please specify type of scroller for scroll indicators, must be either 'iScroll', 'touchscroll', 'scroller' or 'native'");
                return;
            }
            if (!o.scroller)
            {
                console.warn('Please provide scroller object for scroll indicators.');
                return;
            }

            o.startClass = 'Q_scroll_indicator_'
                + (o.orientation == 'h' ? 'left' : 'top')
                + (Q.info.isMobile ? '_small' : ''),
                o.endClass = 'Q_scroll_indicator_'
                    + (o.orientation == 'h' ? 'right' : 'bottom')
                    + (Q.info.isMobile ? '_small' : '');

            return this.each(function()
            {
                var $this = $(this);
                var container = null;
                if (o.type == 'iScroll')
                    container = $this;
                else if (o.type == 'scroller' || o.type == 'touchscroll')
					container = $(o.scroller);
                else if (o.type == 'native')
                    container = $this;

                var paddingLeft = parseInt(container.css('padding-left'));
                var paddingRight = parseInt(container.css('padding-right'));
                var paddingTop = parseInt(container.css('padding-top'));
                var paddingBottom = parseInt(container.css('padding-bottom'));
                var width = container.width() ? container.width() : parseInt(container.css('width'));
                var height = container.height() ? container.height() : parseInt(container.css('height'));

                var startIndicator = $('<div class="Q_scroll_indicator ' + o.startClass + '" />');
                container.prepend(startIndicator);
                if (o.orientation == 'v')
                {
                    startIndicator.css({
                        'width': (width + paddingLeft + paddingRight) + 'px',
                        'margin-left': '-' + paddingLeft + 'px',
                        'margin-top': '-' + paddingTop + 'px'
                    });
                }
                else
                {
                    startIndicator.css({
                        'height': (height + paddingTop + paddingBottom) + 'px',
                        'margin-left': '-' + paddingLeft + 'px',
                        'margin-top': '-' + paddingTop + 'px'
                    });
                }
                if (o.type == 'native' && Q.info.platform == 'android')
                {
                    startIndicator.css({
                        'position': 'fixed',
                        'top': container.offset().top + 'px',
                        'margin-top': ''
                    });
                }

                var endIndicator = $('<div class="Q_scroll_indicator ' + o.endClass + '" />');
                container.prepend(endIndicator);
                if (o.orientation == 'v')
                {
                    endIndicator.css({
                        'width': (width + paddingLeft + paddingRight) + 'px',
                        'margin-left': '-' + paddingLeft + 'px',
                        'margin-top': (height + paddingTop - parseInt(endIndicator.css('height'))) + 'px'
                    });
                }
                else
                {
                    endIndicator.css({
                        'height': (height + paddingTop + paddingBottom) + 'px',
                        'margin-left': (width + paddingLeft - parseInt(endIndicator.css('width'))) + 'px',
                        'margin-top': '-' + paddingTop + 'px'
                    });
                }
                if (o.type == 'native' && Q.info.platform == 'android')
                {
                    endIndicator.css({
                        'position': 'fixed',
                        'top': (Q.Pointer.windowHeight() - endIndicator.outerHeight()) + 'px',
                        'margin-top': ''
                    });
                }

                if (o.type == 'iScroll')
                {
                    var updateIScroll = null;
                    if (o.orientation == 'v' && o.scroller.maxScrollY != 0)
                    {
                        updateIScroll = function()
                        {
                            if (o.scroller.y >= 0)
                            {
                                if (o.fadeTime)
                                {
                                    startIndicator.fadeOut(o.fadeTime);
                                    endIndicator.fadeIn(o.fadeTime);
                                }
                                else
                                {
                                    startIndicator.hide();
                                    endIndicator.show();
                                }
                            }
                            else if (o.scroller.y <= o.scroller.maxScrollY)
                            {
                                if (o.fadeTime)
                                {
                                    startIndicator.fadeIn(o.fadeTime);
                                    endIndicator.fadeOut(o.fadeTime);
                                }
                                else
                                {
                                    startIndicator.show();
                                    endIndicator.hide();
                                }
                            }
                            else
                            {
                                if (o.fadeTime)
                                {
                                    startIndicator.fadeIn(o.fadeTime);
                                    endIndicator.fadeIn(o.fadeTime);
                                }
                                else
                                {
                                    startIndicator.show();
                                    endIndicator.hide();
                                }
                            }
                        }
                    }
                    else if (o.orientation == 'h' && o.scroller.maxScrollX != 0)
                    {
                        updateIScroll = function()
                        {
                            if (o.scroller.x >= 0)
                            {
                                if (o.fadeTime)
                                {
                                    startIndicator.fadeOut(o.fadeTime);
                                    endIndicator.fadeIn(o.fadeTime);
                                }
                                else
                                {
                                    startIndicator.hide();
                                    endIndicator.show();
                                }
                            }
                            else if (o.scroller.x <= o.scroller.maxScrollX)
                            {
                                if (o.fadeTime)
                                {
                                    startIndicator.fadeIn(o.fadeTime);
                                    endIndicator.fadeOut(o.fadeTime);
                                }
                                else
                                {
                                    startIndicator.show();
                                    endIndicator.hide();
                                }
                            }
                            else
                            {
                                if (o.fadeTime)
                                {
                                    startIndicator.fadeIn(o.fadeTime);
                                    endIndicator.fadeIn(o.fadeTime);
                                }
                                else
                                {
                                    startIndicator.show();
                                    endIndicator.hide();
                                }
                            }
                        }
                    }
                    if (updateIScroll)
                    {
                        updateIScroll();
                        var oldOnScrollMove = o.scroller.options.onScrollMove;
                        var oldOnScrollEnd = o.scroller.options.onScrollEnd;
                        o.scroller.options.onScrollMove = function()
                        {
                            oldOnScrollMove && oldOnScrollMove.call(o.scroller);
                            updateIScroll();
                        };
                        o.scroller.options.onScrollEnd = function()
                        {
                            oldOnScrollEnd && oldOnScrollEnd.call(o.scroller);
                            updateIScroll();
                        }
                        $this.data('Q_scroll_indicator_update', updateIScroll);
                    }
                }
                else if (o.type == 'touchscroll')
                {
                    var startIndMarginTop = parseInt(startIndicator.css('margin-top'));
                    var startIndMarginLeft = parseInt(startIndicator.css('margin-left'));
                    var endIndMarginTop = parseInt(endIndicator.css('margin-top'));
                    var endIndMarginLeft = parseInt(endIndicator.css('margin-left'));
                    function updateTouchscroll(scrollable)
                    {
                        scrollable = scrollable[0];
                        if ((o.orientation == 'v' && scrollable.scrollTop == 0) ||
                            (o.orientation == 'h' && scrollable.scrollLeft == 0))
                        {
                            if (o.fadeTime)
                            {
                                startIndicator.fadeOut(o.fadeTime);
                                endIndicator.fadeIn(o.fadeTime);
                            }
                            else
                            {
                                startIndicator.hide();
                                endIndicator.show();
                            }
                        }
                        else if ((o.orientation == 'v' && scrollable.scrollTop + scrollable.offsetHeight >= scrollable.scrollHeight) ||
                            (o.orientation == 'h' && scrollable.scrollLeft + scrollable.offsetWidth >= scrollable.scrollWidth))
                        {
                            if (o.fadeTime)
                            {
                                startIndicator.fadeIn(o.fadeTime);
                                endIndicator.fadeOut(o.fadeTime);
                            }
                            else
                            {
                                startIndicator.show();
                                endIndicator.hide();
                            }
                        }
                        else
                        {
                            if (o.fadeTime)
                            {
                                startIndicator.fadeIn(o.fadeTime);
                                endIndicator.fadeIn(o.fadeTime);
                            }
                            else
                            {
                                startIndicator.show();
                                endIndicator.hide();
                            }
                        }
                        // firefox and maybe other browsers specific fix
                        if (Q.Browser.detect().engine != 'webkit')
                        {
                            if (o.orientation == 'v')
                            {
                                startIndicator.css({ 'margin-top': (startIndMarginTop + scrollable.scrollTop) + 'px' });
                                endIndicator.css({ 'margin-top': (endIndMarginTop + scrollable.scrollTop) + 'px' });
                            }
                            else if (o.orientation == 'h')
                            {
                                startIndicator.css({ 'margin-left': (startIndMarginLeft + scrollable.scrollLeft) + 'px' });
                                endIndicator.css({ 'margin-left': (endIndMarginLeft + scrollable.scrollLeft) + 'px' });
                            }
                        }
                    }
                    updateTouchscroll(o.scroller);
                    $this.data('Q_scroll_indicator_update', updateTouchscroll);
                }
                else if (o.type == 'scroller'
                    && $.fn.q_scroller.collection
                    && $.fn.q_scroller.collection.length)
                {
                    function updateScroller(percentage)
                    {
                        if (percentage == 0)
                        {
                            if (o.fadeTime)
                            {
                                startIndicator.fadeOut(o.fadeTime);
                                endIndicator.fadeIn(o.fadeTime);
                            }
                            else
                            {
                                startIndicator.hide();
                                endIndicator.show();
                            }
                        }
                        else if (percentage == 1)
                        {
                            if (o.fadeTime)
                            {
                                startIndicator.fadeIn(o.fadeTime);
                                endIndicator.fadeOut(o.fadeTime);
                            }
                            else
                            {
                                startIndicator.show();
                                endIndicator.hide();
                            }
                        }
                        else
                        {
                            if (o.fadeTime)
                            {
                                startIndicator.fadeIn(o.fadeTime);
                                endIndicator.fadeIn(o.fadeTime);
                            }
                            else
                            {
                                startIndicator.show();
                                endIndicator.hide();
                            }
                        }
                    }
                    $(o.scroller).plugin('Q/scroller', 'bind', 'onScroll', updateScroller);
                    var percentage = $.fn.Q_scroller.collection[o.scroller.data('Q_scroller_id')].info.percentage;
                    updateScroller(percentage);
                    $this.data('Q_scroll_indicator_update', updateScroller);
                }
                else if (o.type == 'native')
                {
                    function updateNative()
                    {
                        if (((o.orientation == 'v' && o.scroller.scrollHeight > window.innerHeight) ||
                            (o.orientation == 'h' && o.scroller.scrollWidth > window.innerWidth)) &&
                            (Q.info.platform != 'android' || (Q.info.platform == 'android' && !Q.Layout.androidFixed)))
                        {
                            if ((o.orientation == 'v' && o.scroller.scrollTop <= o.topOffset) ||
                                (o.orientation == 'h' && o.scroller.scrollLeft <= o.topOffset))
                            {
                                if (o.fadeTime)
                                {
                                    startIndicator.fadeOut(o.fadeTime);
                                    endIndicator.fadeIn(o.fadeTime);
                                }
                                else
                                {
                                    startIndicator.hide();
                                    endIndicator.show();
                                }
                            }
                            else if ((o.orientation == 'v' && o.scroller.scrollTop + window.innerHeight >= o.scroller.scrollHeight) ||
                                (o.orientation == 'h' && o.scroller.scrollLeft + window.innerHeight >= o.scroller.scrollWidth))
                            {
                                if (o.fadeTime)
                                {
                                    startIndicator.fadeIn(o.fadeTime);
                                    endIndicator.fadeOut(o.fadeTime);
                                }
                                else
                                {
                                    startIndicator.show();
                                    endIndicator.hide();
                                }
                            }
                            else
                            {
                                if (o.fadeTime)
                                {
                                    startIndicator.fadeIn(o.fadeTime);
                                    endIndicator.fadeIn(o.fadeTime);
                                }
                                else
                                {
                                    startIndicator.show();
                                    endIndicator.show();
                                }
                            }
                        }
                        else
                        {
                            if (o.fadeTime)
                            {
                                startIndicator.fadeOut(o.fadeTime);
                                endIndicator.fadeOut(o.fadeTime);
                            }
                            else
                            {
                                startIndicator.hide();
                                endIndicator.hide();
                            }
                        }
                    }
                    $(window).on('scroll', updateNative);
                    updateNative();
                    $this.data('Q_scroll_indicator_update', updateNative);
                }
            });
        },

        {
            'orientation': 'v',
            'fadeTime': 200,
            'topOffset': 0
        },

        {
            update: function () {
                return this.each(function() {
                    $(this).data('Q_scroll_indicator_update')();
                });
            },

            remove: function () {
                return this.each(function() {
                    $(this).find('.Q_scroll_indicator').remove();
                });
            }
        }

    );

})(Q, Q.$, window, document);
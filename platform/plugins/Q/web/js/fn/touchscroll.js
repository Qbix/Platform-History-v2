(function (Q, $, window, document, undefined) {

/**
 * Q Tools
 * @module Q-tools
 */

/**
 * jQuery plugin for scrolling 'overflow: hidden' containers on touch devices.
 * But it also can be used on desktop devices where mouse events will be used instead of touch events.
 * Supposed to be replacement for iScroll and has similar look, functionality and API.
 * @class Q touchscroll
 * @constructor
 * @param {Mixed} [Object_or_String] Mixed function parameter that could be Object or String
 *   @param {Object} [Object_or_String.Object]
 *	 If an object then it's a hash of options, that can include:
 *	   @param {Number} [Object_or_String.Object.x] Integer which sets initial horizontal scroll position. Optional.
 *	   @default 0
 *	   @param {Number} [Object_or_String.Object.y] Integer which sets initial vertical scroll position. Optional.
 *	   @default 0
 *	   @param {Boolean} [Object_or_String.Object.inertia] Boolean which indicates whether to apply 'intertial scrolling', meaning that after
 *	   releasing the finger while in movement the scrolling will continue with initial finger-given speed
 *	   that is slowly fading down.
 *	   @default true
 *	   @param {String} [Object_or_String.Object.scrollbar] String value which can be either 'inner' or 'outer' determining where to actually place
 *	   scrollbar element in the DOM tree. If the value is 'inner' then scrollbar is appended to the element to which
 *	   plugin is applied. If the value is 'outer' then scrollbar is appended to document.body. Optional.
 *	   @default 'inner'
 *	   @param {Boolean} [Object_or_String.Object.hideScrollbar] Boolean which indicates whether to hide scrollbar when no scrolling occurs.
 *	   @default true.
 *	   @param {Boolean} [Object_or_String.Object.fadeScrollbar] Boolean which indicates whether to fade scrollbars instead of just hiding them.
 *	   Depends on 'hideScrollbar' options and works only it it's true.
 *	   @default true
 *	   @param {Boolean} [Object_or_String.Object.indicators] Boolean which indicates whether to show scroll indicators
 *	   (apply Q/scrollIndicators plugin).
 *	   @default true
 *	   @param {Q.Event}  [Object_or_String.Object.onRefresh]  Q.Event callback which is called when touchscroll('refresh') is called.
 *	   @param {Q.Event} [Object_or_String.Object.onScrollStart] Q.Event callback which is called when scrolling is just started. Optional.
 *	   @param {Q.Event} [Object_or_String.Object.onScrollMove] Q.Event callback which is called when scrolling is in progress (while finger is moving or when inertial scrolling is applied). Optional.
 *	   @param {Q.Event} [Object_or_String.Object.onScrollEnd] Q.Event callback which is called when scrolling is ended. Optional.
 *	   @param {Q.Event} [Object_or_String.Object.onTouchEnd] Q.Event callback which is called when finger is released but scrolling still may continue
 *	   (due to inertial scrolling). Optional.
 *   @param {String} [Object_or_String.String]
 *	 If a string then it's a command and it can have following values:
 *	 "remove": Destroys the plugin so the container won't have touch scrolling functionality anymore.
 *	 "refresh": Refreshes the plugin. Useful then container size is changed to update scrollbar and other stuff.
 *	 "bind": Allows to bind Q.Event handlers to previously described events, such as 'onScrollMove'.
 *					 In this case 'reserved1' is event name and 'reserved2' is a callback function.
 * @param {Mixed} reserved1 varying
 * Some additional parameter in case if 'options' is a command.
 * @param {Mixed} reserved2 varying
 * Some additional parameter in case if 'options' is a command.
 */
Q.Tool.jQuery('Q/touchscroll',

    function _Q_touchscroll(o)
    {

        return this.each(function(index)
        {
            var $this = $(this);
            $this.data('Q_touchscroll_options', o);
            $this.data('Q_touchscroll_previous_overflow', $this.css('overflow'));
            $this.addClass('Q_unselectable').css({ 'overflow': 'hidden' });
            this.scrollTop = o.y;
            this.scrollLeft = o.x;

            var borderWidths = {
                'top': parseInt($this.css('border-top-width')),
                'right': parseInt($this.css('border-right-width')),
                'bottom': parseInt($this.css('border-bottom-width')),
                'left': parseInt($this.css('border-left-width'))
            };
            var thisPos = o.scrollbar == 'inner' ? $this.position() : $this.offset();
            var vScrollbarSpace = this.offsetHeight - borderWidths.top - borderWidths.bottom - 2;
            var hScrollbarSpace = this.offsetWidth - borderWidths.left - borderWidths.right - 2;
            var vScrollbarHeight = Math.floor(this.offsetHeight / this.scrollHeight * vScrollbarSpace);
            var hScrollbarWidth = Math.floor(this.offsetWidth / this.scrollWidth * hScrollbarSpace);
            var vScrollbarTop = thisPos.top + borderWidths.top + 1;
            var vScrollbarLeft = thisPos.left + $this.outerWidth() - borderWidths.right - 6;
            var hScrollbarTop = thisPos.top + $this.outerHeight() - borderWidths.bottom - 6;
            var hScrollbarLeft = thisPos.left + borderWidths.left + 1;
            var vScrollbar = $('<div class="Q_touch_scrollbar_v" />').css({
                'height': vScrollbarHeight + 'px',
                'top': vScrollbarTop + 'px',
                'left': vScrollbarLeft + 'px',
                'opacity': o.hideScrollbar ? '0' : '1'
            });
            var hScrollbar = $('<div class="Q_touch_scrollbar_h" />').css({
                'width': hScrollbarWidth + 'px',
                'top': hScrollbarTop + 'px',
                'left': hScrollbarLeft + 'px',
                'opacity': o.hideScrollbar ? '0' : '1'
            });
            if (this.scrollWidth > this.offsetWidth)
            {
                if (o.scrollbar == 'inner')
                    $this.append(hScrollbar);
                else if (o.scrollbar == 'outer')
                    $(document.body).append(hScrollbar);
                $this.data('Q_touchscroll_scrollbar_h', hScrollbar);
            }
            if (this.scrollHeight > this.offsetHeight)
            {
                if (o.scrollbar == 'inner')
                    $this.append(vScrollbar);
                else if (o.scrollbar == 'outer')
                    $(document.body).append(vScrollbar);
                $this.data('Q_touchscroll_scrollbar_v', vScrollbar);
            }

            var hideScrollbarsTimeout = 0;
            var hideScrollbars = function()
            {
                if (o.hideScrollbar)
                {
                    clearTimeout(hideScrollbarsTimeout);
                    hideScrollbarsTimeout = setTimeout(function()
                    {
                        if (o.fadeScrollbar)
                        {
                            hScrollbar.clearQueue().fadeTo(300, 0);
                            vScrollbar.clearQueue().fadeTo(300, 0);
                        }
                        else
                        {
                            hScrollbar.css({ 'opacity': '0' });
                            vScrollbar.css({ 'opacity': '0' });
                        }
                    }, 500);
                }
            };

            var scrollStartX = 0, scrollStartY = 0, scrollStartPageX = 0, scrollStartPageY = 0;
            var speedX = 0, speedY = 0;
            var curX = 0, curY = 0, curTime = 0, lastX = 0, lastY = 0, lastTime = 0;
            var handleMove = false;
            var scrollResetTimeout = 0;
            var inertiaIntervalKey = 'Q_touchscroll_inertia', speedMeauseIntervalKey = 'Q_touchscroll_speed_measure';
            function setScrollbarPos()
            {
                var elem = $this[0];
                vScrollbar.css({
                    'top': (vScrollbarTop + Math.round(elem.scrollTop / elem.scrollHeight * vScrollbarSpace)) + 'px'
                });
                hScrollbar.css({
                    'left': (hScrollbarLeft + Math.round(elem.scrollLeft / elem.scrollWidth * hScrollbarSpace)) + 'px'
                });
            }
            setScrollbarPos();
            $this.on([Q.Pointer.start, '.Q_touchscroll'], function(e)
            {
                e.preventDefault();

                if (Q.Interval.exists(inertiaIntervalKey))
                    Q.Interval.clear(inertiaIntervalKey);
                if (Q.Interval.exists(speedMeauseIntervalKey))
                    Q.Interval.clear(speedMeauseIntervalKey);
                clearTimeout(hideScrollbarsTimeout);
                handleMove = true;
                e = e.originalEvent.touches ? e.originalEvent.touches[0] : e;
                scrollStartPageX = e.pageX;
                scrollStartPageY = e.pageY;
                scrollStartX = this.scrollLeft + scrollStartPageX;
                scrollStartY = this.scrollTop + scrollStartPageY;
                curX = lastX = this.scrollLeft;
                curY = lastY = this.scrollTop;
                lastTime = (new Date()).getTime();
                speedX = speedY = 0;
                Q.Interval.set(function()
                {
                    curTime = (new Date()).getTime();
                    speedX = (curX - lastX) / (curTime - lastTime) * p.speedFactor;
                    speedY = (curY - lastY) / (curTime - lastTime) * p.speedFactor;
                    lastX = curX;
                    lastY = curY;
                    lastTime = curTime;
                }, 20, speedMeauseIntervalKey);

                hScrollbar.clearQueue().css({ 'opacity': '1' });
                vScrollbar.clearQueue().css({ 'opacity': '1' });

                Q.handle(o.onScrollStart, $this[0], [$this]);
            });
            $this.on(Q.Pointer.move.eventName + '.Q_touchscroll', function(e)
            {
                e.preventDefault();

                if (handleMove)
                {
                    e = e.originalEvent.touches ? e.originalEvent.touches[0] : e;
                    var thisOffset = $this.offset();
                    if (e.pageX < $this.offset().left || e.pageX > $this.offset().left + $this.outerWidth() ||
                        e.pageY < $this.offset().top || e.pageY > $this.offset().top + $this.outerHeight())
                    {
                        $this.data('Q_touchscroll_end_handler')();
                        return;
                    }
                    // strange bug noticed while testing in Chrome: sometimes arrived event contained same coordinates as on 'touchstart'
                    // but they are wrong, namely outdated; maybe it's only in Chrome, but anyway, this is to fix that bug
                    if (e.pageX == scrollStartPageX && e.pageY == scrollStartPageY)
                    {
                        return;
                    }
                    this.scrollLeft = scrollStartX - e.pageX;
                    this.scrollTop = scrollStartY - e.pageY;
                    curX = this.scrollLeft;
                    curY = this.scrollTop;

                    setScrollbarPos();

                    clearTimeout(scrollResetTimeout);
                    scrollResetTimeout = setTimeout(function()
                    {
                        $this.data('Q_touchscroll_end_handler')();
                    }, 2000);

                    hScrollbar.css({ 'opacity': '1' });
                    vScrollbar.css({ 'opacity': '1' });

                    Q.handle(o.onScrollMove, $this[0], [$this]);
                }
            });
            $this.data('Q_touchscroll_end_handler', function() {
                if (handleMove)
                {
                    Q.handle(o.onTouchEnd, $this[0], [$this]);
                    handleMove = false;
                    Q.Interval.clear(speedMeauseIntervalKey);
                    clearTimeout(scrollResetTimeout);
                    if (Math.abs(speedX) > 0.001 || Math.abs(speedY) > 0.001)
                    {
                        scrollStartX = $this[0].scrollLeft;
                        scrollStartY = $this[0].scrollTop;
                        lastTime = (new Date()).getTime();
                        var accelX = (speedX > 0 ? -1 : 1) * p.inertiaAccel;
                        var accelY = (speedY > 0 ? -1 : 1) * p.inertiaAccel;
                        var timeDiff = 0;
                        var xStopped = false, yStopped = false;
                        if (Q.Interval.exists(inertiaIntervalKey))
                            Q.Interval.clear(inertiaIntervalKey);
                        Q.Interval.set(function()
                        {
                            timeDiff = ((new Date()).getTime() - lastTime);

                            if (Math.abs(speedX) - Math.abs(accelX * timeDiff) <= 0)
                                xStopped = true;
                            else
                                $this[0].scrollLeft = scrollStartX + speedX * timeDiff + (accelX * timeDiff * timeDiff) / 2;

                            if (Math.abs(speedY) - Math.abs(accelY * timeDiff) <= 0)
                                yStopped = true;
                            else
                                $this[0].scrollTop = scrollStartY + speedY * timeDiff + (accelY * timeDiff * timeDiff) / 2;

                            setScrollbarPos();

                            hScrollbar.css({ 'opacity': '1' });
                            vScrollbar.css({ 'opacity': '1' });

                            Q.handle(o.onScrollMove, $this[0], [$this]);

                            if (xStopped && yStopped)
                            {
                                Q.Interval.clear(inertiaIntervalKey);
                                speedX = speedY = 0;
                                hideScrollbars();
                                Q.handle(o.onScrollEnd, $this[0], [$this]);
                            }
                        }, 20, inertiaIntervalKey);
                    }
                    else if (o.hideScrollbar)
                    {
                        hideScrollbars();
                        Q.handle(o.onScrollEnd, $this[0], [$this]);
                    }
                }
            });
            $(document.body).on(Q.Pointer.end, $this.data('Q_touchscroll_end_handler'));
            if (!Q.info.isTouchscreen)
            {
                $this.on('mouseleave.Q_touchscroll', function(e)
                {
                    $this.data('Q_touchscroll_end_handler')();
                });
            }

            $this.data('Q_touchscroll_cleaning_func', function()
            {
                if (Q.Interval.exists(inertiaIntervalKey))
                    Q.Interval.clear(inertiaIntervalKey);
                if (Q.Interval.exists(speedMeauseIntervalKey))
                    Q.Interval.clear(speedMeauseIntervalKey);
                clearTimeout(hideScrollbarsTimeout);
                clearTimeout(scrollResetTimeout);
            });

            if (o.indicators)
            {
                $this.plugin('Q/scrollIndicators', {
                    'type': 'touchscroll',
                    'scroller': $this,
                    'orientation': (this.scrollHeight > this.offsetHeight ? 'v' : 'h')
                });
            }
        });
    },

    {
        'x': 0,
        'y': 0,
        'inertia': true,
        'scrollbar': 'inner',
        'hideScrollbar': true,
        'fadeScrollbar': true,
        'indicators': true,
        'onRefresh': new Q.Event(function() {}),
        'onScrollStart': new Q.Event(function() {}),
        'onScrollMove': new Q.Event(function() {}),
        'onScrollEnd': new Q.Event(function() {}),
        'onTouchEnd': new Q.Event(function() {})
    },

    {
        bind: function (reserved1, reserved2) {
            return this.each(function(index)
            {
                var o = $(this).data('Q_touchscroll_options');
                if (reserved1 in o && Q.typeOf(o[reserved1]) == 'Q.Event')
                {
                    o[reserved1].set(reserved2);
                }
            });
        },

        refresh: function (reserved1, reserved2) {

        },

        remove: function (reserved1, reserved2) {
            return this.each(function(index) {
                var $this = $(this);
                if ($this.data('Q_touchscroll_previous_overflow')) {
                    $this.removeClass('Q_unselectable').css({
                        'overflow': $this.data('Q_touchscroll_previous_overflow')
                    });
                }
                if ($this.data('Q_touchscroll_scrollbar_h')) {
                    $this.data('Q_touchscroll_scrollbar_h').remove();
                }
                if ($this.data('Q_touchscroll_scrollbar_v')) {
                    $this.data('Q_touchscroll_scrollbar_v').remove();
                }
                $this.off([Q.Pointer.start, '.Q_touchscroll']);
                $this.off([Q.Pointer.move, '.Q_touchscroll']);
                if ($this.data('Q_touchscroll_end_handler')) {
                    $(document.body).off(Q.Pointer.end, $this.data('Q_touchscroll_end_handler'));
                }
                if ($this.data('Q_touchscroll_cleaning_func')) {
                    $this.data('Q_touchscroll_cleaning_func')();
                }
                $this.removeData(
                    'Q_touchscroll_options Q_touchscroll_previous_overflow Q_touchscroll_scrollbar_h ' +
                        'Q_touchscroll_scrollbar_v Q_touchscroll_end_handler Q_touchscroll_cleaning_func'
                );
                $this.plugin('Q/scrollIndicators', 'remove');
            });
        }
    }

);

var p = {
    speedFactor: 0.5,
    inertiaAccel: 0.0007
}

})(Q, Q.$, window, document);
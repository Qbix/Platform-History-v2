(function (Q, $, window, document, undefined) {

/**
 * Q Tools
 * @module Q-tools
 */

/**
 * Applies 'mousemove' scrolling functionality for some block element container.
 * This algorithm doesn't require any scrollbars and any actions from the user besides (mouse|touch)move over the scrollable element.
 * Contents of the block absolutely arbitrary. When applied, plugin wraps contents into a single 'div' block.
 * @class Q scroller
 * @constructor
 * @param  {Mixed} [Object_or_String] function could have String or Object parameter
 *  @param {Object} [Object_or_String.Object]
 *	 If an Object, then it's a hash of options, that can include:
 *	 @param {Number} [Object_or_String.Object.height] If provided, container height will be restricted to this value. Optional.
 *	 Otherwise container current height will be taken (useful if container already has fixed height and maybe overflow: auto / hidden)
 *	 @param {Boolean} [Object_or_String.Object.startBottom] If true, the scrollable element will be initially scrolled to the bottom of its contents.
 *	 @default false
 *	 @param {Boolean} [Object_or_String.Object.indicators] Whether to show scroll indicators (apply Q/scrollIndicators plugin).
 *	 @default true
 *	 @param {Q.Event} [Object_or_String.Object.onScroll] Q.Event or callback for handling 'onScroll' event.
 * @param {String} [Object_or_String.String]
 *	 If a string, then it's a command which may be:
 *		 "remove": Destroys scroller so it won't function anymore.
 *		 This command may have its own options object passed as reserved1 arg. It can include:
 *			 "restoreOverflow": restores 'overlow' style of the block to the value it has before applying scroller.
 *			 Defaults to true, but sometimes needed to be manually canceled.
 *			 "restoreHeight": restores height of the block to the value it has before applying scroller.
 *			 Defaults to true, but sometimes needed to be manually canceled.
 *			 "unwrap": whether to unwrap scroller contents of the special wrapper that was previously applied to the block
 *			 while applying scroller. Defaults to true, but sometimes needed to be manually canceled.
 *		 "bind": Binds some event handler to the scroller event (i.e. 'onScroll').
 *		 Bind command may must have additional parameters passed as reserved1 and reserved2 args.
 *			 reserved1 string. Name of the event to bind.
 *			 reserved2 function or Q.Event or string function name. Handler to call when the event occurs.
 * @param {Mixed} reserved1 can be any type
 *	 Reserved parameter, can be used differently in different situations.
 *	 For example for passing event type ('on<SomeEvent>') for 'bind' command.
 * @param {Mixed} reserved2 can be any type
 *	 Reserved parameter, can be used differently in different situations.
 *	 For example for passing Q.Event or callback for 'bind' command.
 */
Q.Tool.jQuery("Q/scroller", function _Q_scroller(o) {

        _initScroller(o);

        return this.each(function(index)
        {
            var $this = $(this);

            if (!o.height || (o.height && ($this.height() == 0 || ($this.height() != 0 && $this.height() > o.height))))
            {
                var scroller = { 'container': $this, 'options': o };

                $this.scrollTop(0);
                scroller.height = o.height || parseInt($this.css('height')) || parseInt($this.css('max-height')) || $this.height();
                scroller.prevStyles = {
                    'overflow': $this.css('overflow'),
                    'maxHeight': parseInt($this.css('max-height')) ? $this.css('max-height') : ''
                };
                $this.css({ 'overflow': 'auto', 'max-height': scroller.height });
                $this.children().wrapAll('<div class="Q_scroller_wrapper" />');
                scroller.wrapper = $($this.children('.Q_scroller_wrapper').get(0));

                scroller.info = { 'inited': false, 'borderLeft': 0, 'borderRight': 0, 'borderTop': 0, 'borderBottom': 0,
                    'contWidth': 0, 'contHeight': 0, 'contLeftOffset': 0, 'contTopOffset': 0, 'wrapperHeight': 0, 'wrapperTopOffset': 0,
                    'totalScrollHeight': 0, 'scrollAreaHeight': 0, 'scrollAreaOffset': 0, 'percentage': 0
                };

                if (o.startBottom)
                {
                    scroller.info.percentage = 1;
                    setTimeout(function()
                    {
                        $this.scrollTop(0);
                        scroller.info.wrapperTopOffset = scroller.wrapper.offset().top;
                        if (Q.Browser.detect().engine == 'webkit')
                        {
                            scroller.wrapper.children(':eq(0)').css({
                                '-webkit-transition': '-webkit-transform 0ms',
                                '-webkit-transform-origin': '0px 0px',
                                '-webkit-transform': 'translate3d(0px, -' + (scroller.wrapper.outerHeight() - scroller.height) + 'px, 0px) scale(1)'
                            });
                        }
                        else
                        {
                            scroller.wrapper.css({ 'margin-top': '-' + (scroller.wrapper.outerHeight() - scroller.height) + 'px' });
                        }
                    }, 0);
                }

                var sid = _add(scroller);
                $this.data('Q_scroller_id', sid);

                if (o.indicators)
                {
                    setTimeout(function()
                    {
                        if ($this.data('Q_scroller_id') !== undefined) // this check is needed because scroller can be destroyed until timeout triggered
                            $this.plugin('Q/scrollIndicators', { 'type': 'scroller', 'scroller': $this });
                    }, 0);
                }
            }
        });
    },

    {
        'height': null,
        'eventDelegate': null,
        'startBottom': false,
        'indicators': true,
        'onScroll': new Q.Event(function() {})
    },

    {
        bind: function (reserved1, reserved2) {
            var $this = $(this);
            var sid = $this.data('Q_scroller_id');
            var scroller = p.collection[sid];
            if (scroller && scroller.options) {
                switch (reserved1) {
                    case 'onScroll':
                        if (!scroller.options.onScroll)
                            scroller.options.onScroll = new Q.Event(reserved2);
                        else
                            scroller.options.onScroll.set(reserved2);
                        break;
                }
            }
        },

        remove: function (reserved1, reserved2) {
            var $this = $(this);
            var destroyOptions = Q.extend({
                'restoreOverflow': true,
                'restoreHeight': true,
                'unwrap': true
            }, reserved1);
            var sid = $this.data('Q_scroller_id');
            var scroller = _remove(sid);
            if (scroller) {
                if (destroyOptions.restoreOverflow) {
                    $this.css({ 'overflow': scroller.prevStyles.overflow });
                }
                if (destroyOptions.restoreHeight) {
                    $this.css({ 'max-height': scroller.prevStyles.maxHeight });
                }
                if (destroyOptions.unwrap) {
                    scroller.wrapper.children().unwrap();
                }
                $this.plugin('Q/scrollIndicators', 'remove');
                $this.removeData('Q_scroller_id');
            }
        }
    }


);

var p = {
    inited: false,
    collection: []
};

function _add(scroller)
{
    p.collection.push(scroller);
    return p.collection.length - 1;
}

function _remove(sid)
{
    var col = p.collection;
    var current = col.splice(sid, 1)[0];
    for (var i = 0; i < col.length; i++)
    {
        col[i].container.data('Q_scroller_id', i);
    }
    return current;
}

function _initScroller(o) {
    // creates a closure for _eventHandler to use
    if (!p.inited)
    {
        // WARNING: the way Dima coded this, only the first o.onScroll is ever fired
        // since after that, p.inited becomes true and this never happens:
        $(document.body).on(Q.Pointer.move, _eventHandler);
        p.inited = true;
    }

    function _eventHandler(e)
    {
        var clientX = Q.Pointer.getX(e)
        var clientY = Q.Pointer.getY(e);

        var col = p.collection, container = null, wrapper, info = null, options = null;
        for (var i = 0; i < col.length; i++)
        {
            container = col[i].container;
            wrapper = col[i].wrapper;
            info = col[i].info;
            options = col[i].options;

            if (!info.inited && container.outerWidth() != 0)
            {
                info.borderLeft = parseInt(container.css('border-left-width'));
                info.borderRight = parseInt(container.css('border-right-width'));
                info.borderTop = parseInt(container.css('border-top-width'));
                info.borderBottom = parseInt(container.css('border-bottom-width'));
                info.contWidth = container.outerWidth() - info.borderLeft - info.borderRight;
                info.contHeight = container.outerHeight() - info.borderTop - info.borderBottom;
                info.contLeftOffset = container.offset().left + info.borderLeft;
                info.contTopOffset = container.offset().top + info.borderTop;
                info.wrapperHeight = wrapper.outerHeight() + parseInt(wrapper.children(':last').css('margin-bottom'));
                if (info.wrapperTopOffset == 0)
                    info.wrapperTopOffset = wrapper.offset().top;
                if (Q.info.platform == 'android')
                {
                    info.contTopOffset -= window.scrollY;
                    info.wrapperTopOffset -= window.scrollY;
                }
                info.totalScrollHeight = info.wrapperHeight + (info.wrapperTopOffset - info.contTopOffset)
                    - (info.contHeight - parseInt(container.css('padding-bottom')));
                info.scrollAreaHeight = info.contHeight * 0.8;
                info.scrollAreaOffset = (info.contHeight - info.scrollAreaHeight) / 2;

                info.inited = true;
            }

            if (container.css('display') == 'block' &&
                clientX >= info.contLeftOffset && clientX <= info.contLeftOffset + info.contWidth &&
                clientY >= info.contTopOffset && clientY <= info.contTopOffset + info.contHeight)
            {
                var relativeY = clientY - info.contTopOffset;
                info.scrollPercentage = (relativeY - info.scrollAreaOffset) / info.scrollAreaHeight;
                if (info.scrollPercentage < 0)
                    info.scrollPercentage = 0;
                else if (info.scrollPercentage > 1)
                    info.scrollPercentage = 1;

                if (Q.Browser.detect().engine == 'webkit')
                {
                    wrapper.children(':eq(0)').css({
                        '-webkit-transition': '-webkit-transform 0ms',
                        '-webkit-transform-origin': '0px 0px',
                        '-webkit-transform': 'translate3d(0px, -' + (info.scrollPercentage * info.totalScrollHeight) + 'px, 0px) scale(1)'
                    });
                }
                else
                {
                    wrapper.css({ 'margin-top': '-' + (info.scrollPercentage * info.totalScrollHeight) + 'px' });
                }

                Q.handle(o.onScroll, wrapper, [info.scrollPercentage]);
            }
        }
    };
}

})(Q, Q.$, window, document);

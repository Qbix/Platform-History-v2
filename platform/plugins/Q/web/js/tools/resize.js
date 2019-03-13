(function ($, window, undefined) {
    Streams = Q.Streams;
    /**
     * Q/resize tool.
     * Tool makes possible to resize any element on the page
     * @module Q
     * @class Q resize
     * @constructor
     * @param {Object} options
     *  Hash of possible options
     */
    Q.Tool.define("Q/resize", function(options) {

            var tool = this;
            tool.state = Q.extend({}, tool.state, options);
            this.bindEvents();

        },

        {
            editable: false,
            onCreate: new Q.Event(),
            onUpdate: new Q.Event(),
            onRefresh: new Q.Event()
        },

        {
            bindEvents: function () {
                var tool = this;
                var elementToApply = tool.element;

                var _dragElement = function(){
                    var elementToMove;
                    var posX, posY, divTop, divLeft, eWi, eHe, cWi, cHe, diffX, diffY;
                    var move = function(xpos,ypos){
                        console.log('xpos,ypos', xpos,ypos)
                        elementToMove.style.left = xpos + 'px';
                        elementToMove.style.top = ypos + 'px';
                    }
                    var drag = function(evt){

                        if(Q.info.isMobile && (tool.isScreenResizing || evt.touches.length != 1 || evt.changedTouches.length != 1 || evt.targetTouches.length != 1)) return;

                        evt = evt || window.event;
                        var posX = Q.info.isMobile ? evt.changedTouches[0].clientX : evt.clientX,
                            posY = Q.info.isMobile ? evt.changedTouches[0].clientY : evt.clientY,
                            aX = posX - diffX,
                            aY = posY - diffY;
                        if (aX < 0) aX = 0;
                        if (aY < 0) aY = 0;
                        if (aX + eWi > cWi) aX = cWi - eWi;
                        if (aY + eHe > cHe) aY = cHe -eHe;
                        move(aX,aY);
                    }
                    var initMoving = function(divid,container,evt){
                        if(Q.info.isMobile && (tool.isScreenResizing || evt.targetTouches.length != 1)) return;
                        elementToMove = divid;
                        var elRect = elementToMove.getBoundingClientRect();
                        elementToMove.style.width = elRect.width + 'px';
                        elementToMove.style.height = elRect.height + 'px';
                        elementToMove.style.top = elRect.top + 'px';
                        elementToMove.style.left = elRect.left + 'px';
                        elementToMove.style.transform = '';
                        elementToMove.style.position = 'fixed';
                        evt = evt || window.event;
                        posX = Q.info.isMobile ? evt.touches[0].clientX : evt.clientX,
                            posY = Q.info.isMobile ? evt.touches[0].clientY : evt.clientY,
                            divTop = elementToMove.style.top,
                            divLeft = elementToMove.style.left,
                            eWi = parseInt(elementToMove.offsetWidth),
                            eHe = parseInt(elementToMove.offsetHeight),
                            cWi = parseInt(container.offsetWidth),
                            cHe = parseInt(container.offsetHeight);
                        container.style.cursor='move';
                        divTop = divTop.replace('px','');
                        divLeft = divLeft.replace('px','');
                        diffX = posX - divLeft, diffY = posY - divTop;
                        if(Q.info.isMobile)
                            window.addEventListener('touchmove', drag);
                        else window.addEventListener('mousemove', drag);
                    }
                    var stopMoving = function(container){
                        if(Q.info.isMobile)
                            window.removeEventListener('touchmove', drag)
                        else window.removeEventListener('mousemove', drag)

                        container.style.cursor='';
                    }
                    return {
                        initMoving: initMoving,
                        stopMoving: stopMoving
                    }
                }();

                var resizeElement = function (e) {
                    var docRect = document.body.getBoundingClientRect();
                    var docStyles = window.getComputedStyle(document.body);

                    var _elementToResize;
                    var _handler;
                    var _handlerPosition = 'right';
                    var _elLeftBorder;
                    var _elRightBorder;
                    var _elLeftMargin;
                    var _elRightMargin;
                    var _latestWidthValue;
                    var _latestHeightValue;
                    var _latestScaleValue;
                    var _ratio;

                    var _oldx = null;
                    var _oldy = null;

                    function initialise(e) {
                        e.propertyIsEnumerable();
                        e.stopPropagation();
                        _elementToResize = e.target.parentNode;
                        var elementRect = _elementToResize.getBoundingClientRect();
                        _elLeftBorder = elementRect.left;
                        _elRightBorder = elementRect.right;
                        _elLeftMargin = +(_elementToResize.style.margin || _elementToResize.style.marginLeft).replace('px', '');
                        _elRightMargin = +(_elementToResize.style.margin || _elementToResize.style.marginRight).replace('px', '');
                        _handler = e.target;
                        _ratio = elementRect.width / elementRect.height;

                        window.addEventListener('mousemove', _startResizing, true);
                        window.addEventListener('mouseup', _stopResizing, true);
                    }

                    function _startResizing(e) {

                        if(e.pageX >= docRect.right-(docStyles.paddingRight ? docStyles.paddingRight : '0').replace('px', '')) return;

                        if(_latestWidthValue == null) _latestWidthValue = _elementToResize.offsetWidth;
                        if(_latestHeightValue == null) _latestHeightValue = _elementToResize.offsetHeight;
                        if(_oldx == null) _oldx = e.pageX;
                        if(_oldy == null) _oldy = e.pageY;

                        var elementWidth, elementHeight;

                        if(_handlerPosition == 'right') {
                            console.log('right resize', _latestWidthValue,_latestHeightValue, _oldx, _oldy)
                            if (e.pageX <= _oldx) {
                                elementWidth = _latestWidthValue - (_oldx - e.pageX);
                            } else if (e.pageX > _oldx) {
                                elementWidth = _latestWidthValue + (e.pageX - _oldx);
                            }
                            if (e.pageY <= _oldy) {
                                elementHeight = _latestHeightValue - (_oldy - e.pageY);
                            } else if (e.pageY > _oldy) {
                                elementHeight = _latestHeightValue + (e.pageY - _oldy);
                            }
                        } else {
                            console.log('left resize')
                            if (e.pageX < _oldx) {
                                elementWidth = _latestWidthValue + (_oldx - e.pageX);
                            } else if (e.pageX > _oldx) {
                                elementWidth = _latestWidthValue - (e.pageX - _oldx);
                            }

                            if (e.pageY < _oldy) {
                                elementHeight = _latestHeightValue + (_oldy - e.pageY);
                            } else if (e.pageY > _oldy) {
                                elementHeight = _latestHeightValue - (e.pageY - _oldy);
                            }

                        }

                        if(_ratio < 1) {
                            elementWidth = parseInt(elementHeight * _ratio);

                        }
                        else {
                            elementHeight = parseInt(elementWidth / _ratio);
                        }


                        if(elementWidth <= 50 || elementHeight > document.body.offsetHeight || elementWidth >= document.body.offsetWidth) {
                            return
                        }


                        _elementToResize.style.width = elementWidth + 'px';
                        _elementToResize.style.height = elementHeight + 'px';


                        _latestWidthValue = elementWidth;
                        _latestHeightValue = elementHeight;
                        _oldx = e.pageX;
                        _oldy = e.pageY;


                    }

                    function _stopResizing(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        window.removeEventListener('mousemove', _startResizing, true);
                        window.removeEventListener('mouseup', _stopResizing, true);
                        _latestWidthValue = null;
                        _latestHeightValue = null;
                        _oldx = null;
                        _oldy = null;
                    }

                    function setHandler(element) {
                        if(Q.info.isMobile) {
                            resizeByPinchGesture(element);
                            return;
                        }
                        var resizeHandler = document.createElement('DIV');
                        resizeHandler.classList.add('webrtc_tool_resize-handler');
                        if(_handlerPosition == 'right') {
                            resizeHandler.style.right = '0';
                            resizeHandler.style.cursor = 'nw-resize';
                        } else resizeHandler.style.left = '0';
                        element.appendChild(resizeHandler);

                        bindMouseWheelEvent(element);
                        resizeHandler.addEventListener('mousedown', initialise)

                    }

                    function resizeByPinchGesture(element) {
                        _elementToResize = element;
                        element.addEventListener('touchstart', _startResizingByPinch);
                    }

                    function _startResizingByPinch(e) {
                        console.log('_startResizingByPinch')
                        _elementToResize = e.target;
                        ratio = _elementToResize.offsetWidth / _elementToResize.offsetHeight;
                        window.addEventListener('touchend', _stopResizingByPinch);
                        window.addEventListener('touchmove', resizeByPinch);
                    }

                    function _stopResizingByPinch() {
                        console.log('stopResizing')

                        tool.isScreenResizing = false;
                        touch1 = touch2 = prevPosOfTouch1 = prevPosOfTouch2 = _latestHeightValue = _latestWidthValue = ratio = _elementToResize = null;
                        window.removeEventListener('touchend', _stopResizingByPinch);
                        window.removeEventListener('touchmove', resizeByPinch);
                    }

                    var touch1, touch2, prevPosOfTouch1, prevPosOfTouch2, ratio;
                    function resizeByPinch(e) {

                        if(e.touches.length != 2) return;
                        tool.isScreenResizing = true;

                        var changedTouches = Array.prototype.slice.call(e.changedTouches);
                        for(var i in changedTouches) {
                            var touch = changedTouches[i];
                            if (touch1 != null && touch.identifier == touch1.identifier || (touch1 == null && (touch2 == null || touch.identifier != touch2.identifier))) {
                                touch1 = {identifier: touch.identifier, clientX: touch.clientX, clientY: touch.clientY};
                            }
                            if (touch2 != null && touch.identifier == touch2.identifier || (touch2 == null && (touch1 == null || touch.identifier != touch1.identifier))) {
                                touch2 = {identifier: touch.identifier, clientX: touch.clientX, clientY: touch.clientY};
                            }
                        }

                        var touches = Array.prototype.slice.call(e.touches);
                        for(var i in touches) {
                            var touch = touches[i];
                            if (touch1 != null && touch.identifier == touch1.identifier || (touch1 == null && (touch2 == null || touch.identifier != touch2.identifier))) {
                                touch1 = {identifier: touch.identifier, clientX: touch.clientX, clientY: touch.clientY};
                            }
                            if (touch2 != null && touch.identifier == touch2.identifier || (touch2 == null && (touch1 == null || touch.identifier != touch1.identifier))) {
                                touch2 = {identifier: touch.identifier, clientX: touch.clientX, clientY: touch.clientY};
                            }
                        }

                        if(prevPosOfTouch1 == null) prevPosOfTouch1 = {x:touch1.clientX, y:touch1.clientY}
                        if(prevPosOfTouch2 == null) prevPosOfTouch2 = {x:touch2.clientX, y:touch2.clientY}

                        //if(touch1.clientX >= docRect.right-(docStyles.paddingRight ? docStyles.paddingRight : '0').replace('px', '')) return;
                        var elRect = _elementToResize.getBoundingClientRect();
                        if(_latestWidthValue == null) _latestWidthValue = elRect.width;
                        if(_latestHeightValue == null) _latestHeightValue = elRect.height;

                        var elementRect = _elementToResize.getBoundingClientRect().height;


                        var elementWidth, elementHeight;
                        var touch1diff, touch2diff;

                        touch1diff = Math.abs(prevPosOfTouch1.x - touch1.clientX);
                        touch2diff = Math.abs(prevPosOfTouch2.x - touch2.clientX);

                        if(Math.abs(touch1.clientX - touch2.clientX) > Math.abs(prevPosOfTouch1.x - prevPosOfTouch2.x)) {
                            console.log('ZOOM ++++')

                            elementHeight = _latestHeightValue + Math.abs(touch1.clientX - prevPosOfTouch1.x) + Math.abs(touch2.clientX - prevPosOfTouch2.x);
                            elementWidth = _latestWidthValue + Math.abs(touch1.clientX - prevPosOfTouch1.x) + Math.abs(touch2.clientX - prevPosOfTouch2.x);
                        } else {
                            console.log('ZOOM ----')

                            elementHeight = _latestHeightValue - Math.abs(touch1.clientX - prevPosOfTouch1.x + touch2.clientX - prevPosOfTouch2.x);
                            elementWidth = _latestWidthValue - Math.abs(touch1.clientX - prevPosOfTouch1.x + touch2.clientX - prevPosOfTouch2.x);
                        }

                        if(ratio < 1) {
                            elementWidth = parseInt(elementHeight * ratio);

                        }
                        else {
                            elementHeight = parseInt(elementWidth / ratio);
                        }


                        if(elementWidth <= 50 || elementHeight > document.body.offsetHeight || elementWidth >= document.body.offsetWidth) {
                            return
                        }

                        _elementToResize.style.width = elementWidth + 'px';
                        _elementToResize.style.height = elementHeight + 'px';

                        _latestWidthValue = elementWidth;
                        _latestHeightValue = elementHeight;

                        prevPosOfTouch1.x = touch1.clientX;
                        prevPosOfTouch1.y = touch1.clientY;
                        prevPosOfTouch2.x = touch2.clientX;
                        prevPosOfTouch2.y = touch2.clientY;
                    }

                    function onWheel(e) {
                        //e = e || window.event;
                        //var currentTarget = document.elementFromPoint(e.clientX, e.clientY);
                        if(_elementToResize == null) _elementToResize = e.target;
                        var elRect = _elementToResize.getBoundingClientRect();
                        //if(elRect.height >= window.innerHeight || elRect.width >= window.innerWidth) return;
                        console.log('_elementToResize', _elementToResize)
                        var delta = e.deltaY || e.detail || e.wheelDelta;
                        if(delta < 0 && (elRect.height < 50 || elRect.width < 50)) return


                        if(_latestScaleValue == null) _latestScaleValue = 1;
                        var scale = (delta > 0) ? _latestScaleValue + 0.1 : _latestScaleValue - 0.1
                        var oldWidth = elRect.width;
                        var oldHeight = elRect.height;
                        _elementToResize.style.transform = 'scale(' + scale + ')';

                        var elRect = _elementToResize.getBoundingClientRect();
                        ratio = _elementToResize.offsetWidth / _elementToResize.offsetHeight;

                        if(elRect.height > document.body.offsetHeight || elRect.width >= document.body.offsetWidth) {
                            _elementToResize.style.width = oldWidth + 'px';
                            _elementToResize.style.height = oldHeight + 'px';
                            _elementToResize.style.transform = '';

                            return;
                        }

                        var elRect = _elementToResize.getBoundingClientRect();
                        _elementToResize.style.width = elRect.width + 'px';
                        _elementToResize.style.height = elRect.height + 'px';
                        _elementToResize.style.top = elRect.top + 'px';
                        _elementToResize.style.left = elRect.left + 'px';
                        _elementToResize.style.transform = '';
                        //}, 100);
                        e.preventDefault ? e.preventDefault() : (e.returnValue = false);
                    }

                    function bindMouseWheelEvent(elem) {
                        if (elem.addEventListener) {
                            if ('onwheel' in document) {
                                // IE9+, FF17+, Ch31+
                                elem.addEventListener("wheel", onWheel);
                            } else if ('onmousewheel' in document) {
                                elem.addEventListener("mousewheel", onWheel);
                            } else {
                                elem.addEventListener("MozMousePixelScroll", onWheel);
                            }
                        } else { // IE8-
                            elem.attachEvent("onmousewheel", onWheel);
                        }
                    }



                    return {
                        init:initialise,
                        setHandler:setHandler,
                    }
                }();


                if(Q.info.isMobile) {
                    elementToApply.addEventListener('touchstart', function (e) {
                        _dragElement.initMoving(e.currentTarget, document.body, e)
                    });
                    elementToApply.addEventListener('touchend', function (e) {
                        _dragElement.stopMoving(document.body)
                    });
                } else {
                    elementToApply.addEventListener('mousedown', function (e) {
                        _dragElement.initMoving(e.currentTarget, document.body, e)
                    });
                    elementToApply.addEventListener('mouseup', function (e) {
                        _dragElement.stopMoving(document.body)
                    });


                    elementToApply.addEventListener('mousedown', function (e) {
                        _dragElement.initMoving(e.currentTarget, document.body, e)
                    });
                    elementToApply.addEventListener('mouseup', function (e) {
                        _dragElement.stopMoving(document.body)
                    });
                }

                resizeElement.setHandler(elementToApply);


                (function(e){
                    e.closest = e.closest || function(css){
                        var node = this;

                        while (node) {
                            if (node.matches(css)) return node;
                            else node = node.parentElement;
                        }
                        return null;
                    }
                })(Element.prototype);

            },
        }

    );


})(window.jQuery, window);
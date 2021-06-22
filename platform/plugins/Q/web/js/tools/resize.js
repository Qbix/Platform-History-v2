(function ($, window, undefined) {
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
            this.eventBinding().bind();

            tool.pointerInfo = {
                prevY: 0,
                prevX: 0,
            };

            Q.addStylesheet('{{Q}}/css/resize.css');
        },

        {
            active: false,
            resize: true,
            move: true,
            elementPosition: null,
            snapToSidesOnly: false,
            moveWithinArea: 'parent',
            negativeMoving: false,
            resizeByWheel: true,
            ignoreOnElements: [],
            activateOnElement: null,
            keepRatioBasedOnElement: null,
            appliedRecently: false,
            onMoved: new Q.Event(),
            onResized: new Q.Event(),
            onResizing: new Q.Event(),
            onMovingStart: new Q.Event(),
            onMoving: new Q.Event(),
            onMovingStop: new Q.Event(),
            onUpdate: new Q.Event(),
            onRefresh: new Q.Event(),
            isMoving: false,
        },


        {
            unbindEvents: function () {

            },
            deactivate:function () {
                var tool = this;
                tool.state.active = false;

                var elementToResize = tool.element;
                var elementToMove = tool.state.elementToMove != null ? tool.state.elementToMove : tool.element;

                elementToMove.style.position = '';
                elementToMove.style.top = '';
                elementToMove.style.left = '';

                elementToResize.style.width = '';
                elementToResize.style.height = '';
            },
            getElementToMove: function() {
                var tool = this;
                if(tool.state.elementToMove != null) {
                    var el = tool.element;
                    while ((el = el.parentElement) && !el.classList.contains(tool.state.elementToMove)) ;

                    return el;
                } else return tool.element;

            },
            bindDraggingEvenets: function(){

            },
            snapTo: function(position) {
                var tool = this;

                var elementToMove = tool.state.elementToMove != null ? tool.state.elementToMove : tool.element;

                var moveWithinRect;

                if(typeof tool.state.moveWithinArea == 'object' && tool.state.moveWithinArea.constructor.name == 'DOMRect') {
                    moveWithinRect = tool.state.moveWithinArea;
                } else if(tool.state.moveWithinArea == 'parent') {
                    moveWithinRect = elementToMove.parentElement.getBoundingClientRect();
                } else if(tool.state.moveWithinArea == 'window' || tool.state.moveWithinArea == window) {
                    moveWithinRect = new DOMRect(0, 0, window.innerWidth, window.innerHeight);
                }

                var cHe = moveWithinRect.height;

                if(position == 'top') {
                    if(!elementToMove.classList.contains('Q_resize_snapped_top')) {
                        elementToMove.classList.add('Q_resize_snapped_top');
                        elementToMove.style.position = tool.state.elementPosition;
                        elementToMove.style.top = moveWithinRect.y + 'px';
                    }
                } else if(position == 'bottom') {
                    if(!elementToMove.classList.contains('Q_resize_snapped_bottom')) {
                        elementToMove.classList.add('Q_resize_snapped_bottom');
                        elementToMove.style.position = tool.state.elementPosition;
                        var elHeight = elementToMove.offsetHeight;
                        elementToMove.style.top = ((moveWithinRect.y + moveWithinRect.height) - elHeight) + 'px';
                    }
                } else if(position == 'left') {
                    if(!elementToMove.classList.contains('Q_resize_snapped_left')) {
                        elementToMove.classList.add('Q_resize_snapped_left');
                        elementToMove.style.position = tool.state.elementPosition;
                        elementToMove.style.left = moveWithinRect.x + 'px';
                        var elHeight = elementToMove.offsetHeight;
                        elementToMove.style.top = (cHe / 2) - (elHeight / 2) + 'px';
                    }
                } else if(position == 'right') {
                    if(!elementToMove.classList.contains('Q_resize_snapped_right')) {
                        elementToMove.classList.add('Q_resize_snapped_right');
                        elementToMove.style.position = tool.state.elementPosition;

                        var elHeight = elementToMove.offsetHeight;
                        var elWidth = elementToMove.offsetWidth;
                        elementToMove.style.left = ((moveWithinRect.x + moveWithinRect.width) - elWidth) + 'px';
                        elementToMove.style.top = (cHe / 2) - (elHeight / 2) + 'px';
                    }
                }

                tool.snappedTo = position;

            },
            getContainerRect: function () {
                var tool = this;
                var elementToMove = tool.state.elementToMove != null ? tool.state.elementToMove : tool.element;

                var moveWithinRect;
                if(typeof tool.state.moveWithinArea == 'object' && tool.state.moveWithinArea.constructor.name == 'DOMRect') {
                    moveWithinRect = tool.state.moveWithinArea;
                } else if(tool.state.moveWithinArea == 'parent') {
                    moveWithinRect = elementToMove.parentElement.getBoundingClientRect();
                } else if(tool.state.moveWithinArea == 'window' || tool.state.moveWithinArea == window) {
                    moveWithinRect = new DOMRect(0, 0, window.innerWidth, window.innerHeight);
                }

                return moveWithinRect;
            },
            setContainerRect: function (domRect) {
                var tool = this;
                var elementToMove = tool.state.elementToMove != null ? tool.state.elementToMove : tool.element;
                var elementWidth = parseInt(elementToMove.offsetWidth);
                var elementHeight = parseInt(elementToMove.offsetHeight);

                var moveWithinRect;
                tool.state.moveWithinArea = moveWithinRect = domRect;
                if(tool.state.snapToSidesOnly &&  tool.snappedTo != null){

                    if(tool.snappedTo == 'right') {
                        elementToMove.style.left = ((moveWithinRect.x + moveWithinRect.width) - elementWidth) + 'px';
                    } else if(tool.snappedTo == 'bottom') {
                        elementToMove.style.top = ((moveWithinRect.y + moveWithinRect.height) - elementHeight) + 'px';
                    } else if(tool.snappedTo == 'left') {
                        elementToMove.style.left = moveWithinRect.x + 'px';
                    } else if(tool.snappedTo == 'top') {
                        elementToMove.style.top = moveWithinRect.y + 'px';
                    }
                }
            },
            eventBinding: function () {
                var tool = this;
                var elementToResize = tool.element;
                var elementToMove = tool.state.elementToMove != null ? tool.state.elementToMove : tool.element;
                var activateOnElement = tool.state.activateOnElement != null ? tool.state.activateOnElement : elementToMove;
                var elementComputedStyle = window.getComputedStyle(elementToResize);
                var moveWithinEl = tool.state.moveWithinArea == 'parent' ? elementToMove.parentElement : window;



                var _dragElement = (function (){
                    var posX, posY, divTop, divLeft, eWi, eHe, cWi, cHe, maxX, maxY, diffX, diffY, snappedTo;
                    var moveWithinRect;


                    var move = function(xpos,ypos){
                        var currentTop = parseInt(elementToMove.style.top, 10)
                        var currentLeft = parseInt(elementToMove.style.left, 10)
                        if(tool.state.snapToSidesOnly){
                            if(snappedTo == 'right') {
                                elementToMove.style.top = ypos + 'px';
                                elementToMove.style.left = ((moveWithinRect.x + moveWithinRect.width) - eWi) + 'px';
                            } else if(snappedTo == 'bottom') {
                                elementToMove.style.top = ((moveWithinRect.y + moveWithinRect.height) - eHe) + 'px';
                                elementToMove.style.left = xpos + 'px';
                            } else if(snappedTo == 'left') {
                                elementToMove.style.top = ypos + 'px';
                                elementToMove.style.left = moveWithinRect.x + 'px';
                            } else if(snappedTo == 'top') {
                                elementToMove.style.left = xpos + 'px';
                                elementToMove.style.top = moveWithinRect.y + 'px';
                            }
                        } else {
                            elementToMove.style.left = xpos + 'px';
                            elementToMove.style.top = ypos + 'px';
                        }

                        if(currentTop != parseInt(ypos, 10) || currentLeft != parseInt(xpos, 10) ) tool.state.appliedRecently = true;
                        tool.state.onMoving.handle.call(tool, xpos, ypos);

                    }

                    var drag = function(evt){
                        if(tool.isScreenResizing || (Q.info.isTouchscreen && (tool.isScreenResizing || evt.touches.length != 1 || evt.changedTouches.length != 1 || evt.targetTouches.length != 1))) return;
                        evt = evt || window.event;
                        evt.preventDefault();

                        posX = Q.info.isTouchscreen ? evt.changedTouches[0].clientX : evt.clientX;
                        posY = Q.info.isTouchscreen ? evt.changedTouches[0].clientY : evt.clientY;

                        var aX, aY;

                        if(tool.state.snapToSidesOnly){
                            snapToSides();
                        }

                        aX = posX - diffX;
                        aY = posY - diffY;

                        if (tool.state.negativeMoving == false) {
                            if (aX < 0) aX = 0;
                            if (aY < 0) aY = 0;
                            if (aX + eWi > cWi) aX = cWi - eWi;
                            if (aY + eHe > cHe) aY = cHe - eHe;
                        }

                        move(aX,aY);
                    }

                    var snapToSides = function () {
                        var toggleClass = function (className) {
                            var classesArr = ['Q_resize_snapped_left', 'Q_resize_snapped_top', 'Q_resize_snapped_right', 'Q_resize_snapped_bottom'];
                            for (var c in classesArr) {
                                if(classesArr[c] != className && elementToMove.classList.contains(classesArr[c])) elementToMove.classList.remove(classesArr[c]);
                            }

                            if(className == 'Q_resize_snapped_bottom') {
                                elementToMove.style.top = '';
                                elementToMove.style.bottom = '';
                            } else if(className == 'Q_resize_snapped_right') {
                                elementToMove.style.left = '';
                                elementToMove.style.right = '';
                            } else if(className == 'Q_resize_snapped_top') {
                                elementToMove.style.bottom = '';
                                elementToMove.style.top = '';
                            } else if(className == 'Q_resize_snapped_left') {
                                elementToMove.style.right = '';
                                elementToMove.style.left = '';
                            }

                            elementToMove.style.height = '';
                            elementToMove.style.width = '';

                            elementToMove.classList.add(className);
                            diffY = 0;

                            eWi = parseInt(elementToMove.offsetWidth);
                            eHe = parseInt(elementToMove.offsetHeight);

                        }

                        if(((maxX - posX) < (maxY - posY)) && ((maxX - posX) < posY) && ((maxX - posX) < posX)) {

                            if(snappedTo != 'right') {
                                toggleClass('Q_resize_snapped_right');
                            }
                            snappedTo = 'right';

                        } else if(((maxY - posY) < (maxX - posX)) && ((maxY - posY) < posY) && ((maxY - posY) < posX)) {
                            if(snappedTo != 'bottom') {
                                toggleClass('Q_resize_snapped_bottom');
                            }
                            snappedTo = 'bottom';

                        } else if((posX < (maxX - posX)) && (posX < posY) && (posX < (maxY - posY))) {

                            if(snappedTo != 'left') {
                                toggleClass('Q_resize_snapped_left');
                            }
                            snappedTo = 'left';

                        } else if((posY < (maxX - posX)) && (posY < posX) && (posY < (maxY - posY))) {

                            if(snappedTo != 'top') {
                                toggleClass('Q_resize_snapped_top');
                            }
                            snappedTo = 'top';

                        }

                        tool.snappedTo = snappedTo;
                    }

                    var initMoving = function(evt){
                        if(tool.state.ignoreOnElements.length != 0) {
                            var ignoreEls = tool.state.ignoreOnElements;
                            for(var e in ignoreEls) {
                                if ((/*(evt.type != "mousemove" && evt.type != "touchmove") && */(evt.target == ignoreEls[e] || ignoreEls[e].contains(evt.target)))
                                    || (evt.target.nodeName == 'INPUT' && evt.target.type == 'text')) {
                                    return;
                                }
                            }
                        }

                        if(!tool.state.active || evt.button == 1 || evt.button == 2) return;

                        if(tool.isScreenResizing || (Q.info.isTouchscreen && (tool.isScreenResizing || evt.targetTouches.length != 1))) return;

                        tool.state.isMoving = true;

                        var elRect = elementToMove.getBoundingClientRect();
                        if(elementToMove == elementToResize) {
                            elementToMove.style.width = elRect.width + 'px';
                            elementToMove.style.height = elRect.height + 'px';
                        }
                        var elementPosition = tool.state.elementPosition ? tool.state.elementPosition : 'absolute';

                        elementPosition = elementPosition != '' && elementPosition != null ? elementPosition : elementComputedStyle.position;
                        if(elementPosition == 'fixed'){
                            elementToMove.style.top = elRect.top + 'px';
                            elementToMove.style.left = elRect.left + 'px';
                        } else if (elementPosition == 'absolute' || elementPosition == 'relative' || elementPosition == 'static') {
                            elementToMove.style.top = elementToMove.offsetTop + 'px';
                            elementToMove.style.left = elementToMove.offsetLeft + 'px';
                        }

                        elementToMove.style.transform = '';
                        elementToMove.style.position = tool.state.elementPosition ? tool.state.elementPosition : 'absolute';
                        elementToMove.style.cursor = 'grabbing';
                        if(tool.state.showShadow) tool.element.style.boxShadow = '10px -10px 60px 0 rgba(0,0,0,0.5)';

                        evt = evt || window.event;

                        moveWithinRect = tool.getContainerRect();


                        //var moveWithinEl = tool.state.moveWithinArea == 'parent' ? elementToMove.parentElement : window;

                        posX = Q.info.isTouchscreen ? evt.touches[0].clientX : evt.clientX,
                            posY = Q.info.isTouchscreen ? evt.touches[0].clientY : evt.clientY,
                            divTop = elementToMove.offsetTop,
                            divLeft = elementToMove.offsetLeft,
                            eWi = parseInt(elementToMove.offsetWidth),
                            eHe = parseInt(elementToMove.offsetHeight),
                            cWi = moveWithinRect.width,
                            cHe = moveWithinRect.height;
                            maxX = moveWithinRect.x + moveWithinRect.width;
                            maxY = moveWithinRect.y + moveWithinRect.height;
                        diffX = posX - divLeft, diffY = posY - divTop;

                        tool.state.onMovingStart.handle.call(tool);

                        if(Q.info.isTouchscreen) {
                            window.addEventListener('touchmove', drag, { passive: false });
                        } else window.addEventListener('mousemove', drag, { passive: false });
                    }

                    var stopMoving = function(e){
                        if(Q.info.isTouchscreen) {
                            window.removeEventListener('touchmove', drag, { passive: false });
                        } else window.removeEventListener('mousemove', drag, { passive: false });

                        if(elementToMove != null) elementToMove.style.cursor='';

                        if(tool.state.showShadow) tool.element.style.boxShadow = '';

                        tool.state.onMovingStop.handle.call(tool);
                        tool.state.isMoving = false;
                        if (tool.state.appliedRecently) {
                            tool.state.onMoved.handle.call(tool);

                            setTimeout(function () {
                                tool.state.appliedRecently = false;
                            }, 200)
                        }

                    }

                    return {
                        initMoving: initMoving,
                        stopMoving: stopMoving
                    }
                }())


                var resizeElement = (function (e) {
                    var docRect = document.body.getBoundingClientRect();
                    var docStyles = window.getComputedStyle(document.body);
                    var minimumSize = 100;

                    var _elementToResize;
                    var _elementToMove;
                    var _handler;
                    var _handlerPosition;
                    var _centerPosition;
                    var _centerPositionFromTop;
                    var _elementPosition;
                    var _latestWidthValue;
                    var _latestHeightValue;
                    var _latestScaleValue;
                    var _ratio;
                    var _resetInitPosTimeout

                    var originalWidth = 0;
                    var originalHeight = 0;
                    var originalX = 0;
                    var originalY = 0;
                    var originalMouseX = 0;
                    var originalMouseY = 0;
                    function initialise(e) {
                        if(!tool.state.active || e.button == 1 || e.button == 2) return;
                        e.propertyIsEnumerable();
                        e.stopPropagation();
                        _handlerPosition = e.target.dataset.position;
                        if(_handlerPosition == null) _handlerPosition = 'bottomright';
                        _elementToResize = e.target.parentNode;
                        _elementPosition = _elementToResize.style.position;
                        var elementRect = _elementToResize.getBoundingClientRect();

                        if(_elementPosition == 'fixed'){
                            _centerPosition = elementRect.left + elementRect.width / 2;
                        } else if (_elementPosition == 'absolute') {
                            _centerPosition = _elementToResize.offsetLeft + elementRect.width / 2;
                        }

                        if(_elementPosition == 'fixed'){
                            _centerPositionFromTop = elementRect.top + elementRect.height / 2;
                        } else if (_elementPosition == 'absolute') {
                            _centerPositionFromTop = _elementToResize.offsetTop + elementRect.height / 2;
                        }

                        _handler = e.target;

                        originalWidth = parseFloat(getComputedStyle(_elementToResize, null).getPropertyValue('width').replace('px', ''));
                        originalHeight = parseFloat(getComputedStyle(_elementToResize, null).getPropertyValue('height').replace('px', ''));
                        originalX = tool.state.moveWithinArea == 'parent' ? _elementToResize.offsetLeft : _elementToResize.getBoundingClientRect().left;
                        originalY = tool.state.moveWithinArea == 'parent' ? _elementToResize.offsetTop : _elementToResize.getBoundingClientRect().top;
                        originalMouseX = e.pageX;
                        originalMouseY = e.pageY;

                        tool.isScreenResizing = true;
                        window.addEventListener('mousemove', _startResizing);
                        window.addEventListener('mouseup', _stopResizing);
                    }

                    function keepRatio(width, height){
                        //var width, height;
                        if(tool.state.keepRatioBasedOnElement != null) {
                            var baseEl = tool.state.keepRatioBasedOnElement;
                            var srcWidth = baseEl.videoWidth;
                            var srcHeight = baseEl.videoHeight;
                            var ratio = srcWidth / srcHeight;


                            if(ratio < 1) {
                                width = Math.floor(height * ratio);
                            } else {
                                var newElHeight = Math.floor(width / ratio);
                                height = newElHeight + 50;
                            }
                        } else {
                            if(_ratio < 1) {
                                width = Math.floor(height * _ratio);

                            }
                            else {
                                height = Math.floor(width / _ratio);
                            }
                        }

                        return {width:width, height:height};
                    }

                    function isNearEdges(pageX, pageY) {


                        if(pageX <= 0 || pageX >= document.body.offsetWidth || pageY <= 0 || pageY >= document.body.offsetHeight) {
                            return true;
                        }

                        return false;
                    }

                    function _startResizing(e) {

                        if(e.pageX >= docRect.right-(docStyles.paddingRight ? docStyles.paddingRight : '0').replace('px', '')) return;

                        var elementRect = _elementToResize.getBoundingClientRect();
                        if(_ratio == null) _ratio = elementRect.width / elementRect.height;

                        let width, height;
                        if(isNearEdges(e.pageX, e.pageY)) return;
                        if(_handlerPosition == 'bottomright') {
                            width = originalWidth + (e.pageX - originalMouseX);
                            height = originalHeight + (e.pageY - originalMouseY)

                            let newSize = keepRatio(width, height);
                            width = newSize.width;
                            height = newSize.height;

                            if (width > minimumSize) {
                                _elementToResize.style.width = width + 'px'
                            }
                            if (height > minimumSize) {
                                _elementToResize.style.height = height + 'px'
                            }
                            tool.state.onResizing.handle.call(tool, width, height);

                        } else if(_handlerPosition == 'bottomleft') {
                            height = originalHeight + (e.pageY - originalMouseY)
                            width = originalWidth - (e.pageX - originalMouseX)

                            let newSize = keepRatio(width, height);
                            width = newSize.width;
                            height = newSize.height;

                            if (height > minimumSize) {
                                _elementToResize.style.height = height + 'px'
                            }
                            let leftPos = null;
                            if (width > minimumSize) {
                                leftPos = originalX + (e.pageX - originalMouseX);
                                _elementToResize.style.width = width + 'px'
                                _elementToResize.style.left = leftPos + 'px'
                            }
                            //tool.state.onMoving.handle.call(tool, leftPos, null);
                            tool.state.onResizing.handle.call(tool, width, height, leftPos, null);

                        } else if(_handlerPosition == 'topright') {
                            width = originalWidth + (e.pageX - originalMouseX)
                            height = originalHeight - (e.pageY - originalMouseY)

                            let newSize = keepRatio(width, height);
                            width = newSize.width;
                            height = newSize.height;

                            if (width > minimumSize) {
                                _elementToResize.style.width = width + 'px'
                            }
                            let topPos = null;
                            if (height > minimumSize) {
                                topPos = originalY + originalHeight - height;
                                _elementToResize.style.height = height + 'px'
                                _elementToResize.style.top = topPos + 'px'
                            }
                            //tool.state.onMoving.handle.call(tool, null, topPos);
                            tool.state.onResizing.handle.call(tool, width, height, null, topPos);


                        } else {
                            width = originalWidth - (e.pageX - originalMouseX)
                            height = originalHeight - (e.pageY - originalMouseY)

                            let newSize = keepRatio(width, height);
                            width = newSize.width;
                            height = newSize.height;

                            let leftPos = null;
                            let topPos = null;
                            if (width > minimumSize) {
                                leftPos = originalX + (e.pageX - originalMouseX);
                                _elementToResize.style.width = width + 'px'
                                _elementToResize.style.left = leftPos + 'px'
                            }
                            if (height > minimumSize) {
                                topPos = originalY + originalHeight - height;
                                _elementToResize.style.height = height + 'px'
                                _elementToResize.style.top = topPos + 'px'
                            }
                            //tool.state.onMoving.handle.call(tool, leftPos, topPos);
                            tool.state.onResizing.handle.call(tool, width, height, leftPos, topPos);

                        }

                        tool.state.appliedRecently = true;

                    }

                    function _stopResizing(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        window.removeEventListener('mousemove', _startResizing);
                        window.removeEventListener('mouseup', _stopResizing);
                        _ratio = null;
                        tool.isScreenResizing = false;

                        if(tool.state.appliedRecently) {
                            tool.state.onResized.handle.call(tool);
                            setTimeout(function () {
                                tool.state.appliedRecently = false;
                            }, 200)
                        }
                    }

                    function setHandler(element) {
                        if(Q.info.isTouchscreen) {
                            resizeByPinchGesture(element);
                            return;
                        }
                        var resizeHandler = document.createElement('DIV');
                        resizeHandler.classList.add('Q_resize_resize-handler');
                        resizeHandler.style.right = '0';
                        resizeHandler.style.cursor = 'nwse-resize';
                        resizeHandler.dataset.position = 'bottomright';
                        element.appendChild(resizeHandler);

                        var leftBottomHandler = document.createElement('DIV');
                        leftBottomHandler.classList.add('Q_resize_resize-handler');
                        leftBottomHandler.style.cursor = 'nesw-resize';
                        leftBottomHandler.style.left = '0';
                        leftBottomHandler.dataset.position = 'bottomleft';
                        element.appendChild(leftBottomHandler);

                        var topRightHandler = document.createElement('DIV');
                        topRightHandler.classList.add('Q_resize_resize-handler');
                        topRightHandler.style.cursor = 'nesw-resize';
                        topRightHandler.style.right = '0';
                        topRightHandler.style.top = '0';
                        topRightHandler.dataset.position = 'topright';
                        element.appendChild(topRightHandler);

                        var topLeftHandler = document.createElement('DIV');
                        topLeftHandler.classList.add('Q_resize_resize-handler');
                        topLeftHandler.style.cursor = 'nwse-resize';
                        topLeftHandler.style.left = '0';
                        topLeftHandler.style.top = '0';
                        topLeftHandler.dataset.position = 'topleft';
                        element.appendChild(topLeftHandler);

                        if(tool.state.resizeByWheel) bindMouseWheelEvent(element);
                        Q.addEventListener(resizeHandler, 'mousedown', initialise);
                        Q.addEventListener(leftBottomHandler, 'mousedown', initialise);
                        Q.addEventListener(topRightHandler, 'mousedown', initialise);
                        Q.addEventListener(topLeftHandler, 'mousedown', initialise);

                    }

                    function resizeByPinchGesture(element) {
                        _elementToResize = element;

                        Q.addEventListener(element, 'touchstart', function (e) {
                            _startResizingByPinch(e);
                        });
                    }

                    var currentActiveTouches = 0;
                    function _startResizingByPinch(e) {
                        _elementPosition = _elementToResize.style.position;
                        var elementRect = _elementToResize.getBoundingClientRect();

                        if(_elementPosition == 'fixed'){
                            _centerPosition = elementRect.left + elementRect.width / 2;
                        } else if (_elementPosition == 'absolute') {
                            _centerPosition = _elementToResize.offsetLeft + elementRect.width / 2;
                        }

                        if(_elementPosition == 'fixed'){
                            _centerPositionFromTop = elementRect.top + elementRect.height / 2;
                        } else if (_elementPosition == 'absolute') {
                            _centerPositionFromTop = _elementToResize.offsetTop + elementRect.height / 2;
                        }
                        currentActiveTouches = e.touches.length;
                        ratio = _elementToResize.offsetWidth / _elementToResize.offsetHeight;
                        window.addEventListener('touchend', _stopResizingByPinch);
                        window.addEventListener('touchmove', resizeByPinch);
                    }

                    function _stopResizingByPinch(e) {
                        if(currentActiveTouches != e.changedTouches.length) {
                            currentActiveTouches = currentActiveTouches - e.changedTouches.length;
                            return;
                        }
                        currentActiveTouches = 0;
                        touch1 = touch2 = prevPosOfTouch1 = prevPosOfTouch2 = _latestHeightValue = _latestWidthValue = ratio = null;
                        window.removeEventListener('touchend', _stopResizingByPinch);
                        window.removeEventListener('touchmove', resizeByPinch);
                        tool.state.onMoved.handle.call(tool);
                        tool.isScreenResizing = false;
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

                        if(prevPosOfTouch1 == null) prevPosOfTouch1 = {x:touch1.clientX, y:touch1.clientY, moveDist: 0};
                        if(prevPosOfTouch2 == null) prevPosOfTouch2 = {x:touch2.clientX, y:touch2.clientY, moveDist: 0};

                        //if(touch1.clientX >= docRect.right-(docStyles.paddingRight ? docStyles.paddingRight : '0').replace('px', '')) return;
                        var elRect = _elementToResize.getBoundingClientRect();
                        if(_latestWidthValue == null) _latestWidthValue = elRect.width;
                        if(_latestHeightValue == null) _latestHeightValue = elRect.height;

                        var elementRect = _elementToResize.getBoundingClientRect().height;


                        var elementWidth, elementHeight;
                        var touch1diff, touch2diff;

                        touch1diff = Math.abs(prevPosOfTouch1.x - touch1.clientX);
                        touch2diff = Math.abs(prevPosOfTouch2.x - touch2.clientX);

                        var xDiff = (touch1.clientX - prevPosOfTouch1.x);
                        var yDiff = (touch1.clientY - prevPosOfTouch1.y);

                        var xDiff2 = (touch2.clientX - prevPosOfTouch2.x);
                        var yDiff2 = (touch2.clientY - prevPosOfTouch2.y);
                        var distance1 = Math.sqrt( xDiff*xDiff + yDiff*yDiff );
                        var distance2 = Math.sqrt( xDiff2*xDiff2 + yDiff2*yDiff2 );

                        var distBetwFingers = Math.sqrt( (touch1.clientX - touch2.clientX)*(touch1.clientX - touch2.clientX) + (touch1.clientY - touch2.clientY)*(touch1.clientY - touch2.clientY) )
                        var prevdistBetwFingers = Math.sqrt( (prevPosOfTouch1.x - prevPosOfTouch2.x)*(prevPosOfTouch1.x - prevPosOfTouch2.x) + (prevPosOfTouch1.y - prevPosOfTouch2.y)*(prevPosOfTouch1.y - prevPosOfTouch2.y) )

                        if(distBetwFingers > prevdistBetwFingers) {
                            elementHeight = _latestHeightValue + (distance1 + distance2);
                            elementWidth = _latestWidthValue + (distance1 + distance2);
                        } else {
                            elementHeight = _latestHeightValue - (distance1 + distance2);
                            elementWidth = _latestWidthValue - (distance1 + distance2);
                        }

                        if(ratio < 1) {
                            elementWidth = parseInt(elementHeight * ratio);

                        }
                        else {
                            elementHeight = parseInt(elementWidth / ratio);
                        }


                        if(elementWidth <= minimumSize || elementHeight <= minimumSize || elementHeight > document.body.offsetHeight || elementWidth >= document.body.offsetWidth) {
                            return;
                        }

                        if(_elementPosition == 'fixed' || _elementPosition == 'absolute') {
                            _elementToResize.style.left = _centerPosition - (elementWidth / 2) + 'px';
                            _elementToResize.style.top = _centerPositionFromTop - (elementHeight / 2) + 'px';
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
                        if(!tool.state.active) return;
                        _elementToMove = tool.state.elementToMove != null ? tool.state.elementToMove : tool.element;
                        var elRect = _elementToMove.getBoundingClientRect();
                        var elementPosition = elementToMove.style.position;
                        if(_centerPosition == null) {
                            if(elementPosition == 'fixed'){
                                _centerPosition = elRect.left + elRect.width / 2;
                            } else if (elementPosition == 'absolute') {
                                _centerPosition = _elementToMove.offsetLeft + elRect.width / 2;
                            }
                        }
                        if(_centerPositionFromTop == null){
                            if(elementPosition == 'fixed'){
                                _centerPositionFromTop = elRect.top + elRect.height / 2;
                            } else if (elementPosition == 'absolute') {
                                _centerPositionFromTop = _elementToMove.offsetTop + elRect.height / 2;
                            }

                        }
                        //e = e || window.event;
                        //var currentTarget = document.elementFromPoint(e.clientX, e.clientY);
                        //if(_elementToResize == null) _elementToResize = e.target;
                        var elRect = _elementToResize.getBoundingClientRect();
                        //if(elRect.height >= window.innerHeight || elRect.width >= window.innerWidth) return;
                        var delta = e.deltaY || e.detail || e.wheelDelta;
                        if(delta < 0 && (elRect.height < minimumSize || elRect.width < minimumSize)) return


                        if(_latestScaleValue == null) _latestScaleValue = 1;
                        var scale = (delta > 0) ? _latestScaleValue + 0.1 : _latestScaleValue - 0.1;


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
                        if(elementPosition == 'fixed' || elementPosition == 'absolute') {
                            elementToMove.style.left = _centerPosition - (elRect.width / 2) + 'px';
                            elementToMove.style.top = _centerPositionFromTop - (elRect.height / 2) + 'px';
                        }

                        var elementWidth = Math.floor(elRect.width);
                        var elementHeight = Math.floor(elRect.height);
                        if(tool.state.keepRatioBasedOnElement != null) {
                            var baseEl = tool.state.keepRatioBasedOnElement;
                            var srcWidth = baseEl.videoWidth;
                            var srcHeight = baseEl.videoHeight;
                            var ratio = srcWidth / srcHeight;

                            if(ratio < 1) {
                                elementWidth = Math.floor(elementHeight * ratio);
                            } else {
                                var newElHeight = Math.floor(elementWidth / ratio);
                                elementHeight = newElHeight + 50;

                            }
                        }

                        _elementToResize.style.width = elementWidth + 'px';
                        _elementToResize.style.height = elementHeight + 'px';
                        _elementToResize.style.top = elRect.top + 'px';
                        _elementToResize.style.left = elRect.left + 'px';
                        _elementToResize.style.transform = '';
                        //}, 100);
                        e.preventDefault ? e.preventDefault() : (e.returnValue = false);

                        if(_resetInitPosTimeout != null) {
                            clearTimeout(_resetInitPosTimeout);
                            _resetInitPosTimeout = null
                        }
                        _resetInitPosTimeout = setTimeout(function () {
                            _centerPosition = null;
                            _centerPositionFromTop = null;
                            tool.state.onMoved.handle.call(tool);
                        }, 1000)
                    }

                    function bindMouseWheelEvent(elem) {
                        _elementToResize = elem;
                        if (elem.addEventListener) {
                            if ('onwheel' in document) {
                                // IE9+, FF17+, Ch31+
                                elem.addEventListener("wheel", onWheel);
                            } else if ('onmousewheel' in document) {
                                elem.addEventListener("mousewheel", onWheel);
                            } else {
                                elem.addEventListener("MozMousePixelScroll", onWheel);
                            }
                        } else { // IE8-Q.addEventListener
                            elem.attachEvent("onmousewheel", onWheel);
                        }
                    }



                    return {
                        init:initialise,
                        setHandler:setHandler,
                    }
                })();

                function distance(x1,y1,x2,y2) {
                    return Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
                }
                function capturePointer(e) {
                    if (e.type == 'touchstart' || e.type == 'mousedown') {
                        tool.pointerInfo.mouseIsPressed = true;
                        tool.pointerInfo.startX = Q.info.isTouchscreen ? e.touches[0].clientX : e.clientX;
                        tool.pointerInfo.startY = Q.info.isTouchscreen ? e.touches[0].clientY : e.clientY;
                        return;
                    }

                    if (e.type == 'touchmove' || e.type == 'mousemove') {
                        tool.pointerInfo.prevX = Q.info.isTouchscreen ? e.changedTouches[0].clientX : e.clientX;
                        tool.pointerInfo.prevY = Q.info.isTouchscreen ? e.changedTouches[0].clientY : e.clientY;
                        return;
                    }

                    if (e.type == 'touchend' || e.type == 'mouseup') {
                        tool.pointerInfo.mouseIsPressed = false;
                        tool.pointerInfo.endX = Q.info.isTouchscreen ? e.changedTouches[0].clientX : e.clientX;
                        tool.pointerInfo.endY = Q.info.isTouchscreen ? e.changedTouches[0].clientY : e.clientY;
                        return;
                    }

                }

                return {
                    bind: function () {

                        Q.addEventListener(activateOnElement, Q.Pointer.start, function (e) {
                            capturePointer(e);
                            Q.addEventListener(window, Q.Pointer.move, capturePointer);
                            Q.addEventListener(window, Q.Pointer.end, function (e) {
                                capturePointer(e);
                                Q.removeEventListener(window, Q.Pointer.move, capturePointer);
                            });
                        });


                        if(tool.state.move) {

                            Q.addEventListener(activateOnElement, Q.Pointer.move, function (e) {
                                if(!tool.state.isMoving && tool.pointerInfo.mouseIsPressed && distance(tool.pointerInfo.startX, tool.pointerInfo.startY, tool.pointerInfo.prevX, tool.pointerInfo.prevY) > 10){
                                    _dragElement.initMoving(e);
                                }
                            });
                            Q.addEventListener(window, Q.Pointer.end, _dragElement.stopMoving, true, true);
                        }


                        if(tool.state.resize) {
                            resizeElement.setHandler(elementToResize);
                        }
                    }
                }
            },
        }

    );

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

})(window.jQuery, window);
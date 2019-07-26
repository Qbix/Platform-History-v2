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
			this.eventBinding().bind();

			Q.addStylesheet('{{Q}}/css/resize.css');

		},

		{
			active: false,
			elementPosition: null,
			snapToSidesOnly: false,
			resizeByWheel: true,
			activateOnElement: null,
			keepRatioBasedOnElement: null,
			appliedRecently: false,
			onMoved: new Q.Event(),
			onResized: new Q.Event(),
			onMovingStart: new Q.Event(),
			onMovingStop: new Q.Event(),
			onUpdate: new Q.Event(),
			onRefresh: new Q.Event()
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
			eventBinding: function () {
				var tool = this;
				var elementToResize = tool.element;
				var elementToMove = tool.state.elementToMove != null ? tool.state.elementToMove : tool.element;
				var activateOnElement = tool.state.activateOnElement != null ? tool.state.activateOnElement : elementToMove;
				var elementComputedStyle = window.getComputedStyle(elementToResize);
				var moveWithinEl = document.body;

				var _dragElement = (function (){
					var posX, posY, divTop, divLeft, eWi, eHe, cWi, cHe, diffX, diffY, snappedTo;

					var move = function(xpos,ypos){
						var currentTop = parseInt(elementToMove.style.top, 10)
						var currentLeft = parseInt(elementToMove.style.left, 10)
						elementToMove.style.left = xpos + 'px';
						elementToMove.style.top = ypos + 'px';

						if(currentTop != parseInt(ypos, 10) || currentLeft != parseInt(xpos, 10) ) tool.state.appliedRecently = true;
						if(typeof cordova != "undefined" && window.device.platform === 'iOS') cordova.plugins.iosrtc.refreshVideos();
					}

					var drag = function(evt){
						if(Q.info.isTouchscreen && (tool.isScreenResizing || evt.touches.length != 1 || evt.changedTouches.length != 1 || evt.targetTouches.length != 1)) return;

						evt = evt || window.event;
						evt.preventDefault();

						var posX = Q.info.isTouchscreen ? evt.changedTouches[0].clientX : evt.clientX;
						var	posY = Q.info.isTouchscreen ? evt.changedTouches[0].clientY : evt.clientY;
						var aX, aY;
						if(!Q.info.isMobile && tool.state.snapToSidesOnly){
							var toggleClass = function (className) {
								var classesArr = ['Q_resize_snapped_left', 'Q_resize_snapped_top', 'Q_resize_snapped_right', 'Q_resize_snapped_bottom'];
								for (var c in classesArr) {
									if(elementToMove.classList.contains(classesArr[c])) elementToMove.classList.remove(classesArr[c]);
								}
								elementToMove.style.width = '';
								elementToMove.style.height = '';
								elementToMove.style.bottom = 'auto';
								elementToMove.classList.add(className);

								divTop = elementToMove.style.top,
									divLeft = elementToMove.style.left,
									eWi = parseInt(elementToMove.offsetWidth),
									eHe = parseInt(elementToMove.offsetHeight),
									cWi = parseInt(moveWithinEl.offsetWidth),
									cHe = parseInt(moveWithinEl.offsetHeight);
								divTop = divTop.replace('px','');
								divLeft = divLeft.replace('px','');
								diffX = posX - divLeft, diffY = posY - divTop;
							}

							if(((cWi - posX) < (cHe - posY)) && ((cWi - posX) < posY) && ((cWi - posX) < posX)) {
								aX = cWi - eWi
								aY = posY - diffY;
								if(snappedTo != 'right') {
									toggleClass('Q_resize_snapped_right');
								}
								snappedTo = 'right';
							} else if(((cHe - posY) < (cWi - posX)) && ((cHe - posY) < posY) && ((cHe - posY) < posX)) {
								aX = posX - diffX;
								aY = cHe - eHe;
								if(snappedTo != 'bottom') {
									toggleClass('Q_resize_snapped_bottom');
								}
								snappedTo = 'bottom';
							} else if((posX < (cWi - posX)) && (posX < posY) && (posX < (cHe - posY))) {
								aX = 0;
								aY = posY - diffY;
								if(snappedTo != 'left') {
									toggleClass('Q_resize_snapped_left');
								}
								snappedTo = 'left';

							} else if((posY < (cWi - posX)) && (posY < posX) && (posY < (cHe - posY))) {
								aX = posX - diffX;
								aY = 0;
								if(snappedTo != 'top') {
									toggleClass('Q_resize_snapped_top');
								}
								snappedTo = 'top';

							}
						} else {
							aX = posX - diffX;
							aY = posY - diffY;
						}
						if (aX < 0) aX = 0;
						if (aY < 0) aY = 0;
						if (aX + eWi > cWi) aX = cWi - eWi;

						if (aY + eHe > cHe) aY = cHe - eHe;
						move(aX,aY);
					}

					var initMoving = function(evt){

						if(!tool.state.active || evt.button == 1 || evt.button == 2) return;

						if(!tool.state.movable || (Q.info.isTouchscreen && (tool.isScreenResizing || evt.targetTouches.length != 1))) return;
						var elRect = elementToMove.getBoundingClientRect();
						if(elementToMove == elementToResize) {
							elementToMove.style.width = elRect.width + 'px';
							elementToMove.style.height = elRect.height + 'px';
						}
						var elementPosition = elementToMove.style.position;

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
						tool.element.style.boxShadow = '10px -10px 60px 0 rgba(0,0,0,0.5)';

						evt = evt || window.event;
						posX = Q.info.isTouchscreen ? evt.touches[0].clientX : evt.clientX,
							posY = Q.info.isTouchscreen ? evt.touches[0].clientY : evt.clientY,
							divTop = elementToMove.style.top,
							divLeft = elementToMove.style.left,
							eWi = parseInt(elementToMove.offsetWidth),
							eHe = parseInt(elementToMove.offsetHeight),
							cWi = parseInt(moveWithinEl.offsetWidth),
							cHe = parseInt(moveWithinEl.offsetHeight);
						divTop = divTop.replace('px','');
						divLeft = divLeft.replace('px','');
						diffX = posX - divLeft, diffY = posY - divTop;

						tool.state.onMovingStart.handle.call(tool);
						if(Q.info.isTouchscreen) {
							window.addEventListener('touchmove', drag, { passive: false });
						} else window.addEventListener('mousemove', drag, { passive: false });
					}

					var stopMoving = function(container){
						console.log('stopMoving')
						if(Q.info.isTouchscreen) {
							window.removeEventListener('touchmove', drag, { passive: false });
						} else window.removeEventListener('mousemove', drag, { passive: false });

						if(elementToMove != null) elementToMove.style.cursor='';

						tool.element.style.boxShadow = '';

						tool.state.onMovingStop.handle.call(tool);

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
					var _minSize = 100;

					var _elementToResize;
					var _elementToMove;
					var _handler;
					var _handlerPosition;
					var _centerPosition;
					var _centerPositionFromTop;
					var _elementPosition;
					var _elLeftBorder;
					var _elRightBorder;
					var _elLeftMargin;
					var _elRightMargin;
					var _latestWidthValue;
					var _latestHeightValue;
					var _latestScaleValue;
					var _ratio;
					var _resetInitPosTimeout

					var _oldx = null;
					var _oldy = null;

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

						_elLeftBorder = elementRect.left;
						_elRightBorder = elementRect.right;
						_elLeftMargin = +(_elementToResize.style.margin || _elementToResize.style.marginLeft).replace('px', '');
						_elRightMargin = +(_elementToResize.style.margin || _elementToResize.style.marginRight).replace('px', '');
						_handler = e.target;

						Q.addEventListener(window, 'mousemove', _startResizing);
						Q.addEventListener(window, 'mouseup', _stopResizing);
					}

					function _startResizing(e) {

						if(e.pageX >= docRect.right-(docStyles.paddingRight ? docStyles.paddingRight : '0').replace('px', '')) return;

						var elementRect = _elementToResize.getBoundingClientRect();
						if(_ratio == null) _ratio = elementRect.width / elementRect.height;
						if(_latestWidthValue == null) _latestWidthValue = _elementToResize.offsetWidth;
						if(_latestHeightValue == null) _latestHeightValue = _elementToResize.offsetHeight;
						if(_oldx == null) _oldx = e.pageX;
						if(_oldy == null) _oldy = e.pageY;


						var elementWidth, elementHeight, action;

						if(_handlerPosition == 'bottomright') {
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
						} else if(_handlerPosition == 'bottomleft') {
							if (e.pageX <= _oldx) {
								elementWidth = _latestWidthValue + (_oldx - e.pageX);
							} else if (e.pageX > _oldx) {
								elementWidth = _latestWidthValue - (e.pageX - _oldx);
							}

							if (e.pageY <= _oldy) {
								elementHeight = _latestHeightValue - Math.abs(e.pageY - _oldy);
							} else if (e.pageY > _oldy) {
								elementHeight = _latestHeightValue + Math.abs(_oldy - e.pageY);
							}

						} else if(_handlerPosition == 'topright') {
							if (e.pageX <= _oldx) {
								elementWidth = _latestWidthValue - Math.abs(_oldx - e.pageX);
							} else if (e.pageX > _oldx) {
								elementWidth = _latestWidthValue + (e.pageX - _oldx);
							}

							if (e.pageY <= _oldy) {
								elementHeight = _latestHeightValue + Math.abs(e.pageY - _oldy);
							} else if (e.pageY > _oldy) {
								elementHeight = _latestHeightValue - Math.abs(_oldy - e.pageY);
							}

						} else if(_handlerPosition == 'topleft') {
							if (e.pageX <= _oldx) {
								elementWidth = _latestWidthValue + (_oldx - e.pageX);
							} else if (e.pageX > _oldx) {
								elementWidth = _latestWidthValue - (e.pageX - _oldx);
							}

							if (e.pageY <= _oldy) {
								elementHeight = _latestHeightValue + (_oldy - e.pageY);
							} else if (e.pageY > _oldy) {
								elementHeight = _latestHeightValue - (e.pageY - _oldy);
							}

						}

						if(tool.state.keepRatioBasedOnElement != null) {
							var baseEl = tool.state.keepRatioBasedOnElement;
							var srcWidth = baseEl.videoWidth;
							var srcHeight = baseEl.videoHeight;
							var ratio = srcWidth / srcHeight;
							var currentSize = baseEl.getBoundingClientRect();

							if(ratio < 1) {
								elementWidth = Math.floor(elementHeight * ratio);
							} else {
								var newElHeight = Math.floor(elementWidth / ratio);
								elementHeight = newElHeight + 50;

							}
						} else {
							if(_ratio < 1) {
								elementWidth = Math.floor(elementHeight * _ratio);

							}
							else {
								elementHeight = Math.floor(elementWidth / _ratio);
							}
						}


						if(elementWidth <= _latestWidthValue || elementHeight <= _latestHeightValue) {
							action = 'reduce';
						} else {
							action = 'increase';
						}

						if(elementWidth <= _minSize || elementHeight <= _minSize || elementHeight > document.body.offsetHeight || elementWidth >= document.body.offsetWidth) {
							return;
						}

						if(action == 'increase' && elementToMove != _elementToResize && (elementToMove.offsetHeight >= document.body.offsetHeight || elementToMove.offsetWidth >= document.body.offsetWidth)) {
							return;
						}

						if(_elementPosition == 'fixed' || _elementPosition == 'absolute') {
							elementToMove.style.left = _centerPosition - (elementWidth / 2) + 'px';
							elementToMove.style.top = _centerPositionFromTop - (elementHeight / 2) + 'px';
						}

						_elementToResize.style.width = elementWidth + 'px';
						_elementToResize.style.height = elementHeight + 'px';


						_latestWidthValue = elementWidth;
						_latestHeightValue = elementHeight;
						_oldx = e.pageX;
						_oldy = e.pageY;

						tool.state.appliedRecently = true;
						if(typeof cordova != "undefined" && window.device.platform === 'iOS') cordova.plugins.iosrtc.refreshVideos();

					}

					function _stopResizing(e) {
						e.preventDefault();
						e.stopPropagation();
						Q.removeEventListener(window, 'mousemove', _startResizing);
						Q.removeEventListener(window, 'mouseup', _stopResizing);
						_latestWidthValue = null;
						_latestHeightValue = null;
						_ratio = null;
						_oldx = null;
						_oldy = null;

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

						Q.addEventListener(element, 'touchstart', function () {
							_startResizingByPinch();
						});
					}

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

						ratio = _elementToResize.offsetWidth / _elementToResize.offsetHeight;
						Q.addEventListener(window, 'touchend', _stopResizingByPinch);
						Q.addEventListener(window, 'touchmove', resizeByPinch);
					}

					function _stopResizingByPinch() {
						tool.isScreenResizing = false;
						touch1 = touch2 = prevPosOfTouch1 = prevPosOfTouch2 = _latestHeightValue = _latestWidthValue = ratio = null;
						Q.removeEventListener(window, 'touchend', _stopResizingByPinch);
						Q.removeEventListener(window, 'touchmove', resizeByPinch);
						tool.state.onMoved.handle.call(tool);
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
							elementHeight = _latestHeightValue + Math.abs(touch1.clientX - prevPosOfTouch1.x) + Math.abs(touch2.clientX - prevPosOfTouch2.x);
							elementWidth = _latestWidthValue + Math.abs(touch1.clientX - prevPosOfTouch1.x) + Math.abs(touch2.clientX - prevPosOfTouch2.x);
						} else {
							elementHeight = _latestHeightValue - Math.abs(touch1.clientX - prevPosOfTouch1.x + touch2.clientX - prevPosOfTouch2.x);
							elementWidth = _latestWidthValue - Math.abs(touch1.clientX - prevPosOfTouch1.x + touch2.clientX - prevPosOfTouch2.x);
						}

						if(ratio < 1) {
							elementWidth = parseInt(elementHeight * ratio);

						}
						else {
							elementHeight = parseInt(elementWidth / ratio);
						}


						if(elementWidth <= _minSize || elementHeight <= _minSize || elementHeight > document.body.offsetHeight || elementWidth >= document.body.offsetWidth) {
							return;
						}

						if(_elementPosition == 'fixed' || _elementPosition == 'absolute') {
							_elementToResize.style.left = _centerPosition - (elementWidth / 2) + 'px';
							_elementToResize.style.top = _centerPositionFromTop - (elementHeight / 2) + 'px';
						}

						_elementToResize.style.width = elementWidth + 'px';
						_elementToResize.style.height = elementHeight + 'px';
						if(typeof cordova != "undefined" && window.device.platform === 'iOS') cordova.plugins.iosrtc.refreshVideos();

						_latestWidthValue = elementWidth;
						_latestHeightValue = elementHeight;

						prevPosOfTouch1.x = touch1.clientX;
						prevPosOfTouch1.y = touch1.clientY;
						prevPosOfTouch2.x = touch2.clientX;
						prevPosOfTouch2.y = touch2.clientY;
					}

					function onWheel(e) {
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
						if(delta < 0 && (elRect.height < _minSize || elRect.width < _minSize)) return


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

				return {
					bind: function () {
						Q.addEventListener(activateOnElement, Q.Pointer.start, _dragElement.initMoving);
						Q.addEventListener(window, Q.Pointer.end, _dragElement.stopMoving);

						resizeElement.setHandler(elementToResize);
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
(function (Q, $, window, document, undefined) {

	/**
	 * @module Streams-tools
	 */

	/**
	 * Allow to select persons on group photo
	 * @class Streams groupPhoto
	 * @constructor
	 * @param {array} options
	 * @param {string} options.photoUrl
	 * @param {string} options.publisherId - group photo stream publisher id
	 * @param {string} options.streamName - group photo stream name (Streams/image/invite/{invitation token})
	 * @param {string} [options.useAI] - whether to use AI to recognize faces
	 * @param {Q.Event} onChoose - event occur when user selected area
	 * @param {Q.Event} onSkip - event occur when user click button "Skip"
	 */
	Q.Tool.define("Streams/groupPhoto", function (options) {
		var tool = this;
		var state = tool.state;

		if (!state.photoUrl || !Q.url(state.photoUrl).matchTypes('url').length) {
			return console.warn("invalid photo url");
		}
		if (!state.publisherId) {
			return console.warn("group photo stream publisherId empty");
		}
		if (!state.streamName) {
			return console.warn("group photo stream name empty");
		}

		Q.Streams.get(state.publisherId, state.streamName, function (err, stream) {
			if (err) {
				return;
			}

			tool.stream = this;
			tool.refresh();
		});
	},
	{
		photoUrl: null,
		publisherId: null,
		streamName: null,
		rectCoefficient: 0.2,
		rectangle: {
			width: 15,
			height: 15
		},
		onChoose: new Q.Event(),
		onSkip: new Q.Event()
	},
	{
		refresh: function () {
			var tool = this;
			var state = this.state;

			var title = tool.text.groupPhoto.ClickOnYourFace.interpolate(Q.text.Q.words);
			var streamPredictions = tool.stream.getAttribute("predictions");
			//streamPredictions = null;
			if (Q.isEmpty(streamPredictions)) {
				title = tool.text.imagepicker.cropping.title + '<br>' + (Q.info.isTouchscreen ? tool.text.imagepicker.cropping.touchscreen : tool.text.imagepicker.cropping.notTouchscreen);
			}

			Q.Template.render("Streams/groupPhoto", {
				title: title,
				photoUrl: state.photoUrl
			}, function (err, html) {
				if (err) {
					return;
				}

				Q.replace(tool.element, html);

				$("button[name=skip]", tool.element).on(Q.Pointer.fastclick, function () {
					Q.handle(state.onSkip, tool);
				});

				tool.$input = $("img.Streams_groupPhoto", tool.element);
				tool.input = tool.$input[0];

				var _imgLoaded = function () {
					if (tool.input.naturalWidth < 10) {
						return setTimeout(_imgLoaded, 300);
					}

					tool.hideLoader();

					if (Q.isEmpty(streamPredictions)) {
						tool.useViewport();
					} else {
						tool.useAI(streamPredictions);
					}
				};
				if (tool.input.complete) {
					_imgLoaded();
				} else {
					tool.input.addEventListener('load', _imgLoaded, {once: true});
				}
			});
		},
		useViewport: function () {
			var tool = this;
			var state = this.state;

			tool.element.setAttribute("data-viewport", true);

			tool.$input.plugin('Q/viewport', {
				maxScale: null
			}, function () {
				var thisState = this.data("q_viewport state");
				tool.$("button[name=acceptIcon]").on(Q.Pointer.click, function () {
					var result = thisState.selection;
					if (isNaN(result.left) || isNaN(result.top)) {
						return false;
					}

					var canvas = document.createElement("canvas");
					canvas.width = result.width * tool.input.naturalWidth;
					canvas.height = result.height * tool.input.naturalHeight;
					var context = canvas.getContext("2d");
					context.drawImage(
						tool.input,
						result.left * tool.input.naturalWidth,
						result.top * tool.input.naturalHeight,
						canvas.width, canvas.height,
						0,
						0,
						canvas.width, canvas.height);
					//tool.element.append(canvas); return false;
					Q.handle(tool.state.onChoose, tool, [canvas.toDataURL()]);
				});
			});

			/*tool.$input.on('mousedown touchstart', function (e) {
				e = tool.getEventOffset(e);
				var rect = tool.input.getBoundingClientRect();
				var width = rect.width;
				var height = rect.height;

				Q.Dialogs.push({
					className: 'Q_dialog_imagepicker',
					title: tool.text.imagepicker.cropping.title + "<br>" + Q.info.isTouchscreen ? tool.text.imagepicker.cropping.touchscreen : tool.text.imagepicker.cropping.notTouchscreen,
					content: tool.input,
					destroyOnClose: true,
					apply: true,
					onActivate : function (dialog) {
						tool.$input.plugin('Q/viewport', {
							initial: {
								x: e.offsetX/width,
								y: e.offsetY/height,
								scale: 0.5
							},
							width: 300,
							height: 300
						});
					},
					beforeClose: function(dialog) {
						var state = $('.Q_viewport', dialog).state('Q/viewport');
						var result = state.selection;

						var canvas = document.createElement("canvas");
						canvas.width = result.width;
						canvas.height = result.height;
						var context = canvas.getContext("2d");
						context.drawImage(tool.input, result.left, result.top, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
						tool.element.append(canvas); return false;
						//Q.handle(tool.state.onChoose, tool, [canvas.toDataURL()]);
					}
				});
			});*/
		},
		useAI: function (streamPredictions) {
			var tool = this;
			var state = this.state;

			tool.resizedRatio = tool.input.naturalWidth/tool.input.width;
			tool.$input.on(Q.Pointer.start, function (e) {
				tool.$input.data("drugged", false);
			});
			tool.$input.on(Q.Pointer.move, function (e) {
				tool.$input.data("drugged", true);
			});
			tool.$input.on(Q.Pointer.end, function (e) {
				e = tool.getEventOffset(e);
				if (tool.$input.data("drugged")) {
					return;
				}
				tool.$input.data("drugged", false);
				var rect = tool.input.getBoundingClientRect();
				var width = rect.width/100*state.rectangle.width;
				var height = rect.width/100*state.rectangle.height;
				tool.createRect(e.offsetY + tool.input.offsetTop - height/2, e.offsetX + tool.input.offsetLeft - width/2, width, height);
			});

			streamPredictions.map(function (prediction) {
				var topLeft = prediction.topLeft.map(function (x, i) {
					return (x - (prediction.bottomRight[i] - x)*state.rectCoefficient)/tool.resizedRatio;
				});
				var bottomRight = prediction.bottomRight.map(function (x, i) {
					return (x + (x - prediction.topLeft[i])*state.rectCoefficient)/tool.resizedRatio;
				});

				var top = parseInt(topLeft[1] + tool.input.offsetTop);
				var left = parseInt(topLeft[0] + tool.input.offsetLeft);
				var width = parseInt(bottomRight[0] - topLeft[0]);
				var height = parseInt(bottomRight[1] - topLeft[1]);
				tool.createRect(top, left, width, height);
			});
		},
		getEventOffset: function (event) {
			var rect = event.target.getBoundingClientRect()
			event.clientX = event.clientX || event.pageX || Q.Pointer.getX(event);
			event.clientY = event.clientY || event.pageY || Q.Pointer.getY(event);
			event.offsetX = isNaN(event.offsetX) ? Q.Pointer.getX(event) - rect.x : event.offsetX;
			event.offsetY = isNaN(event.offsetY) ? Q.Pointer.getY(event) - rect.y : event.offsetY;
			return event;
		},
		createRect: function (top, left, width, height) {
			var tool = this;
			var _checkCloseEnough = function (p1, p2) {
				return Math.abs(p1-p2) < 10;
			};

			$("<div class='Streams_groupPhoto_prediction'>").css({top, left, width, height}).on('mousedown touchstart', function (e) {
				e.stopPropagation();
				e = tool.getEventOffset(e);

				this.dragProcessed = false;

				var rect = this.getBoundingClientRect();
				this.lastPosition = {
					x: rect.left - (this.offsetLeft || 0) + e.offsetX,
					y: rect.top - (this.offsetTop || 0) + e.offsetY,
					offsetLeft: this.offsetLeft - tool.input.offsetLeft,
					offsetTop: this.offsetTop - tool.input.offsetTop,
					clientX: e.clientX,
					clientY: e.clientY,
					w: rect.width,
					h: rect.height,
					left: rect.left,
					top: rect.top
				};

				// 1. top left
				if (_checkCloseEnough(e.offsetX, 0) && _checkCloseEnough(e.offsetY, 0)) {
					this.dragTL = true;
				}
				// 2. top right
				else if (_checkCloseEnough(e.offsetX, rect.width) && _checkCloseEnough(e.offsetY, 0)) {
					this.dragTR = true;
				}
				// 3. bottom left
				else if (_checkCloseEnough(e.offsetX, 0) && _checkCloseEnough(e.offsetY, rect.height)) {
					this.dragBL = true;
				}
				// 4. bottom right
				else if (_checkCloseEnough(e.offsetX, rect.width) && _checkCloseEnough(e.offsetY, rect.height)) {
					this.dragBR = true;
				}
				// (5.) none of them
				else {
					this.drag = true;
				}

				return false;
			}).on('mouseup touchend mouseout', function (e) {
				e.stopPropagation();

				if (this.dragProcessed === false) {
					var canvas = document.createElement("canvas");
					var rect = this.getBoundingClientRect();
					canvas.width = rect.width * tool.resizedRatio;
					canvas.height = rect.height * tool.resizedRatio;
					var context = canvas.getContext("2d");
					context.drawImage(tool.input, this.lastPosition.offsetLeft * tool.resizedRatio, this.lastPosition.offsetTop * tool.resizedRatio, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
					//tool.element.append(canvas);
					Q.handle(tool.state.onChoose, tool, [canvas.toDataURL()]);
				}

				this.dragProcessed = null;
				this.drag = this.dragTL = this.dragTR = this.dragBL = this.dragBR = false;
				this.lastPosition = {};
				return false;
			}).on('mousemove touchmove', function (e) {
				e.stopPropagation();
				e = tool.getEventOffset(e);

				this.dragProcessed = true;

				if (Q.isEmpty(this.lastPosition)) {
					return;
				}

				var xDiff = e.clientX - this.lastPosition.x;
				var yDiff = e.clientY - this.lastPosition.y;
				if (this.drag || this.dragTL) {
					this.style.setProperty('left', xDiff + "px");
					this.style.setProperty('top', yDiff + "px");
				} else if (this.dragTR) {
					this.style.setProperty('top', yDiff + "px");
				} else if (this.dragBL) {
					this.style.setProperty('left', xDiff + "px");
				}

				if (this.dragTL) {
					this.style.setProperty('width', this.lastPosition.w + (this.lastPosition.clientX - e.clientX) + "px");
					this.style.setProperty('height', this.lastPosition.h + (this.lastPosition.clientY - e.clientY) + "px");
				} else if (this.dragTR) {
					this.style.setProperty('width', this.lastPosition.w - (this.lastPosition.clientX - e.clientX) + "px");
					this.style.setProperty('height', this.lastPosition.h + (this.lastPosition.clientY - e.clientY) + "px");
				} else if (this.dragBL) {
					this.style.setProperty('width', this.lastPosition.w + (this.lastPosition.clientX - e.clientX) + "px");
					this.style.setProperty('height', this.lastPosition.h - (this.lastPosition.clientY - e.clientY) + "px");
				} else if (this.dragBR) {
					this.style.setProperty('width', this.lastPosition.w - (this.lastPosition.clientX - e.clientX) + "px");
					this.style.setProperty('height', this.lastPosition.h - (this.lastPosition.clientY - e.clientY) + "px");
				}

				return false;
			}).appendTo(tool.element);
		},
		showLoader: function () {
			$(".Streams_groupPhoto_loader", this.element).show();
		},
		hideLoader: function () {
			$(".Streams_groupPhoto_loader", this.element).hide();
		}
	});

	Q.Template.set("Streams/groupPhoto", `
	<h2>{{{title}}}</h2>
	<img alt="group photo" src="{{photoUrl}}" class="Streams_groupPhoto" />
	<div class="Streams_groupPhoto_loader"></div>
	<button class="Q_button" name="skip" type="button">{{invite.dialog.Skip}}</button>
	<button class="Q_button" name="acceptIcon" type="button">{{groupPhoto.AcceptIcon}}</button>
`, {text: ['Streams/content']});

})(Q, Q.jQuery, window, document);
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
 * @param {string} options.title - dialog title
 * @param {float} options.scoreThreshold
 * @param {string} options.faceDetector - neural network used to detect faces. Can be 'blazeface', 'ssd_mobilenetv1', 'tiny_face_detector'
 * ssd_mobilenetv1 - large and slowly, but high precision
 * tiny_face_detector - small and faster, but low precision
 * @param {Q.Event} onChoose - event occur when user selected area
 * @param {Q.Event} onSkip - event occur when user click button "Skip"
 */
Q.Tool.define("Streams/groupPhoto", function (options) {
		var tool = this;
		var state = tool.state;

		if (!state.photoUrl || !Q.url(state.photoUrl).matchTypes('url').length) {
			return console.warn("invalid photo url");
		}

		tool.refresh();
	},

	{
		photoUrl: null,
		title: "Group photo",
		scoreThreshold: 0.2,
		rectCoefficient: 1.5,
		inputSize: 512,
		faceDetector: 'ssd_mobilenetv1',
		rectangle: {
			external: {
				color: "rgba(0,0,0,1)",
				width: 1
			},
			internal: {
				color: "rgba(255,255,255,1)",
				width: 1
			}
		},
		onChoose: new Q.Event(),
		onSkip: new Q.Event()
	},
	{
		refresh: function () {
			var tool = this;
			var state = this.state;

			Q.Template.render("Streams/groupPhoto", {
				title: state.title,
				photoUrl: state.photoUrl
			}, function (err, html) {
				if (err) {
					return;
				}

				Q.replace(tool.element, html);

				$("button[name=skip]", tool.element).on(Q.Pointer.fastclick, function () {
					Q.handle(state.onSkip, tool);
				});

				var $input = $("img.Streams_groupPhoto", tool.element);
				var input = $input[0];

				var _inputLoaded = function () {
					tool.$canvas = $("canvas", tool.element);
					tool.$canvas.css({
						left: $input.position().left,
						top: $input.position().top
					});
					tool.canvas = tool.$canvas[0];
					tool.canvas.width = input.width;
					tool.canvas.height = input.height;
					tool.canvasClientRect = tool.canvas.getBoundingClientRect();
					var ctx = tool.canvas.getContext("2d");
					//ctx.drawImage(input, 0, 0, input.width, input.height);

					tool.startTime = Date.now();
					if (state.faceDetector === "blazeface") {
						Q.ensure('Q.Users.Faces', function () {
							tool.usersFaces = new Q.Users.Faces();
							tool.usersFaces.detect(input, function (predictions) {
								console.log("Time passed: " + (Date.now() - tool.startTime)/1000)
								tool.hideLoader()

								if (!predictions.length) {
									return;
								}

								predictions.forEach((prediction) => {
									prediction.width = prediction.bottomRight[0] - prediction.topLeft[0];
									prediction.height = prediction.bottomRight[1] - prediction.topLeft[1];
									["external", "internal"].forEach((param) => {
										// draw the rectangle enclosing the face
										ctx.lineWidth = state.rectangle[param].width;
										ctx.strokeStyle = state.rectangle[param].color;
										var k = param === 'external' ? state.rectangle.internal.width : 0;
										ctx.strokeRect(
											prediction.topLeft[0] - k,
											prediction.topLeft[1] + k,
											prediction.width + k,
											prediction.height - k
										);
									})
								});

								tool.$canvas.on(Q.Pointer.fastclick, function (event) {
									predictions.forEach(function (prediction, i) {
										event.offsetX = event.offsetX || Q.Pointer.getX(event) - tool.canvasClientRect.x;
										event.offsetY = event.offsetY || Q.Pointer.getY(event) - tool.canvasClientRect.y;
										if (
											event.offsetX < prediction.topLeft[0] || event.offsetX > prediction.topLeft[0] + prediction.width ||
											event.offsetY < prediction.topLeft[1] || event.offsetY > prediction.topLeft[1] + prediction.height
										) {
											return;
										}

										var canvas = document.createElement("canvas");
										var resizedRatio = input.naturalWidth/input.width;
										canvas.width = prediction.width * resizedRatio;
										canvas.height = prediction.height * resizedRatio;
										var context = canvas.getContext("2d");
										context.drawImage(input, prediction.topLeft[0] * resizedRatio, prediction.topLeft[1] * resizedRatio, canvas.width, canvas.width, 0, 0, canvas.width, canvas.width);
										Q.handle(state.onChoose, tool, [canvas.toDataURL()]);
									});
								});
							});
						});
					} else {
						tool.faceApi($input);
					}
				};

				if (input.complete) {
					_inputLoaded()
				} else {
					input.addEventListener('load', _inputLoaded, {once: true});
				}
			});
		},
		showLoader: function () {
			$(".Streams_groupPhoto_loader", this.element).show();
		},
		hideLoader: function () {
			$(".Streams_groupPhoto_loader", this.element).hide();
		},
		faceApi: function ($input) {
			var tool = this;
			var state = this.state;
			var input = $input[0];

			var _getCurrentFaceDetectionNet = function () {
				switch (state.faceDetector) {
					case 'ssd_mobilenetv1':
						return faceapi.nets.ssdMobilenetv1
					case 'tiny_face_detector':
						return faceapi.nets.tinyFaceDetector
					default:
						throw new Q.Error("unrecognised faceDetector");
				}
			};
			var _getFaceDetectorOptions = function () {
				switch (state.faceDetector) {
					case 'ssd_mobilenetv1':
						return new faceapi.SsdMobilenetv1Options({ minConfidence: state.scoreThreshold })
					case 'tiny_face_detector':
						return new faceapi.TinyFaceDetectorOptions({ inputSize: state.inputSize, scoreThreshold: state.scoreThreshold })
					default:
						throw new Q.Error("unrecognised faceDetector");
				}
			};
			var _isFaceDetectionModelLoaded = function () {
				return !!_getCurrentFaceDetectionNet().params
			};
			var _run = function () {
				tool.hideLoader()
				faceapi.detectAllFaces(input, _getFaceDetectorOptions()).then(function (results) {
					console.log("Time passed: " + (Date.now() - tool.startTime)/1000)
					faceapi.matchDimensions(tool.canvas, input);
					// increase detected rectangles to state.rectCoefficient
					results = results.map(function (result) {
						result._box._x -= (result._box._width*state.rectCoefficient - result._box._width)/2;
						result._box._y -= (result._box._height*state.rectCoefficient - result._box._height)/2;
						result._box._width *= state.rectCoefficient;
						result._box._height *= state.rectCoefficient;
						return result;
					});
					var drawDetectionsOptions = {
						withScore: false,
						boxColor: state.rectangle.internal.color,
						lineWidth: state.rectangle.internal.width
					};
					var resizedResults = faceapi.resizeResults(results, input);
					faceapi.draw.drawDetections(tool.canvas, resizedResults, drawDetectionsOptions);

					// draw black box around white
					drawDetectionsOptions.boxColor = state.rectangle.external.color;
					faceapi.draw.drawDetections(tool.canvas, faceapi.resizeResults(resizedResults.map(function (result) {
						result._box._x -= drawDetectionsOptions.lineWidth;
						result._box._y -= drawDetectionsOptions.lineWidth;
						result._box._width += 2*drawDetectionsOptions.lineWidth;
						result._box._height += 2*drawDetectionsOptions.lineWidth;
						return result;
					}), input), drawDetectionsOptions);

					tool.$canvas.on(Q.Pointer.fastclick, function (event) {
						resizedResults.forEach(function (result, i) {
							event.offsetX = event.offsetX || Q.Pointer.getX(event) - tool.canvasClientRect.x;
							event.offsetY = event.offsetY || Q.Pointer.getY(event) - tool.canvasClientRect.y;
							if (
								event.offsetX < result._box.left || event.offsetX > result._box.left + result._box.width ||
								event.offsetY < result._box.top || event.offsetY > result._box.top + result._box.height
							) {
								return;
							}

							faceapi.extractFaces(input, [results[i]]).then(function (canvases) {
								canvases.forEach(cnv => {
									//var outputImage = $("<img>").insertAfter(input).prop("src", cnv.toDataURL());
									Q.handle(state.onChoose, tool, [cnv.toDataURL()]);
								})
							});
						});
					});
				});
			};

			Q.addScript(['{{Streams}}/js/face-api/dist/face-api.js'], function () {
				if (_isFaceDetectionModelLoaded()) {
					_run();
				} else {
					tool.showLoader();
					_getCurrentFaceDetectionNet().load(Q.url('{{Streams}}/js/face-api/weights/')).then(_run);
				}
			});
		}
	}
);

Q.Template.set("Streams/groupPhoto", `
	<h2>{{title}}</h2>
	<img alt="group photo" src="{{photoUrl}}" class="Streams_groupPhoto" />
	<canvas></canvas>
	<div class="Streams_groupPhoto_loader"></div>
	<button class="Q_button" name="skip" type="button">{{invite.dialog.Skip}}</button>
`, {text: ['Streams/content']});

})(Q, Q.jQuery, window, document);
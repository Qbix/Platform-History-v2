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
 * @param {string} options.faceDetector - neural network used to detect faces. Can be 'ssd_mobilenetv1' or 'tiny_face_detector'
 * ssd_mobilenetv1 - large and slowly, but high precision
 * tiny_face_detector - small and faster, but low precision
 * @param {Q.Event} onChoose - event occur when user selected area
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
		scoreThreshold: 0.4,
		rectCoefficient: 1.5,
		inputSize: 512,
		faceDetector: 'ssd_mobilenetv1',
		onChoose: new Q.Event()
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

				var $input = $("img.Streams_groupPhoto", tool.element);
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
					var $canvas = $("canvas", tool.element);
					$canvas.css({
						left: $input.position().left,
						top: $input.position().top
					});
					var canvas = $canvas[0];
					var canvasClientRect = canvas.getBoundingClientRect();
					faceapi.detectAllFaces(input, _getFaceDetectorOptions()).then(function (results) {
						faceapi.matchDimensions(canvas, input);
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
							boxColor: "rgba(255, 255, 255, 1)",
							lineWidth: 1
						};
						var resizedResults = faceapi.resizeResults(results, input);
						faceapi.draw.drawDetections(canvas, resizedResults, drawDetectionsOptions);

						// draw black box around white
						drawDetectionsOptions.boxColor = "rgba(0, 0, 0, 1)";
						faceapi.draw.drawDetections(canvas, faceapi.resizeResults(resizedResults.map(function (result) {
							result._box._x -= drawDetectionsOptions.lineWidth;
							result._box._y -= drawDetectionsOptions.lineWidth;
							result._box._width += 2*drawDetectionsOptions.lineWidth;
							result._box._height += 2*drawDetectionsOptions.lineWidth;
							return result;
						}), input), drawDetectionsOptions);

						$canvas.on(Q.Pointer.fastclick, function (event) {
							resizedResults.forEach(function (result, i) {
								event.offsetX = event.offsetX || Q.Pointer.getX(event) - canvasClientRect.x;
								event.offsetY = event.offsetY || Q.Pointer.getY(event) - canvasClientRect.y;
								if (
									event.offsetX < result._box.left || event.offsetX > result._box.left + result._box.width ||
									event.offsetY < result._box.top || event.offsetY > result._box.top + result._box.height
								) {
									return;
								}

								faceapi.extractFaces(input, [results[i]]).then(function (canvases) {
									canvases.forEach(cnv => {
										//var outputImage = $("<img>").insertAfter(input).prop("src", cnv.toDataURL());
										Q.handle(state.onChoose, tool, [cnv.toDataURL()], results[i]._box);
									})
								});
							});
						});
					});
				};
				var _inputLoaded = function () {
					if (_isFaceDetectionModelLoaded()) {
						setTimeout(_run, 500);
					} else {
						tool.showLoader();
						setTimeout(() => _getCurrentFaceDetectionNet().load(Q.url('{{Streams}}/js/face-api/weights/')).then(_run), 500);
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
		}
	}
);

Q.Template.set("Streams/groupPhoto", `
	<h2>{{title}}</h2>
	<img alt="group photo" src="{{photoUrl}}" class="Streams_groupPhoto" />
	<canvas></canvas>
	<div class="Streams_groupPhoto_loader"></div>
`);

})(Q, Q.jQuery, window, document);
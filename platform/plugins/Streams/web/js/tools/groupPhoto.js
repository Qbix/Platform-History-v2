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
		scoreThreshold: 0.5,
		inputSize: 512,
		faceDetector: 'ssd_mobilenetv1'
	},
	{
		refresh: function () {
			var tool = this;
			var state = this.state;

			Q.Template.render("Streams/groupPhoto", {
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
					$(".Streams_groupPhoto_loader", tool.element).hide()
					var $canvas = $("canvas", tool.element);
					$canvas.css({
						left: $input.position().left,
						top: $input.position().top
					});
					var canvas = $canvas[0];
					faceapi.detectAllFaces(input, _getFaceDetectorOptions()).then(function (results) {
						faceapi.matchDimensions(canvas, input);
						var resizedResults = faceapi.resizeResults(results, input);
						faceapi.draw.drawDetections(canvas, resizedResults, {withScore: false});
						$canvas.on(Q.Pointer.fastclick, function (event) {
							resizedResults.forEach(function (result, i) {
								if (
									event.offsetX < result._box.left || event.offsetX > result._box.left + result._box.width ||
									event.offsetY < result._box.top || event.offsetY > result._box.top + result._box.height
								) {
									return;
								}

								faceapi.extractFaces(input, [results[i]]).then(function (canvases) {
									canvases.forEach(cnv => {
										var outputImage = $("<img>").insertAfter(input).prop("src", cnv.toDataURL());
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
						$(".Streams_groupPhoto_loader", tool.element).show();
						setTimeout(() => _getCurrentFaceDetectionNet().load(Q.url('{{Streams}}/js/face-api/weights/')).then(_run), 500);
					}
				};

				if (input.complete) {
					_inputLoaded()
				} else {
					input.addEventListener('load', _inputLoaded, {once: true});
				}
			});
		}
	}
);

Q.Template.set("Streams/groupPhoto", `
	<img alt="group photo" src="{{photoUrl}}" class="Streams_groupPhoto" />
	<canvas></canvas>
	<div class="Streams_groupPhoto_loader"></div>
`);

})(Q, Q.$, window, document);
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

			Q.Dialogs.push({
				title: state.title,
				className: "StreamsGroupPhoto",
				template: {
					name: "Streams/groupPhoto",
					fields: {
						photoUrl: state.photoUrl
					}
				},
				onActivate: function ($dialog) {
					var input = $("img.Streams_groupPhoto", $dialog)[0];
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
						$(".Streams_groupPhoto_loader", $dialog).hide()
						var canvas = $("canvas", $dialog)[0];
						faceapi.detectAllFaces(input, _getFaceDetectorOptions()).then(function (results) {
							faceapi.matchDimensions(canvas, input);
							faceapi.draw.drawDetections(canvas, faceapi.resizeResults(results, input), {withScore: false});
						});
					};
					var _inputLoaded = function () {
						if (_isFaceDetectionModelLoaded()) {
							_run();
						} else {
							$(".Streams_groupPhoto_loader", $dialog).show()
							setTimeout(() => _getCurrentFaceDetectionNet().load(Q.url('{{Streams}}/js/face-api/weights/')).then(_run), 500);

						}
					};

					if (input.complete) {
						_inputLoaded()
					} else {
						input.addEventListener('load', _inputLoaded);
					}
				}
			});
		}
	}
);

Q.Template.set("Streams/groupPhoto", `
	<img alt="group photo" src="{{photoUrl}}" class="Streams_groupPhoto" />
	<canvas />
	<div class="Streams_groupPhoto_loader"></div>
`);

})(Q, Q.$, window, document);
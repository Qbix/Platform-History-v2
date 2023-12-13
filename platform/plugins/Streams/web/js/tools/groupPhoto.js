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
		if (!state.publisherId) {
			return console.warn("group photo stream publisherId empty");
		}
		if (!state.streamName) {
			return console.warn("group photo stream name empty");
		}

		tool.refresh();
	},

	{
		photoUrl: null,
		publisherId: null,
		streamName: null,
		title: "Group photo",
		rectCoefficient: 0.2,
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

				var pipe = new Q.Pipe(["image", "stream"], function (params) {
					tool.hideLoader();
					if (params.stream[0]) {
						return;
					}
					var stream = params.stream[1];
					var predictions = stream.getAttribute("predictions");

					if (Q.isEmpty(predictions)) {
						return console.warn("predictions empty");
					}

					var resizedRatio = input.naturalWidth/input.width;
					predictions = predictions.map(function (prediction) {
						return {
							topLeft: prediction.topLeft.map(function (x, i) {
								return (x - (prediction.bottomRight[i] - x)*state.rectCoefficient)/resizedRatio;
							}),
							bottomRight: prediction.bottomRight.map(function (x, i) {
								return (x + (x - prediction.topLeft[i])*state.rectCoefficient)/resizedRatio;
							})
						};
					});
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
							canvas.width = prediction.width * resizedRatio;
							canvas.height = prediction.height * resizedRatio;
							var context = canvas.getContext("2d");
							context.drawImage(input, prediction.topLeft[0] * resizedRatio, prediction.topLeft[1] * resizedRatio, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
							//tool.element.append(canvas);
							Q.handle(state.onChoose, tool, [canvas.toDataURL()]);
						});
					});
				});

				if (input.complete) {
					pipe.fill("image")();
				} else {
					input.addEventListener('load', pipe.fill("image"), {once: true});
				}
				Q.Streams.get(state.publisherId, state.streamName, pipe.fill("stream"));
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
	<button class="Q_button" name="skip" type="button">{{invite.dialog.Skip}}</button>
`, {text: ['Streams/content']});

})(Q, Q.jQuery, window, document);
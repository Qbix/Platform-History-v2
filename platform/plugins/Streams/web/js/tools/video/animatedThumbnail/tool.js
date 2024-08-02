(function (Q, $, window, undefined) {
	/**
	 * Tool to generate and save animated GIF thumbnail for video.
	 * @class Streams/video/chat
	 * @constructor
	 * @param {Object} [options] this is an object that contains parameters for this function
	 */
	Q.Tool.define("Streams/video/animatedThumbnail", function (options) {
		var tool = this;
		var state = this.state;

		if (!state.videoUrl && tool.element.tagName === 'VIDEO') {
			state.videoUrl = tool.element.src;
		}
		if (!state.videoUrl) {
			throw new Q.Error("Streams/video/animatedThumbnail: video url undefined");
		}

		Q.Dialogs.push({
			title: tool.text.animatedThumbnail.CreateAnimatedThumbnail,
			className: "Streams_video_animatedThumbnail Q_loading",
			onActivate: function (dialog) {
				Q.addScript(["{{Streams}}/js/tools/video/animatedThumbnail/GIFEncoder.js", "{{Streams}}/js/tools/video/animatedThumbnail/LZWEncoder.js", "{{Streams}}/js/tools/video/animatedThumbnail/NeuQuant.js"], function () {
					Q.Template.render("Streams/video/animatedThumbnail", {
						videoUrl: state.videoUrl
					}, function (err, html) {
						if (err) {
							return;
						}

						Q.replace($(".Q_dialog_content", dialog)[0], html);

						tool.process(dialog);
					});
				});
			},
			onClose: function () {
				Q.Tool.remove(tool.element, true, false);
			}
		});
	},

	{
		videoUrl: null,
		onReady: new Q.Event()
	},

	{
		process: function (dialog) {
			var tool = this;
			const byteToKBScale = 0.0009765625;
			//const scale = window.devicePixelRatio;
			const scale = 1;
			tool.videoObj = $("video", dialog)[0];
			const $settings = $(".Streams_video_animatedThumbnail_settings", dialog);
			const $width = $("input[name=width]", $settings);
			const $height = $("input[name=height]", $settings);
			const $start = $("input[name=start]", $settings);
			const $end = $("input[name=end]", $settings);
			const $fps = $("input[name=fps]", $settings);
			const $delay = $("input[name=delay]", $settings);
			const $quality = $("input[name=quality]", $settings);
			const $result = $(".Streams_video_animatedThumbnail_result", dialog);
			const getContextSettings = {willReadFrequently: true};
			function encode64(input) {
				var output = '', i = 0, l = input.length,
					key = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
					chr1, chr2, chr3, enc1, enc2, enc3, enc4;
				while (i < l) {
					chr1 = input.charCodeAt(i++);
					chr2 = input.charCodeAt(i++);
					chr3 = input.charCodeAt(i++);
					enc1 = chr1 >> 2;
					enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
					enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
					enc4 = chr3 & 63;
					if (isNaN(chr2)) enc3 = enc4 = 64;
					else if (isNaN(chr3)) enc4 = 64;
					output = output + key.charAt(enc1) + key.charAt(enc2) + key.charAt(enc3) + key.charAt(enc4);
				}
				return output;
			}

			function toggleImageSmoothing(_CANVAS, isEnabled) {
				_CANVAS.getContext('2d', getContextSettings).mozImageSmoothingEnabled = isEnabled;
				_CANVAS.getContext('2d', getContextSettings).webkitImageSmoothingEnabled = isEnabled;
				_CANVAS.getContext('2d', getContextSettings).msImageSmoothingEnabled = isEnabled;
				_CANVAS.getContext('2d', getContextSettings).imageSmoothingEnabled = isEnabled;
			}

			function scaleCanvas(_CANVAS, vidHeight, vidWidth, scale) {
				_CANVAS['style']['height'] = `${vidHeight}px`;
				_CANVAS['style']['width'] = `${vidWidth}px`;

				let cWidth=vidWidth*scale;
				let cHeight=vidHeight*scale;

				_CANVAS.width=cWidth;
				_CANVAS.height=cHeight;

				toggleImageSmoothing(_CANVAS, true);
				_CANVAS.getContext('2d', getContextSettings).scale(scale, scale);
			}
			var _canPlayHandler = function () {
				const exactVideoDuration = tool.videoObj.duration;
				const vidHeight = tool.videoObj.videoHeight;
				const vidWidth = tool.videoObj.videoWidth;
				const ratio =  vidWidth/vidHeight;
				$width.on('input', function () {
					var val = $(this).val();
					$height.val(Math.round( val / ratio));
				}).val(vidWidth);
				$height.on('input', function () {
					var val = $(this).val();
					$width.val(Math.round(val * ratio));
				}).val(vidHeight);
				$end.val(parseInt(exactVideoDuration));
				$settings.show();
				tool.videoObj.removeEventListener('loadedmetadata', _canPlayHandler);
				dialog.classList.remove("Q_loading");
			};
			tool.videoObj.addEventListener('loadedmetadata', _canPlayHandler);

			$("button[name=start]", dialog).on(Q.Pointer.fastclick, function () {
				const $startButton = $(this);
				$startButton.addClass("Q_disabled");
				$result.hide();

				const width = parseInt($width.val());
				const height = parseInt($height.val());
				const FPS = parseFloat($fps.val());
				const delay = parseInt($delay.val());
				const quality = parseInt($quality.val());
				const start = parseInt($start.val());
				const end = parseInt($end.val());
				var frames = [];

				let _CANVAS = document.createElement('canvas');
				scaleCanvas(_CANVAS, height, width, scale);

				// Sets frame rate in frames per second
				var frameIndex=0;

				var _step = function () {
					_CANVAS.getContext('2d', getContextSettings).drawImage(tool.videoObj, 0, 0, width, height);
					frames.push(_CANVAS.getContext('2d', getContextSettings).getImageData(0, 0, width, height));
					frameIndex++;
					setTimeout(() => tool.videoObj.requestVideoFrameCallback(_step), parseInt(1000/FPS));
					if (tool.videoObj.currentTime >= end) {
						tool.videoObj.pause();
						tool.videoObj.currentTime = 0;
					}
				};
				function _playHandler () {
					tool.videoObj.requestVideoFrameCallback(_step);
				}
				function _endedHandler () {
					if (tool.stop) {
						return;
					}
					var encoder = new GIFEncoder(width, height);
					encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
					encoder.setDelay(delay);  // frame delay in ms // 500
					encoder.setQuality(quality); // [1,30] | Best=1 | >20 not much speed improvement. 10 is default.
					encoder.start();
					frames.forEach((frame, index) => {
						encoder.addFrame(frame, true);
					})
					encoder.finish();

					var fileType='image/gif';
					var readableStream=encoder.stream();
					var binary_gif =readableStream.getData();
					var b64Str = 'data:'+fileType+';base64,'+encode64(binary_gif);
					var fileSize = readableStream.bin.length*byteToKBScale;
					fileSize=fileSize.toFixed(2);

					$("img.animatedThumbnail", $result).prop("src", b64Str);
					$(".fileSize span", $result).text(fileSize);
					$(".frames", $result).text(frameIndex);
					$(".frameSize span:first-child", $result).text(width);
					$(".frameSize span:last-child", $result).text(height);
					$result.show();
					$startButton.removeClass("Q_disabled");
					tool.videoObj.removeEventListener('play', _playHandler);
					tool.videoObj.removeEventListener('pause', _endedHandler);
				}
				tool.videoObj.addEventListener('play', _playHandler, false);
				tool.videoObj.addEventListener('pause', _endedHandler, false);

				tool.videoObj.currentTime = start;
				tool.videoObj.play();
			});
			$("button[name=useThis]", dialog).on(Q.Pointer.fastclick, function () {
				Q.handle(tool.state.onReady, tool, [$("img.animatedThumbnail", dialog)]);
				Q.Dialogs.close(dialog);
			});
		}, Q: {
			beforeRemove: function () {
				this.videoObj.remove();
				this.stop = true;
			}
		}
	});

	Q.Template.set("Streams/video/animatedThumbnail",
`<video src="{{{videoUrl}}}" preload="auto" playsinline muted crossorigin="anonymous"></video>
	<table class="Streams_video_animatedThumbnail_settings">
		<tr><td>{{animatedThumbnail.Width}} <i>(px)</i>:</td><td><input type="number" name="width"></td><td>{{animatedThumbnail.Height}} <i>(px)</i>:</td><td><input type="number" name="height"></td></tr>
		<tr><td>{{animatedThumbnail.Start}} <i>(sec)</i>:</td><td><input type="number" name="start" value="0"></td><td>{{animatedThumbnail.End}} <i>(sec)</i>:</td><td><input type="number" name="end"></td></tr>
		<tr><td>FPS:</td><td><input type="number" name="fps" value="10"></td><td>{{animatedThumbnail.Delay}} <i>(ms)</i>:</td><td><input type="number" name="delay" value="0"></td></tr>
		<tr><td>{{animatedThumbnail.Quality}} <i>(1-256)</i>:</td><td><input type="number" name="quality" value="1"></td></tr>
		<tr><td colspan="4"><button name="start">{{animatedThumbnail.Start}}</button></td></tr>
	</table>
	<div class="Streams_video_animatedThumbnail_result">
		<h2>{{animatedThumbnail.ResultGIF}}</h2>
		<img class="animatedThumbnail">
		<table>
			<tr><td>{{animatedThumbnail.Size}}:</td><td class="fileSize"><span></span> KB</td></tr>
			<tr><td># {{animatedThumbnail.OfFrames}}:</td><td class="frames"></td></tr>
			<tr><td>{{animatedThumbnail.Frame}} (w ⨯ h):</td><td class="frameSize"><span></span> px ⨯ <span></span> px</td></tr>
			<tr><td colspan="2"><button name="useThis">{{animatedThumbnail.UseThis}}</button></td></tr>
		</table>
	</div>`,{text: ['Streams/content']});
})(Q, Q.jQuery, window);
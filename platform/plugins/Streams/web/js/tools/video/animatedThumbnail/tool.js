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
			className: "Streams_video_animatedThumbnail",
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
		videoUrl: null
	},

	{
		process: function (element) {
			const byteToKBScale = 0.0009765625;
			const scale = window.devicePixelRatio;
			var videoObj = $("video", element)[0];
			const $settings = $(".Streams_video_animatedThumbnail_settings", element);
			const $width = $("input[name=width]", $settings);
			const $height = $("input[name=height]", $settings);
			const $fps = $("input[name=fps]", $settings);
			const $delay = $("input[name=delay]", $settings);
			const $quality = $("input[name=quality]", $settings);
			const $result = $(".Streams_video_animatedThumbnail_result", element);
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
				_CANVAS.getContext('2d').mozImageSmoothingEnabled = isEnabled;
				_CANVAS.getContext('2d').webkitImageSmoothingEnabled = isEnabled;
				_CANVAS.getContext('2d').msImageSmoothingEnabled = isEnabled;
				_CANVAS.getContext('2d').imageSmoothingEnabled = isEnabled;
			}

			function scaleCanvas(_CANVAS, videoObj, vidHeight, vidWidth, scale) {
				_CANVAS['style']['height'] = `${vidHeight}px`;
				_CANVAS['style']['width'] = `${vidWidth}px`;

				let cWidth=vidWidth*scale;
				let cHeight=vidHeight*scale;

				_CANVAS.width=cWidth;
				_CANVAS.height=cHeight;

				toggleImageSmoothing(_CANVAS, true);
				_CANVAS.getContext('2d').scale(scale, scale);
			}
			var _canPlayHandler = function () {
				let exactVideoDuration=videoObj.duration;

				let vidHeight=videoObj.videoHeight;
				let vidWidth=videoObj.videoWidth;

				var startTime=0;
				var frameIndex=0;
				var FPS = 0;

				var _step = () => {
					if (FPS > 0) {
						videoObj.removeEventListener('canplay', _canPlayHandler);
						videoObj.removeEventListener('play', _step);
						videoObj.pause();
						videoObj.currentTime = 0;
						const ratio =  vidWidth/vidHeight;
						$width.on('input', function () {
							$height.val(Math.round($(this).val() * ratio));
						}).val(vidWidth);
						$height.on('input', function () {
							$width.val(Math.round($(this).val() / ratio));
						}).val(vidHeight);
						$fps.val(FPS);
						$settings.show();
						return;
					}

					frameIndex++;
					console.log(frameIndex);
					/*if (frameIndex === 1) {
						startTime = Date.now();
					} else if (frameIndex === 50) {
						var ms_elapsed = (Date.now()) - startTime;
						FPS=(frameIndex / ms_elapsed)*1000.0;
						console.log('FPS: '+FPS+' | Duration: '+exactVideoDuration);
					}*/

					videoObj.requestVideoFrameCallback(_step);
				}
				videoObj.addEventListener('play', _step, false);
				videoObj.play();
			};
			videoObj.addEventListener('canplay', _canPlayHandler);

			$("button[name=start]", element).on(Q.Pointer.fastclick, function () {
				const $startButton = $(this);
				$startButton.addClass("Q_disabled");
				$result.hide();

				const width = parseInt($width.val());
				const height = parseInt($height.val());
				const FPS = parseInt($fps.val());
				const delay = parseInt($delay.val());
				const quality = parseInt($quality.val());
				var continueCallback=true;

				let _CANVAS = document.createElement('canvas');
				scaleCanvas(_CANVAS, videoObj, height, width, scale);

				var encoder = new GIFEncoder(width, height);
				encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
				encoder.setDelay(delay);  // frame delay in ms // 500
				encoder.setQuality(quality); // [1,30] | Best=1 | >20 not much speed improvement. 10 is default.
				//encoder.setFrameRate(FPS);

				// Sets frame rate in frames per second
				var frameIndex=0;

				var _step = async function () {
					_CANVAS.getContext('2d').drawImage(videoObj, 0, 0, width, height);
					encoder.addFrame(_CANVAS.getContext('2d'));
					console.log('encoder frame added');
					frameIndex++;
					if(continueCallback) {
						videoObj.requestVideoFrameCallback(_step);
					}
				};
				function _playHandler () {
					encoder.start();
					console.log('encoder started');
					if(continueCallback) {
						videoObj.requestVideoFrameCallback(_step);
					}
				}
				function _endedHandler () {
					continueCallback=false;
					encoder.finish();
					console.log('encoder finished');

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
					videoObj.removeEventListener('play', _playHandler);
					videoObj.removeEventListener('ended', _endedHandler);
				}
				videoObj.addEventListener('play', _playHandler, false);
				videoObj.addEventListener('ended', _endedHandler, false);

				videoObj.currentTime = 0;
				videoObj.play();
			});
		}
	});

	Q.Template.set("Streams/video/animatedThumbnail",
`<video src="{{videoUrl}}" preload="auto" playsinline="playsinline" muted></video>
	<table class="Streams_video_animatedThumbnail_settings">
		<tr><td>Widh:</td><td><input name="width"> px</td></tr>
		<tr><td>Height:</td><td><input name="height"> px</td></tr>
		<tr><td>FPS:</td><td><input name="fps"></td></tr>
		<tr><td>Delay:</td><td><input name="delay" value="0"> ms</td></tr>
		<tr><td>Quality:</td><td><input name="quality" value="1"> (1-256)</td></tr>
		<tr><td colspan="2"><button name="start">Start</button></td></tr>
	</table>
	<div class="Streams_video_animatedThumbnail_result">
		<h2>Result GIF</h2>
		<img class="animatedThumbnail">
		<table>
			<tr><td>Size:</td><td class="fileSize"><span></span> KB</td></tr>
			<tr><td># of Frame(s):</td><td class="frames"></td></tr>
			<tr><td>Frame (ᴡ ⨯ ʜ):</td><td class="frameSize"><span></span> px ⨯ <span></span> px</td></tr>
		</table>
	</div>`,{text: ['Streams/content']});
})(Q, Q.jQuery, window);
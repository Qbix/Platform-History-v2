(function (window, Q, $, undefined) {
	
/**
 * @module Q
 */
	
/**
 * YUIDoc description goes here
 * @class Q video
 * @constructor
 * @param {Object} [options] Override various options for this tool
 *  @param {String} [options.url] URL of video source
 *  @param {boolean} [options.autoplay=false] If true - start play on load
 */
Q.Tool.define("Q/video", function (options) {
	var tool = this;
	var state = tool.state;

	if (state.url) {
		state.url = state.url.interpolate({ "baseUrl": Q.info.baseUrl });
	}

	tool.adapters = {};

	tool.adapters.mp4 = {
		init: function () {
			var options = {
				sources: [{
					src: state.url,
					type: 'video/mp4'
				}]
			};

			tool.initPlayer(options);
		}
	};
	tool.adapters.webm = {
		init: function () {
			var options = {
				sources: [{
					src: state.url,
					type: 'video/webm'
				}]
			};

			tool.initPlayer(options);
		}
	};
	tool.adapters.ogg = {
		init: function () {
			var options = {
				sources: [{
					src: state.url,
					type: 'video/ogg'
				}]
			};

			tool.initPlayer(options);
		}
	};
	tool.adapters.youtube = {
		init: function () {
			Q.addScript("{{Q}}/js/videojs/plugins/YouTube.js", function () {
				var options = {
					techOrder: ["youtube"],
					sources: [{
						src: state.url,
						type: 'video/youtube'
					}],
					youtube: {
						ytControls: 2
					}
				};

				tool.initPlayer(options);
			});
		}
	};
	tool.adapters.vimeo = {
		init: function () {
			Q.addScript("{{Q}}/js/videojs/plugins/Vimeo.js", function () {
				var options = {
					techOrder: ["vimeo"],
					sources: [{
						src: state.url,
						type: 'video/vimeo'
					}],
					vimeo: {
						ytControls: 2
					}
				};

				tool.initPlayer(options);
			});
		}
	};

	//tool.adapters.youtube = tool.adapters.vimeo = tool.adapters.mp4 = tool.adapters.webm = tool.adapters.general;

	var p = Q.pipe(['stylesheet', 'text', 'scripts', 'stream'], function (params, subjects) {
		tool.text = params.text[1].video;
		Q.handle(tool[state.action], tool);
	});

	Q.addStylesheet(["{{Q}}/css/videojs.css", "{{Q}}/css/video.css"], p.fill('stylesheet'), { slotName: 'Q' });
	Q.addScript("{{Q}}/js/videojs/lib.js", p.fill('scripts'));
	Q.Text.get('Q/content', p.fill('text'));

	tool.stream = null;
	if (state.publisherId && state.streamName) {
		state.isComposer = false;
		Q.Streams.get(state.publisherId, state.streamName, function () {
			tool.stream = this;
			p.fill('stream')();
		});
	} else {
		p.fill('stream')();
	}
},

{
	action: "composer",
	url: null,
	autoplay: false,
	isComposer: true,
	publisherId: null,
	streamName: null,
	throttle: 10,
	fileUploadUHandler: Q.action("Q/file"),
	preprocess: null,
	duration: 0,
	currentPosition: 0,
	clipStart: null,
	clipEnd: null,
	onSuccess: new Q.Event(),
	onError: new Q.Event(function (message) {
		alert('Flie upload error' + (message ? ': ' + message : '') + '.');
	}, 'Q/video'),
	onFinish: new Q.Event(),
	onLoad: new Q.Event(),
	onPlay: new Q.Event(function () {
		this.checkClip();
	}),
	onPlaying: new Q.Event(function () {
		this.checkClip();
	}),
	onPause: new Q.Event(),
	onSeek: new Q.Event(),
	onEnded: new Q.Event()
},

{
	/**
	 * Check clip borders and pause if outside
	 * @method checkClip
	 */
	checkClip: function () {
		var tool = this;
		var state = this.state;

		// clipStart handler
		if (state.clipStart && state.currentPosition < state.clipStart) {
			tool.setCurrentPosition(state.clipStart);
		}
		// clipStart handler
		if (state.clipEnd && state.currentPosition > state.clipEnd) {
			tool.pause();
			tool.setCurrentPosition(state.clipEnd);
		}
	},
	/**
	 * Refreshes the appearance of the tool completely
	 * @method implement
	 */
	implement: function () {
		var tool = this;
		var state = this.state;

		Q.Template.render('Q/video/videojs', {
			autoplay: state.autoplay ? 'autoplay' : '',
		}, function (err, html) {
			tool.element.innerHTML = html;

			tool.$video = $("video", tool.element);

			var adapterName = tool.adapterNameFromUrl();
			tool.adapters[adapterName].init();
		});
	},
	/**
	 * Start video composer dialog
	 * @method composer
	 */
	composer: function () {
		var tool = this;
		var state = this.state;

		/**
		 * Process composer submitting
		 * @method _process
		 */
		var _process = function() {
			var _error = function (err) {
				state.mainDialog.removeClass('Q_uploading');
				Q.alert(err);
			};

			var action = state.mainDialog.attr('data-action');
			var $currentContent = $(".Q_video_composer_content [data-content=" + action + "]", state.mainDialog);
			if (!$currentContent.length) {
				return _error("No action selected");
			}
			var clipTool = Q.Tool.from($(".Q_clip_tool", $currentContent), "Q/clip");
			var clipStart = clipTool ? clipTool.getPosition("start") : null;
			var clipEnd = clipTool ? clipTool.getPosition("end") : null;

			state.mainDialog.addClass('Q_uploading');

			if (action === "link") {
				// url defined
				var url = $("input[name=url]", $currentContent).val();
				if (!url) {
					return _error("Link not found");
				}

				Q.req('Websites/scrape', ['result'], function (err, response) {
					var msg = Q.firstErrorMessage(err, response && response.errors);
					if (msg) {
						Q.Dialogs.pop();
						return console.warn("Q/video: " + msg);
					}

					var siteData = response.slots.result;

					var params = {
						title: siteData.title,
						content: siteData.description,
						icon: siteData.iconBig,
						attributes: {
							host: siteData.host,
							iconSmall: siteData.iconSmall,
							url: url,
							'Q.file.url': "",
							'file.url': "",
							clipStart: clipStart,
							clipEnd: clipEnd
						}
					};

					// edit stream
					if (tool.stream) {
						Q.each(params, function (name, value) {
							tool.stream.pendingFields[name] = value;
						});
						tool.stream.save({
							onSave: function () {
								Q.handle([state.onSuccess, state.onFinish], tool, [params]);
								Q.Dialogs.pop();
							}
						});
					} else {
						// new stream
						Q.handle([state.onSuccess, state.onFinish], tool, [params]);
						Q.Dialogs.pop();
					}
				}, {
					method: 'post',
					fields: {url: url}
				});
			} else if (action === "upload") {
				var $file = $("input[type=file].Q_video_file", $currentContent);
				// state.file set in recorder OR html file element
				var file = ($file.length && $file[0].files[0]) || null;

				// check file size
				if (file.size && file.size >= parseInt(Q.info.maxUploadSize)) {
					return Q.alert(tool.text.errorFileSize.interpolate({size: tool.humanFileSize()}));
				}

				var reader = new FileReader();
				reader.onload = function (event) {
					if (state.preprocess) {
						Q.handle(state.preprocess, tool);
					}

					var params = {
						title: file.name,
						attributes: {
							clipStart: clipStart,
							clipEnd: clipEnd
						},
						file: {
							data: this.result,
							video: true
						}
					};

					if(state.publisherId && state.streamName) { // if edit existent stream
						params.publisherId = state.publisherId;
						params.streamName = state.streamName;
						params.file.name = file.name;

						// for some reason attributes with null values doesn't send to backend in request
						// so specially update attributes
						if (Q.Streams.isStream(tool.stream)) {
							tool.stream.setAttribute("clipStart", clipStart);
							tool.stream.setAttribute("clipEnd", clipEnd);
							tool.stream.save();
						}

						if (window.FileReader) {
							Q.request(state.fileUploadUHandler, 'data', function (err, res) {
								//console.log(this);
								var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(res && res.errors);
								if (msg) {
									if(state.mainDialog) state.mainDialog.removeClass('Q_uploading');
									return Q.handle([state.onError, state.onFinish], tool, [msg]);
								}

								// by default set src equal to first element of the response
								var key = Q.firstKey(res.slots.data, {nonEmpty: true});

								Q.handle([state.onSuccess, state.onFinish], tool, [res.slots.data, key, file || null]);

								Q.Dialogs.pop();
							}, {
								fields: params,
								method: "put"
							});
						} else {
							Q.alert('FileReader undefined');
							/*
                            delete params.data;
                            state.input.wrap('<form />', {
                                method: "put",
                                action: Q.url(state.fileUploadUHandler, params)
                            }).parent().submit();
                            state.input.unwrap();
                            */
						}
					} else { // if new stream
						Q.handle([state.onSuccess, state.onFinish], tool, [params]);
						Q.Dialogs.pop();
					}
				};
				reader.onerror = function () {
					setTimeout(function () {
						callback("Error reading file", res);
					}, 0);
				};

				reader.readAsDataURL(file);
			} else if (action === "edit") {
				// edit stream attributes
				if (!Q.Streams.isStream(tool.stream)) {
					return _error("Stream not found");
				}
				tool.stream.setAttribute("clipStart", clipStart);
				tool.stream.setAttribute("clipEnd", clipEnd);
				tool.stream.save({
					onSave: function () {
						Q.handle([state.onSuccess, state.onFinish], tool);
						Q.Dialogs.pop();
					}
				});
			} else {
				_error("Incorrect action " + action);
			}
		};

		Q.Dialogs.push({
			className: 'Q_dialog_video',
			title: "Video",
			template: {
				name: 'Q/video/composer',
				fields: {
					isComposer: state.isComposer,
					text: tool.text,
					uploadLimit: tool.text.uploadLimit.interpolate({size: tool.humanFileSize(Q.info.maxUploadSize)})
				}
			},
			destroyOnClose: true,
			onActivate : function (mainDialog) {
				state.mainDialog = mainDialog;

				// if stream defined, render player
				if (tool.stream) {
					var $videoElement = $(".Q_video_composer_content [data-content=edit] .Q_video_composer_preview", mainDialog);
					var $clipElement = $(".Q_video_composer_content [data-content=edit] .Q_video_composer_clip", mainDialog);

					$videoElement.tool("Q/video", {
						action: "implement",
						clipStart: tool.stream.getAttribute('clipStart'),
						clipEnd: tool.stream.getAttribute('clipEnd'),
						url: tool.stream.fileUrl()
					}).activate(function () {
						var toolPreview = this;
						var clipStart = tool.stream.getAttribute('clipStart');
						var clipEnd = tool.stream.getAttribute('clipEnd');

						$clipElement.tool("Q/clip", {
							startPosition: clipStart,
							startPositionDisplay: clipStart.convertTimeToString(),
							endPosition: clipEnd,
							endPositionDisplay: clipEnd.convertTimeToString(),
							onStart: function (setNewPosition) {
								if (setNewPosition) {
									var time = toolPreview.state.currentPosition;

									toolPreview.state.clipStart = time;
									this.setPosition(time, time.toString().convertTimeToString(), "start");
								} else {
									toolPreview.state.clipStart = null;
								}
							},
							onEnd: function (setNewPosition) {
								if (setNewPosition) {
									var time = toolPreview.state.currentPosition;

									toolPreview.state.clipEnd = time;
									this.setPosition(time, time.toString().convertTimeToString(), "end");
								} else {
									toolPreview.state.clipEnd = null;
								}
							}
						}).activate(function () {
							toolPreview.clipTool = this;
						});
					});
				}

				// save by URL
				$("button[name=save]", mainDialog).on(Q.Pointer.click, function (e) {
					e.preventDefault();
					e.stopPropagation();

					mainDialog.addClass('Q_uploading');

					var _error = function (err) {
						mainDialog.removeClass('Q_uploading');
						Q.alert(err);
					};
					var action = mainDialog.attr("data-action");

					if (action === 'upload') {
						if (!$("input[type=file]", mainDialog).val()) {
							return _error(tool.text.invalidFile);
						}
					} else if (action === 'link') {
						var url = $("input[name=url]", mainDialog).val();
						if (!url.matchTypes('url').length) {
							return _error(tool.text.invalidURL);
						}
					} else if (state.isComposer) {
						return _error(tool.text.errorNoSource);
					}

					Q.handle(_process, mainDialog);
				});

				// custom tabs implementation
				$(".Q_video_composer_select button", mainDialog).on(Q.Pointer.click, function (e) {
					var $this = $(this);
					var action = $this.prop('name');

					if (action === "record") {
						tool.recorderStateChange("init");
					}

					mainDialog.attr("data-action", action);
					$this.addClass('Q_selected').siblings().removeClass('Q_selected');
					$(".Q_video_composer_content [data-content=" + action + "]", mainDialog).addClass('Q_selected').siblings().removeClass('Q_selected');

					// pause all exists players
					Q.each($(".Q_video_tool", mainDialog), function () {
						var videoTool = Q.Tool.from(this, "Q/video");

						if (videoTool) {
							videoTool.pause();
						}
					});
				});

				// Reset button
				$("button[name=reset]", mainDialog).on(Q.Pointer.click, function (e) {
					state.dataBlob = undefined;

					Q.each($(".Q_video_composer_content [data-content=link], .Q_video_composer_content [data-content=upload]", mainDialog), function (i, content) {
						var videoTool = Q.Tool.from($(".Q_video_composer_preview", content)[0], "Q/video");
						var clipTool = Q.Tool.from($(".Q_video_composer_clip", content)[0], "Q/clip");

						// remove Q/video and Q/clip tools from upload and link sections
						Q.each([videoTool, clipTool], function (i, resetTool) {
							if (Q.typeOf(resetTool) !== 'Q.Tool') {
								return;
							}

							Q.Tool.remove(resetTool.element, true);
							resetTool.element.innerHTML = '';
						});
					});
				});

				// set clip start/end for upload
				$("input[type=file]", mainDialog).on('change', function () {
					var $videoElement = $(".Q_video_composer_content [data-content=upload] .Q_video_composer_preview", mainDialog);
					var $clipElement = $(".Q_video_composer_content [data-content=upload] .Q_video_composer_clip", mainDialog);
					var url = URL.createObjectURL(this.files[0]);
					var toolPreview = Q.Tool.from($videoElement, "Q/video");

					// check file size
					if (this.files[0].size >= parseInt(Q.info.maxUploadSize)) {
						this.value = null;
						return Q.alert(tool.text.errorFileSize.interpolate({size: tool.humanFileSize(Q.info.maxUploadSize)}));
					}

					// if video tool exists, clear url object
					if (toolPreview) {
						URL.revokeObjectURL(toolPreview.state.url);
					}

					Q.Tool.remove($videoElement[0], true);
					Q.Tool.remove($clipElement[0], true);

					$videoElement.empty();
					$clipElement.empty();

					$videoElement.tool("Q/video", {
						action: "implement",
						url: url
					}).activate(function () {
						toolPreview = this;
						$clipElement.tool("Q/clip", {
							onStart: function (setNewPosition) {
								if (setNewPosition) {
									var time = toolPreview.state.currentPosition;

									toolPreview.state.clipStart = time;
									this.setPosition(time, time.toString().convertTimeToString(), "start");
								} else {
									toolPreview.state.clipStart = null;
								}
							},
							onEnd: function (setNewPosition) {
								if (setNewPosition) {
									var time = toolPreview.state.currentPosition;

									toolPreview.state.clipEnd = time;
									this.setPosition(time, time.toString().convertTimeToString(), "end");
								} else {
									toolPreview.state.clipEnd = null;
								}
							}
						}).activate(function () {
							toolPreview.clipTool = this;
						});
					});
				});

				// set clip start/end for link
				$("button[name=setClip]", mainDialog).on(Q.Pointer.fastclick, function () {
					var $videoElement = $(".Q_video_composer_content [data-content=link] .Q_video_composer_preview", mainDialog);
					var $clipElement = $(".Q_video_composer_content [data-content=link] .Q_video_composer_clip", mainDialog);
					var url = $("input[name=url]", mainDialog).val();
					if (!url.matchTypes('url').length) {
						return Q.alert(tool.text.invalidURL);
					}

					Q.Tool.remove($videoElement[0], true);
					Q.Tool.remove($clipElement[0], true);

					$videoElement.empty();
					$clipElement.empty();

					$videoElement.tool("Q/video", {
						action: "implement",
						url: url
					}).activate(function () {
						var toolPreview = this;
						$clipElement.tool("Q/clip", {
							onStart: function (setNewPosition) {
								if (setNewPosition) {
									var time = toolPreview.state.currentPosition;

									toolPreview.state.clipStart = time;
									this.setPosition(time, time.toString().convertTimeToString(), "start");
								} else {
									toolPreview.state.clipStart = null;
								}
							},
							onEnd: function (setNewPosition) {
								if (setNewPosition) {
									var time = toolPreview.state.currentPosition;

									toolPreview.state.clipEnd = time;
									this.setPosition(time, time.toString().convertTimeToString(), "end");
								} else {
									toolPreview.state.clipEnd = null;
								}
							}
						}).activate(function () {
							toolPreview.clipTool = this;
						});
					});
				});

				$(".Q_video_composer_select button:visible:first", mainDialog).click();
			},
			beforeClose: function(mainDialog) {
				// clear recorder stream when dialog close.
				// In this case every time dialog opened - user should allow to use microphone
				if(state.recorder && state.recorder.stream) {
					state.recorder.clearStream();
				}
			}
		});
	},
	/**
	 *
	 * @method initPlayer
	 */
	initPlayer: function (options) {
		var tool = this;
		var state = this.state;
		var throttle = state.throttle;

		var _getCurrentPostion = function () {
			return Math.trunc(state.player.currentTime() * 1000);
		};

		var onPlay = Q.throttle(function () {
			var position = state.currentPosition || _getCurrentPostion();
			console.log("Started at position " + position + " milliseconds");
			Q.handle(state.onPlay, tool, [position]);
		}, throttle);
		var onPause = Q.throttle(function () {
			var position = state.currentPosition || _getCurrentPostion();
			console.log("Paused at position " + position + " milliseconds");
			Q.handle(state.onPause, tool, [position]);
		}, throttle);
		var onSeek = Q.throttle(function () {
			var position = state.currentPosition || _getCurrentPostion();
			console.log("Seeked at position " + position + " milliseconds");
			Q.handle(state.onSeek, tool, [position]);
		}, throttle);
		var onEnded = Q.throttle(function () {
			var position = state.currentPosition || _getCurrentPostion();
			console.log("Seeked at position " + position + " milliseconds");
			Q.handle(state.onEnded, tool, [position]);
		}, throttle);

		state.player = videojs(tool.$video[0], options, function onPlayerReady() {
			videojs.log('Your player is ready!');

			state.currentPosition = 0;

			this.on('play', function () {
				onPlay();
			});

			this.on('pause', function () {
				onPause();
			});

			this.on('seeking', function() {
				onPause();
			});

			this.on('waiting', function() {
				onPause();
			});

			this.on('seeked', function() {
				onPlay();
				onSeek();
			});

			this.on('ended', function() {
				onPause();
				onEnded();
			});

			// update currentPosition array on play
			this.on('timeupdate', function() {
				setTimeout(function(){
					state.currentPosition = _getCurrentPostion();
					Q.handle(state.onPlaying, tool, [state.currentPosition]);
				}, 500);
			});
		});
	},
	/**
	 * @method play
	 */
	play: function () {
		this.state.player && this.state.player.play();
	},
	/**
	 * @method pause
	 */
	pause: function () {
		this.state.player && this.state.player.pause();
	},
	/**
	 * @method setCurrentPosition
	 * @param {integer} position in milliseonds
	 */
	setCurrentPosition: function (position) {
		this.state.player && this.state.player.currentTime(position/1000);
	},
	/**
	 * Detect adapter from url
	 * @method adapterNameFromUrl
	 */
	adapterNameFromUrl: function () {
		var url = this.state.url;
		if (!url) {
			throw new Q.Exception(this.id + ": url is required");
		}
		var newA = document.createElement('A');
		newA.href = url;
		var host = newA.hostname;

		if (host.includes("youtube.com") || host.includes("youtu.be")) {
			return 'youtube';
		}
		if (host.includes("vimeo.com")) {
			return 'vimeo';
		}

		var ext = url.split('.').pop();
		switch(ext) {
			case 'webm': return 'webm';
			case 'ogg': return 'ogg';
			default: return 'mp4';
		}
		//throw new Q.Exception(this.id + ': No adapter for this URL');
	},
	/**
	 * Convert bytes integer to human readable string
	 * @method humanFileSize
	 */
	humanFileSize: function humanFileSize(bytes, si=false, dp=1) {
		var thresh = si ? 1000 : 1024;

		if (Math.abs(bytes) < thresh) {
			return bytes + ' B';
		}

		/*var units = si
			? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
			: ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
		*/
		var units = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
		var u = -1;
		var r = 10**dp;

		do {
			bytes /= thresh;
			++u;
		} while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


		return bytes.toFixed(dp) + ' ' + units[u];
	}
});

Q.Template.set('Q/video/composer',
	'<div class="Q_video_composer" data-composer="{{isComposer}}"><form>'
	+ '  <div class="Q_video_composer_select">'
	+ '  	<button name="edit" type="button">{{text.edit}}</button>'
	+ '  	<button name="upload" type="button">{{text.upload}}</button>'
	+ '  	<button name="link" type="button">{{text.link}}</button>'
	+ '  </div>'
	+ '  <div class="Q_video_composer_content">'
	+ '	 	<div data-content="edit">'
	+ '			<div class="Q_video_player"></div>'
	+ '			<div class="Q_video_composer_preview"></div>'
	+ '			<div class="Q_video_composer_clip"></div>'
	+ '  	</div>'
	+ '  	<div data-content="upload">'
	+ '	   		<input type="file" accept="video/*" class="Q_video_file" />'
	+ '			<div class="Q_video_composer_upload_limit">{{uploadLimit}}</div>'
	+ '			<div class="Q_video_composer_preview"></div>'
	+ '			<div class="Q_video_composer_clip"></div>'
	+ '		</div>'
	+ '  	<div data-content="link">'
	+ '	   		<label>'
	+ '				<input name="url" placeholder="{{text.seturl}}" type="url">'
	+ '				<button name="setClip" type="button" class="Q_button">{{text.setClip}}</button>'
	+ '			</label>'
	+ '			<div class="Q_video_composer_preview"></div>'
	+ '			<div class="Q_video_composer_clip"></div>'
	+ '		</div>'
	+ '  </div>'
	+ '  <div class="Q_video_composer_submit"><button name="save" class="Q_button" type="button">{{text.save}}</button><button name="reset" type="reset" class="Q_button">{{text.reset}}</button></div>'
	+ '</form></div>'
);

Q.Template.set('Q/video/videojs',
	'<video preload="auto" controls class="video-js vjs-default-skin vjs-4-3" width="100%" height="auto" {{autoplay}}/>'
);

})(window, Q, jQuery);
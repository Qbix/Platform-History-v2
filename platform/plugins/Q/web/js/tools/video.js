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
 *  @param {string} [options.start] start position in milliseconds
 *  @param {string} [options.clipStart] Clip start position in milliseconds
 *  @param {string} [options.clipEnd] Clip end position in milliseconds
 *  @param {string} [options.className] Additional class name to add to tool element
 *  @param {object} [options.metrics=null] Params for State.Metrics (publisherId and streamName required)
 *  @param {object} [options.clips] Contains options for "clips" mode.
 *  @param {function} [options.clips.handler] The main option which return clip url for some timestamp. If it null - means mode is not "clips"
 *  @param {integer} [options.clips.duration] Clips duration in seconds. If defined the clips will play this fixed duration. If null clips will play till the end.
 *  @param {integer} [options.clips.oneSecondPercent=1/6] How much percents one second used on timeline. By default 1/6 - which means 60 seconds will use 10% of timeline.
 *  @param {Integer} [options.positionUpdatePeriod=1] Time period in seconds to check new play position.
 *  @param {boolean} [options.autoplay=false] If true - start play on load
 *  @param {array} [options.ads] Array of ads in format [{position:<minutes>, url:<string>}, ...]
 */
Q.Tool.define("Q/video", function (options) {
	var tool = this;
	var state = tool.state;

	if (state.url) {
		state.url = state.url.interpolate({ "baseUrl": Q.info.baseUrl });
	}

	if (state.className) {
		$(tool.element).addClass(state.className);
	}

	tool.adapters = {};

	if (!Q.isEmpty(state.metrics)) {
		tool.metrics = new Q.Streams.Metrics(state.metrics);
	}

	tool.adapters.mp4 = {
		init: function () {
			var options = {
				sources: [{
					src: state.url,
					type: 'video/mp4'
				}]
			};

			tool.initVideojsPlayer(options);
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

			tool.initVideojsPlayer(options);
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

			tool.initVideojsPlayer(options);
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
						ytControls: 0,
						playsinline: 1
					}
				};

				tool.initVideojsPlayer(options);
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

				tool.initVideojsPlayer(options);
			});
		}
	};
	tool.adapters.twitch = {
		init: function () {
			var element = tool.element;
			var throttle = state.throttle;

			var newA = document.createElement('A');
			newA.href = state.url;
			var host = newA.hostname;

			element.classList.add("Q_video_twitch");

			var options = {
				autoplay: false
				//channel: "<channel ID>",
				//video: "782042263",
				//collection: "<collection ID>"
			};

			// convert start time to pass as option
			var start = state.start || state.clipStart;
			options.time = Q.displayDuration(start).replace(/:/, 'h').replace(/:/, 'm') + 's';

			var videoId = state.url.match(/\/videos?\/([0-9]+).*$/);
			var channel = state.url.match(new RegExp(host + "/(\\w+)"));
			if (videoId) {
				options.video = videoId[1];
			} else if (channel) {
				options.channel = channel[1];
			} else {
				throw new Q.Error("Q/video/twitch: none of videoId or channel filled");
			}

			Q.addScript("{{Q}}/js/twitch/lib.js", function () {
				state.player = new Twitch.Player(element, options);

				/**
				 * Implemented global function "currentTime" to set/get position
				 * @method currentTime
				 * @param {integer} [time] If defined, set play position. If not, return current pos.
				 */
				state.player.currentTime = function (time) {
					if (!isNaN(time)) {
						state.player.seek(time);
						return time;
					}

					return state.player.getCurrentTime();
				};

				/**
				 * Implemented global function "muted" to on/off sound
				 * @method muted
				 * @param {boolean} [value=true] If true/false, turn off/on sound.
				 */
				state.player.muted = function (value) {
					if (typeof value === "boolean") {
						state.player.setMuted(value);
					} else {
						return state.player.getMuted();
					}
				};

				/**
				 * Trigger to show/hide loading spinner above player
				 * @method waiting
				 * @param {boolean} [status=true] If true/false - show/hide spinner.
				 */
				state.player.waiting = function (status) {
					if (status || typeof status === "undefined") {
						$('<div class="Q_video_spinner">').appendTo(state.player._target);
					} else {
						$(".Q_video_spinner", state.player._target).remove();
					}
				};

				var onPlay = Q.throttle(function () {
					state.currentPosition = tool.getCurrentPosition();
					//console.log("Started at position " + state.currentPosition + " milliseconds");
					Q.handle(state.onPlay, tool);
				}, throttle);
				var onPause = Q.throttle(function () {
					var position = tool.getCurrentPosition();
					//console.log("Paused at position " + position + " milliseconds");
					Q.handle(state.onPause, tool);
				}, throttle);
				var onEnded = Q.throttle(function () {
					var position = tool.getCurrentPosition();
					//console.log("Seeked at position " + position + " milliseconds");
					Q.handle(state.onEnded, tool);
				}, throttle);

				state.player.addEventListener(Twitch.Player.PLAY, onPlay);
				state.player.addEventListener(Twitch.Player.PAUSE, onPause);
				state.player.addEventListener(Twitch.Player.ENDED, onEnded);
				state.player.addEventListener(Twitch.Player.READY, function () {
					Q.handle(state.onLoad, tool);
				});
			});
		}
	};

	//tool.adapters.youtube = tool.adapters.vimeo = tool.adapters.mp4 = tool.adapters.webm = tool.adapters.general;

	var p = Q.pipe(['stylesheet', 'text', 'scripts'], function (params, subjects) {
		tool.text = params.text[1].video;
		tool.implement();
	});

	Q.addStylesheet(["{{Q}}/css/videojs.css", "{{Q}}/css/video.css"], p.fill('stylesheet'), { slotName: 'Q' });
	Q.addScript("{{Q}}/js/videojs/lib.js", p.fill('scripts'));
	Q.Text.get('Q/content', p.fill('text'));
},

{
	url: null,
	autoplay: false,
	throttle: 10,
	currentPosition: 0,
	className: null,
	positionUpdatePeriod: 1, // seconds
	start: null,
	clipStart: null,
	clipEnd: null,
	ads: [],
	adsTimeOut: 10,
	overlay: {
		play: {
			src: '{{Q}}/img/play.png'
		}
	},
	metrics: {
		useFaces: false
	},
	videojsOptions: {
		controls: true,
		inactivityTimeout: 0
	},
	clips: {
		handler: null,
		duration: null,
		oneSecondPercent: 1/6
	},
	onSuccess: new Q.Event(),
	onError: new Q.Event(function (message) {
		Q.alert('File upload error' + (message ? ': ' + message : '') + '.');
	}, 'Q/video'),
	onFinish: new Q.Event(),
	onLoad: new Q.Event(function () {
		this.setCurrentPosition(this.calculateStartPosition(), !this.state.skipPauseOnload, !this.state.skipPauseOnload);
		this.addAdvertising();
	}),
	onCanPlay: new Q.Event(function () {
		this.setCurrentPosition(this.calculateStartPosition(), !this.state.skipPauseOnload, !this.state.skipPauseOnload);
	}),
	onPlay: new Q.Event(function () {
		var tool = this;
		var state = this.state;

		this.checkClip();

		tool.clearPlayInterval();
		state.playIntervalID = setInterval(function() {
			var currentPosition = tool.getCurrentPosition();

			if (state.currentPosition === currentPosition) {
				return;
			}

			state.currentPosition = (currentPosition || state.clips.start || 0);
			Q.handle(state.onPlaying, tool, [tool]);
		}, state.positionUpdatePeriod * 1000);
	}),
	onPlaying: new Q.Event(function () {
		var state = this.state;

		if (this.metrics) {
			this.metrics.add(state.currentPosition/1000);
		}

		// check clip borders if clip defined
		this.checkClip();

		// update pointers position on timeline for "clips" mode
		this.movePointers();

		if (!state.clips.useNativeDuration) {
			// check clips duration limit
			var clipsDuration = Q.getObject("clips.duration", state);
			if (clipsDuration && state.currentPosition/1000 >= clipsDuration) {
				Q.handle(state.onEnded, this);
			}
		}
	}),
	onPause: new Q.Event(function () {
		this.clearPlayInterval();
	}),
	onSeek: new Q.Event(),
	onEnded: new Q.Event(function () {
		var tool = this;
		var state = this.state;

		// stop timer if exist
		this.clearPlayInterval();

		// check clips to play next
		var pointers = Q.getObject("clips.pointers", state);
		if (!Q.isEmpty(pointers)) {
			var nextPointer = null;
			var i = 1000;
			Q.each(pointers, function () {
				var start = parseFloat(this.$start.attr("data-time"));

				// only next points
				if (start < 0 || state.url === this.url) {
					return;
				}

				var offsetDeviation = this.offset - state.clips.offset;
				if (offsetDeviation > 0 && offsetDeviation < i) {
					i = offsetDeviation;
					nextPointer = this;
				}
			});
			if (nextPointer) {
				tool.changeSource(nextPointer);
			}
		}
	})
},

{
	/**
	 * Change current player source.
	 * @method changeSource
	 * @param {object} source Object with properties: url, duration, offset, ...
	 */
	changeSource: function (source) {
		var state = this.state;
		var player = state.player;

		state.url = source.url;
		player.src(source.url);

		state.clips.duration = source.duration;

		// don't pause when new clip loaded
		state.skipPauseOnload = true;

		// set offset to duration of prev clip
		state.clips.offset = source.offset;
	},
	/**
	 * Check clip borders and pause if outside
	 * @method checkClip
	 */
	checkClip: function () {
		var tool = this;
		var state = this.state;
		var currentPosition = tool.getCurrentPosition();

		// clipStart handler
		if (state.clipStart && currentPosition < state.clipStart) {
			tool.setCurrentPosition(state.clipStart);
		}
		// clipStart handler
		if (state.clipEnd && currentPosition > state.clipEnd) {
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

		var adapterName = tool.adapterNameFromUrl();
		tool.adapters[adapterName].init();
	},
	/**
	 *
	 * @method initVideojsPlayer
	 */
	initVideojsPlayer: function (options) {
		var tool = this;
		var state = this.state;
		var throttle = state.throttle;

		options = Q.extend(state.videojsOptions, options);

		Q.Template.render('Q/video/videojs', {
			autoplay: state.autoplay ? 'autoplay' : '',
			timeOut: state.adsTimeOut
		}, function (err, html) {
			tool.element.innerHTML = html;

			var onPlay = Q.throttle(function () {
				var position = state.currentPosition || tool.getCurrentPosition();
				//console.log("Started at position " + position + " milliseconds");

				Q.handle(state.onPlay, tool, [position]);
			}, throttle);
			var onPause = Q.throttle(function () {
				var position = state.currentPosition || tool.getCurrentPosition();
				//console.log("Paused at position " + position + " milliseconds");
				Q.handle(state.onPause, tool, [position]);
			}, throttle);
			var onSeek = Q.throttle(function () {
				var position = state.currentPosition || tool.getCurrentPosition();
				//console.log("Seeked at position " + position + " milliseconds");
				Q.handle(state.onSeek, tool, [position]);
			}, throttle);
			var onEnded = Q.throttle(function () {
				var position = state.currentPosition || tool.getCurrentPosition();
				//console.log("Seeked at position " + position + " milliseconds");
				Q.handle(state.onEnded, tool, [position]);
			}, throttle);

			state.player = videojs($("video", tool.element)[0], options, function onPlayerReady() {
				var player = this;

				videojs.log('Your player is ready!');

				this.on('play', function () {
					onPlay();
				});

				this.on('pause', function () {
					onPause();
				});

				//this.on('waiting', function() {
				//	onPause();
				//});

				this.on('seeked', function() {
					onSeek();
				});

				this.on('ended', function() {
					onEnded();
				});

				// apply play button image
				$(".vjs-big-play-button", this.el_).css("background-image", "url(" +Q.url(state.overlay.play.src) + ")");

				var playerElement = player.el_;

				/**
				 * Trigger to show/hide loading spinner above player
				 * @method waiting
				 * @param {boolean} [state=true] If true - show spinner, false - hide.
				 */
				this.waiting = function (state) {
					if (state || typeof state === "undefined") {
						player.addClass("vjs-waiting");

						// need to check eventBusEl_ to avoid error from videojs lib
						if (playerElement) {
							// this event show preloader spinner
							player.trigger("waiting");
						}
					} else {
						player.removeClass("vjs-waiting");

						// need to check eventBusEl_ to avoid error from videojs lib
						if (playerElement) {
							player.trigger("canplay");
						}
					}
				};

				// call onLoad when loadedmetadata event occured
				this.on("loadedmetadata", function() {
					Q.handle(state.onLoad, tool);
				});

				this.on("canplay", function() {
					if (this.canplay) {
						return;
					}

					this.canplay = true;

					Q.handle(state.onCanPlay, tool);
				});

				// apply clips mode if clips.handler defined
				if (Q.getObject("clips.handler", state)) {
					// set autoplay to autostart next clip
					state.player.autoplay(true);

					// render custom player controls
					Q.Template.render("Q/video/clips/control", {}, function (err, html) {
						var $newControls = $(html);

						// wait till all control elements rendered
						var waitControls = setInterval(function () {
							var nativeControl = {
								$controls: $(".vjs-control-bar", playerElement),
								$playButton: $(".vjs-control-bar .vjs-play-control", playerElement),
								$volumeControl: $(".vjs-control-bar .vjs-volume-panel", playerElement),
								$fullScreen: $(".vjs-control-bar .vjs-fullscreen-control", playerElement),
								$currentTime: $(".vjs-control-bar .vjs-current-time", playerElement)
							};

							var passed = true;

							if (!player.duration()) {
								passed = false;
							}

							Q.each(nativeControl, function () {
								if (!this.length) {
									passed = false;
								}
							});

							if (!passed) {
								return;
							}

							clearInterval(waitControls);

							videojs.log('duration: ' + player.duration());
							state.clips.duration = Q.getObject("clips.duration", state) || Q.getObject("duration", state.clips.handler(0));
							state.duration = state.clips.duration || player.duration();

							nativeControl.$controls.after($newControls).hide();
							$(".vjs-play-control", $newControls).replaceWith(nativeControl.$playButton);
							$(".vjs-volume-panel", $newControls).replaceWith(nativeControl.$volumeControl);
							$(".vjs-fullscreen-control", $newControls).replaceWith(nativeControl.$fullScreen);
							$(".vjs-current-time", $newControls).replaceWith(nativeControl.$currentTime);

							// set clips start position
							state.clips.offset = 0;
							state.clips.pointers = [];

							// fill timeline with clips pointers
							var clipsUsed = [];
							var nextClip;
							var fullTimelineSeconds = 100/state.clips.oneSecondPercent;
							for (var nextClipIndex = -10000; nextClipIndex <= 10000; nextClipIndex++) {
								nextClip = state.clips.handler(-fullTimelineSeconds/2 + nextClipIndex);
								if (!nextClip || clipsUsed.includes(nextClip.url)) {
									continue;
								}

								clipsUsed.push(nextClip.url);
								tool.addPointer(nextClip);
							}

							// progress bar seek handler
							$(".vjs-progress-control", $newControls).on("click", function (e) {
								var $holder = $(".vjs-progress-holder", $newControls);
								var rect = $holder[0].getBoundingClientRect();
								var x = e.clientX - rect.left; //x position within the element.

								// click outside holder
								if (x < 0 || rect.width < x) {
									return;
								}

								var offset = state.clips.offset + tool.getCurrentPosition()/1000 + ((x / rect.width * 100) - 50)/state.clips.oneSecondPercent ;

								// search pointer to move to
								Q.each(state.clips.pointers, function () {
									if (this.start > offset || this.end < offset) {
										return;
									}

									// change offset to move timeline
									state.clips.offset = this.offset;

									var seekedPosition = (offset - this.start) * 1000; // in milliseconds

									// move timeline
									tool.movePointers(null, seekedPosition);

									//return;
									if (state.url === this.url) {
										tool.setCurrentPosition(seekedPosition);
									} else {
										// set next clip start position
										state.clips.start = seekedPosition;

										// change source
										tool.changeSource(this);
									}
								});

							});
						}, 500);
					});
				}
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
	 * Add clip pointer to timeline
	 * @method addPointer
	 * @param {object} clip
	 */
	addPointer: function (clip) {
		var tool = this;
		var state = this.state;

		var start = state.clips.offset + clip.offset;
		var end = start + clip.duration;

		clip.$start = $("<div class='Q_video_clips_pointer' data-time='" + start + "'>").appendTo($(".Q_video_clips_control .vjs-progress-control", tool.element));
		clip.$end = $("<div class='Q_video_clips_pointer' data-time='" + end + "'>").appendTo($(".Q_video_clips_control .vjs-progress-control", tool.element));
		clip.start = start;
		clip.end = end;

		state.clips.pointers.push(clip);

		// place on timeline
		tool.movePointers(clip);
	},
	/**
	 * Change clips pointers position on timeline.
	 * @method movePointers
	 * @param {object} [pointer] Pointer to move. If empty move all pointers.
	 * @param {number} [offset] Offset in milliseconds to move pointer inside clip
	 */
	movePointers: function (pointer, offset) {
		var state = this.state;
		var pointers = state.clips.pointers;

		if (Q.isEmpty(pointer) && Q.isEmpty(pointers)) {
			return;
		}

		var oneSecondPercent = state.clips.oneSecondPercent;
		var _handler = function () {
			var $start = this.$start;
			var $end = this.$end;

			var startLeft = 50 + this.start * oneSecondPercent - (offset || state.currentPosition)/1000*oneSecondPercent - state.clips.offset*oneSecondPercent;
			var endLeft = startLeft + this.duration * oneSecondPercent;

			$start[0].style.left = startLeft + '%';
			startLeft > 98 || startLeft < 2 ? $start.hide() : $start.show();

			$end[0].style.left = endLeft + '%';
			endLeft > 98 || endLeft < 2 ? $end.hide() : $end.show();
		};

		if (pointer) {
			return Q.handle(_handler, pointer);
		}

		// move all pointers
		Q.each(pointers, _handler);
	},
	/**
	 * @method addAdvertising
	 */
	addAdvertising: function () {
		var tool = this;
		var state = this.state;
		var player = state.player;
		var ads = state.ads;
		var timeOut = state.adsTimeOut;

		if (Q.isEmpty(ads)) {
			return;
		}

		Q.addStylesheet("{{Q}}/css/videojs.markers.min.css");
		Q.addScript("{{Q}}/js/videojs/plugins/videojs-markers.js", function () {
			var markers = [];

			// wait till duration
			var durationTimeId = setInterval(function () {
				var duration = player.duration();
				if (!duration) {
					return;
				}

				clearInterval(durationTimeId);

				Q.each(ads, function (i) {
					if (typeof this.position === "string" && this.position.includes("%")) {
						this.position = duration / 100 * parseInt(this.position);
					}

					markers.push({
						time: this.position,
						text: "Advertising " + (i+1),
						index: i,
						url: this.url
					});
				});

				if (typeof player.markers !== "function") {
					return;
				}

				player.markers({
					breakOverlay: {
						display: false
					},
					onMarkerReached: function(marker) {
						if (Q.isEmpty(marker)) {
							return;
						}

						player.pause();
						player.addClass("Q_video_hidden");

						$("<div>").appendTo(tool.element).tool("Q/video", {
							url: marker.url,
							autoplay: true,
							metrics: null,
							className: "Q_video_advertising Q_current",
							positionUpdatePeriod: 1,
							onLoad: function () {
								var advTool = this;
								advTool.play();

								Q.Template.render('Q/video/skip', {
									text: tool.text,
									timeOut: state.adsTimeOut
								}, function (err, html) {
									$(html).appendTo(advTool.element);
								});

								player.pause();
							},
							onPlaying: function () {
								var advTool = this;
								var $skipElement = $(".Q_video_skip", this.element);
								if (!$skipElement.length) {
									return;
								}

								var $timeToSkip = $(".Q_video_skip_time", $skipElement);
								var timeToSkip = parseInt($timeToSkip.text());
								if (!timeToSkip || timeToSkip <= 0) {
									$(".Q_video_skip_after", $skipElement).html(tool.text.Skip);
									$(".Q_video_skip_time", $skipElement).html(">>");
									$skipElement.on(Q.Pointer.fastclick, function () {
										Q.handle(advTool.state.onEnded, advTool);
									});
								} else {
									$timeToSkip.html(timeToSkip-1);
								}

								player.pause();
							},
							onEnded: function () {
								Q.Tool.remove(this.element, true, true);
								player.markers.remove([0]);
								player.removeClass("Q_video_hidden");
								player.play();
							}
						}).activate();
					},
					markers: markers
				});
				player.trigger("loadedmetadata");
			}, 1000);
		});
	},
	/**
	 * @method setCurrentPosition
	 * @param {integer} position in milliseonds
	 * @param {boolean} [silent=false] whether to mute sound while setting position
	 * @param {boolean} [pause=false] whether to pause video after position changed
	 */
	setCurrentPosition: function (position, silent, pause) {
		var tool = this;
		var state = this.state;
		var player = state.player;
		var currentPosition = tool.getCurrentPosition();

		if (position === 0) {
			position = 1;
		}

		if (currentPosition === position) {
			return;
		}

		if (silent) {
			player.muted(true);
			player.waiting(true);
		}

		player.currentTime(position/1000);

		// this event need to show videojs control bar
		player.hasStarted && player.hasStarted(true);

		if (silent || pause) {
			// wait for start position
			var counter = 0;
			var intervalId = setInterval(function() {
				var currentPosition = tool.getCurrentPosition();

				if (currentPosition === position || counter > 10) {
					if (silent) {
						player.muted(state.videojsOptions.muted || false);
						player.waiting(false);
					}

					if (pause) {
						player.pause();

						// this event need to set status paused, because for some reason it stay in status vjs-playing
						player.trigger && player.trigger('pause');
					}

					clearInterval(intervalId);
				}

				counter++;
			}, 200);
		}
	},
	/**
	 * @method getCurrentPosition
	 */
	getCurrentPosition: function () {
		return Math.trunc(this.state.player.currentTime() * 1000);
	},
	/**
	 * Detect adapter from url
	 * @method adapterNameFromUrl
	 * @param {string} url
	 */
	adapterNameFromUrl: function (url) {
		url = url || this.state.url;
		if (!url) {
			throw new Q.Exception(this.id + ": url is required");
		}
		var newA = document.createElement('A');
		newA.href = url;
		var host = newA.hostname;

		if (host.includes("youtube.com") || host.includes("youtu.be")) {
			return 'youtube';
		} else if (host.includes("vimeo.com")) {
			return 'vimeo';
		} else if (host.includes("twitch")) {
			return 'twitch';
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
	 *
	 * @method calculateStartPosition
	 */
	calculateStartPosition: function () {
		var state = this.state;
		var start = 0;

		if (state.clipStart) {
			start = parseInt(state.clipStart) || 0;
		}
		if (state.start) {
			start = parseInt(state.start) || 0;
		}
		if (state.clips.start) {
			start = parseInt(state.clips.start) || 0;

			// avoid from seeking next clip
			state.clips.start = null;
		}

		return start;
	},
	/**
	 *
	 * @method clearPlayInterval
	 */
	clearPlayInterval: function () {
		if (this.state.playIntervalID) {
			clearInterval(this.state.playIntervalID);
			this.state.playIntervalID = false;
		}
	},
	Q: {
		beforeRemove: function () {
			this.clearPlayInterval();

			// if videojs, call dispose to kill this player with events, triggers, dom etc
			if (Q.getObject("player.dispose", this.state)) {
				this.state.player.dispose();
			}

			if (this.metrics) {
				this.metrics.stop();
			}
		}
	}
});

Q.Template.set("Q/video/videojs",
	'<video preload="auto" controls class="video-js vjs-default-skin vjs-4-3" width="100%" height="auto" {{autoplay}} playsinline webkit-playsinline />'
);

Q.Template.set("Q/video/skip",
	'<span class="Q_video_skip">' +
	'	<span class="Q_video_skip_after">{{text.SkipAfter}}</span> <span class="Q_video_skip_time">{{timeOut}}</span>' +
	'</div>'
);

Q.Template.set("Q/video/clips/control",
	'<div class="vjs-control-bar Q_video_clips_control" dir="ltr">' +
	'	<div class="vjs-play-control"></div>' +
	'	<div class="vjs-volume-panel"></div>' +
	'	<div class="vjs-current-time"></div>' +
	'	<div class="vjs-progress-control vjs-control">' +
	'		<div class="vjs-progress-holder vjs-slider vjs-slider-horizontal" role="slider" aria-label="Progress Bar">' +
	'			<div class="vjs-play-progress vjs-slider-bar" aria-hidden="true" style="width: 50%;"></div>' +
	'		</div>' +
	'	</div>' +
	'	<div class="vjs-fullscreen-control"></div>' +
	'</div>'
);

})(window, Q, jQuery);
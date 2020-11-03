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
 *  @param {string} [options.clipStart] Clip start position in milliseconds
 *  @param {string} [options.clipEnd] Clip end position in milliseconds
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
						ytControls: 2
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
			if (state.clipStart) {
				options.time = state.clipStart.convertTimeToString(false).replace(/:/, 'h').replace(/:/, 'm') + 's';
			}

			var videoId = state.url.match(/\/videos\/([0-9]+).*$/);
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
				state.player.currentTime = function (time) {
					state.player.seek(time);
				};

				var _getCurrentPostion = function () {
					return Math.trunc(state.player.getCurrentTime() * 1000);
				};

				var onPlay = Q.throttle(function () {
					state.currentPosition = _getCurrentPostion();
					console.log("Started at position " + state.currentPosition + " milliseconds");
					Q.handle(state.onPlay, tool);

					// clear timer if exist
					tool.clearPlayInterval();

					// start new timer to change needed layout params during play
					state.playIntervalID = setInterval(function(){
						state.currentPosition = _getCurrentPostion();
						Q.handle(state.onPlaying, tool);
					}, 100);
				}, throttle);
				var onPause = Q.throttle(function () {
					var position = _getCurrentPostion();
					console.log("Paused at position " + position + " milliseconds");
					Q.handle(state.onPause, tool);
				}, throttle);
				var onEnded = Q.throttle(function () {
					var position = _getCurrentPostion();
					console.log("Seeked at position " + position + " milliseconds");
					Q.handle(state.onEnded, tool);
				}, throttle);

				state.player.addEventListener(Twitch.Player.PLAY, onPlay);
				state.player.addEventListener(Twitch.Player.PAUSE, onPause);
				state.player.addEventListener(Twitch.Player.ENDED, onEnded);
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
	onPause: new Q.Event(function () {
		this.clearPlayInterval();
	}),
	onSeek: new Q.Event(),
	onEnded: new Q.Event(function () {
		// stop timer if exist
		this.clearPlayInterval();
	})
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

		Q.Template.render('Q/video/videojs', {
			autoplay: state.autoplay ? 'autoplay' : '',
		}, function (err, html) {
			tool.element.innerHTML = html;

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

			state.player = videojs($("video", tool.element)[0], options, function onPlayerReady() {
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
	 * @method clearPlayInterval
	 */
	clearPlayInterval: function () {
		var playIntervalID = this.state.playIntervalID;
		if (playIntervalID) {
			clearInterval(playIntervalID);
			playIntervalID = false;
		}
	},
	Q: {
		beforeRemove: function () {
			this.clearPlayInterval();
		}
	}
});

Q.Template.set('Q/video/videojs',
	'<video preload="auto" controls class="video-js vjs-default-skin vjs-4-3" width="100%" height="auto" {{autoplay}}/>'
);

})(window, Q, jQuery);
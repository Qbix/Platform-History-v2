(function (window, Q, $, undefined) {
	
/**
 * @module Q
 */
	
/**
 * YUIDoc description goes here
 * @class Q video
 * @constructor
 * @param {Object} [options] Override various options for this tool
 *  @param {String} [options.url] URL of audio stream
 *  @param {boolean} [options.autoplay=false] If true - start play on load
 */

Q.Tool.define("Q/video", function (options) {
	var tool = this;
	var state = tool.state;

	if (!state.url) {
		throw new Q.Exception(tool.id + ": url is required");
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
			Q.addScript("{{Q}}/js/videojs/plugins/Youtube.js", function () {
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

	var p = Q.pipe(['stylesheet', 'text', 'scripts'], function (params, subjects) {
		tool.text = params.text[1];
		tool.refresh();
	});

	Q.addStylesheet(["{{Q}}/css/videojs.css", "{{Q}}/css/video.css"], p.fill('stylesheet'), { slotName: 'Q' });
	Q.addScript("{{Q}}/js/videojs/lib.js", p.fill('scripts'));
	Q.Text.get('Q/content', p.fill('text'));
},

{
	url: null,
	autoplay: false,
	throttle: 100,
	onPlay: new Q.Event(),
	onPause: new Q.Event(),
	onSeek: new Q.Event(),
	onEnded: new Q.Event()
},

{
	/**
	 * Refreshes the appearance of the tool completely
	 * @method refresh
	 */
	refresh: function () {
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
	 *
	 * @method initPlayer
	 */
	initPlayer: function (options) {
		var tool = this;
		var state = this.state;
		var throttle = state.throttle;

		var _getCurrentPostion = function () {
			return Math.round(state.player.currentTime() * 1000);
		};

		var onPlay = Q.throttle(function (position) {
			position = position || _getCurrentPostion();
			console.log("Started at position " + position + " milliseconds");
			Q.handle(state.onPlay, tool, [position]);
		}, throttle);
		var onPause = Q.throttle(function (position) {
			position = position || _getCurrentPostion();
			console.log("Paused at position " + position + " milliseconds");
			Q.handle(state.onPause, tool, [position]);
		}, throttle);
		var onSeek = Q.throttle(function (position) {
			position = position || _getCurrentPostion();
			console.log("Seeked at position " + position + " milliseconds");
			Q.handle(state.onSeek, tool, [position]);
		}, throttle);
		var onEnded = Q.throttle(function (position) {
			position = position || _getCurrentPostion();
			console.log("Seeked at position " + position + " milliseconds");
			Q.handle(state.onEnded, tool, [position]);
		}, throttle);

		state.player = videojs(tool.$video[0], options, function onPlayerReady() {
			videojs.log('Your player is ready!');

			var lastPosition = 0;

			this.on('play', function () {
				onPlay();
			});

			this.on('pause', function () {
				onPause(lastPosition);
			});

			this.on('seeking', function() {
				onPause(lastPosition);
			});

			this.on('waiting', function() {
				onPause(lastPosition);
			});

			this.on('seeked', function() {
				onPlay();
				onSeek();
			});

			this.on('ended', function() {
				onPause(lastPosition);
				onEnded(lastPosition);
			});

			// update lastPosition array on play
			this.on('timeupdate', function() {
				setTimeout(function(){
					lastPosition = _getCurrentPostion();
				}, 500);
			});
		});
	},
	/**
	 * @method play
	 */
	play: function () {
		this.state.player.play();
	},
	/**
	 * @method pause
	 */
	pause: function () {
		this.state.player.pause();
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

		if (host.includes("youtube")) {
			return 'youtube';
		}
		if (host.includes("vimeo")) {
			return 'vimeo';
		}
		if (url.split('.').pop() === 'mp4') {
			return 'mp4';
		}
		if (url.split('.').pop() === 'webm') {
			return 'webm';
		}
		if (url.split('.').pop() === 'ogv') {
			return 'ogg';
		}
		throw new Q.Exception(this.id + ': No adapter for this URL');
	}
});

Q.Template.set('Q/video/videojs',
	'<video preload="auto" controls class="video-js vjs-default-skin vjs-4-3" width="100%" height="auto" {{autoplay}}/>'
	//'<div class="Q_audio_container"></div>'
);

})(window, Q, jQuery);
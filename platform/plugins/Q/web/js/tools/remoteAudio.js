(function (window, Q, $, undefined) {
	
/**
 * @module Q
 */
	
/**
 * YUIDoc description goes here
 * @class Q audio
 * @constructor
 * @param {Object} [options] Override various options for this tool
 *  @param {String} [options.url] URL of audio stream
 *  @param {boolean} [options.autoplay=false] If true - start play on load
 */

Q.Tool.define("Q/remoteAudio", function (options) {
	var tool = this;
	var state = tool.state;

	if (!state.url) {
		throw new Q.Exception(tool.id + ": url is required");
	}
	
	tool.adapters = {
		"soundcloud": {
			renderTemplate: function () {
				Q.addScript('https://w.soundcloud.com/player/api.js', function () {
					var url = 'https://w.soundcloud.com/player/?' + $.param({
						url: state.url,
						auto_start: state.autoplay,
						buying: false,
						sharing: false,
						download: false
					});

					Q.Template.render('Q/remoteAudio/soundcloud', {
						url: url
					}, function (err, html) {
						tool.element.innerHTML = html;

						var widget = SC.Widget($("iframe[name=soundcloud]", tool.element)[0]);

						widget.bind(SC.Widget.Events.READY, function() {
							widget.bind(SC.Widget.Events.PLAY, function() {
								// get information about currently playing sound
								widget.getCurrentSound(function(currentSound) {
									console.log('sound ' + currentSound.title + 'began to play');
									Q.handle(state.onPlay, tool, []);
								});
							});
							widget.bind(SC.Widget.Events.PAUSE, function() {
								// get information about currently playing sound
								widget.getCurrentSound(function(currentSound) {
									console.log('sound ' + currentSound.title + 'paused');
									Q.handle(state.onPause, tool, []);
								});
							});
						});
					});
				});
			}
		},
		"mp3": {

		}
	};

	var p = Q.pipe(['stylesheet', 'text'], function (params, subjects) {
		tool.text = params.text[1];
		tool.refresh();
	});

	Q.addStylesheet("{{Q}}/css/remoteAudio.css", p.fill('stylesheet'), { slotName: 'Q' });
	Q.Text.get('Q/content', p.fill('text'));
},

{
	url: null,
	autoplay: false,
	onPlay: new Q.Event(),
	onPause: new Q.Event(),
	onEnded: new Q.Event()
},

{
	/**
	 * Refreshes the appearance of the tool completely
	 * @method refresh
	 */
	refresh: function () {
		var tool = this;
		var state = tool.state;

		var adapterName = this.adapterNameFromUrl();

		tool.adapters[adapterName].renderTemplate();
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

		if (url.includes("soundcloud.com")) {
			return 'soundcloud';
		}
		if (url.split('.').pop() === 'mp3') {
			return 'mp3';
		}
		throw new Q.Exception(this.id + ': No adapter for this URL');
	}
});

Q.Template.set('Q/remoteAudio/mp3',
	'<div>'
	+'</div>'
);

Q.Template.set('Q/remoteAudio/soundcloud',
	'<iframe id="sc-widget" name="soundcloud" width="100%" height="166" scrolling="no" frameborder="no" src="{{url}}"></iframe>'
);

})(window, Q, jQuery);
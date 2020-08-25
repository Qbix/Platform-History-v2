(function (Q, $, window, undefined) {

	/**
	 * @module Streams-tools
	 */

	/**
	 * Renders a preview for a Streams/audio stream
	 * @class Streams audio preview
	 * @constructor
	 * @param {Object} [options] options to pass to this tool, besides the ones passed to preview
	 *   @uses Q inplace
	 *   @uses Q audio
	 *   @param {Object} [options.inplace] Any options to pass to the Q/inplace tool -- see its options.
	 *   @param {Object} [options.pie] Any options to pass to the Q/pie tool -- see its options.
	 *   @param {Object} [options.templates]
	 *     @param {Object} [options.templates.view]
	 *     @param {String} [options.templates.view.name='Streams/audio/preview/view']
	 */
	Q.Tool.define("Streams/audio/preview", "Streams/preview",
		function _Streams_audio_preview(options, preview) {
			var tool = this;
			tool.preview = preview;
			var state = tool.state;
			var ps = preview.state;
			var userId = Q.Users.loggedInUserId();
			var baseUrl = Q.info.baseUrl;

			// set edit action
			ps.actions.actions = {
				edit: function () {
					var fields = {
						url: Q.action("Streams/Stream"),
						publisherId: ps.publisherId,
						streamName: ps.streamName,
						action: "recorder",
						onSuccess: function () {
							Q.Streams.Stream.refresh(ps.publisherId, ps.streamName, null, {messages: true});
						}
					};

					$(tool.element).plugin("Q/audio", fields);
				}
			};

			if (ps.creatable) {
				if (ps.creatable.clickable) {
					ps.creatable.clickable.preventDefault = false;
				}

				// rewrite Streams/preview composer
				ps.creatable.preprocess = function (_proceed) {
					var fields = {
						url: Q.action("Streams/Stream"),
						path: "uploads/Streams",
						action: "recorder",
						onSuccess: _proceed
					};

					// activate Q/audio tool
					$(tool.element).plugin("Q/audio", fields);

					return false;
				};
			}

			// only for exist streams set onFieldChanged event - which refresh tool
			if (ps.streamName) {
				Q.Streams.retainWith(true).get(ps.publisherId, ps.streamName, function () {
					this.onAttribute().set(function (fields, k) {
						Q.Streams.Stream.refresh(ps.publisherId, ps.streamName, function () {
							console.log(ps.streamName);
							tool.refresh(this);
						});
					}, tool);
				});
			}

			ps.onRefresh.add(tool.refresh.bind(tool), tool);
			//ps.onComposer.add(tool.composer.bind(tool), tool);

			// add styles
			Q.addStylesheet('{{Q}}/css/audio.css');
			Q.addStylesheet('{{Streams}}/css/Streams_audio_preview.css');
		},

		{
			inplace: {
				field: 'title',
				inplaceType: 'text'
			},
			pie: {
				borderSize: 5,
				color: "red"
			},
			templates: {
				view: {
					name: 'Streams/audio/preview/view',
					fields: {}
				}
			}
		},

		{
			refresh: function (stream, onLoad) {
				var tool = this;
				var state = tool.state;
				var ps = tool.preview.state;
				var $te = $(tool.element);
				var baseUrl = Q.info.baseUrl;

				var audioUrl = stream.getAttribute("Q.file.url");
				audioUrl = audioUrl ? audioUrl.replace("{{baseUrl}}", baseUrl) : "";

				var audioDuration = stream.getAttribute("Q.audio.duration");

				$te.removeClass('Q_uploading');

				// set up the inplace options
				var inplace = null;
				if (state.inplace) {
					var inplaceOptions = Q.extend({
						publisherId: ps.publisherId,
						streamName: ps.streamName
					}, state.inplace);
					var se = ps.editable;
					if (!se || (se !== true && se.indexOf('title') < 0)) {
						inplaceOptions.editable = false;
					} else {
						$te.addClass('Streams_editable_title');
					}
					inplace = tool.setUpElementHTML('div', 'Streams/inplace', inplaceOptions);
				}

				// render a template
				var f = state.template && state.template.fields;
				var fields = Q.extend({}, state.templates.view.fields, f, {
					inplace: inplace
				});
				Q.Template.render(
					'Streams/audio/preview/view',
					fields,
					function (err, html) {
						if (err) return;

						$te.html(html);

						Q.activate(tool, function () {
							var playerBox = state.playerBox = $(".Streams_preview_audio_player", $te);
							playerBox.empty();
							var durationBox = state.durationBox = $(".Streams_preview_audio_duration", $te);
							var pieOptions = state.pie;

							// assign Q/audio player to playerBox
							playerBox.plugin("Q/audio", {
								action: "player",
								audioUrl: audioUrl,
								pie: pieOptions,
								onAudioLoad: function () { // when audio loaded (canplay event) - fill duration box
									durationBox.html(this.formatRecordTime(audioDuration));
								},
								onPlaying: function () { // when audio playing (playing event) - calculate elapsed time
									var currentTime = this.audio.audio.currentTime;
									durationBox.html(this.formatRecordTime(audioDuration - currentTime));
								},
								onEnded: function () { // when audio ended (ended event) - show again duration
									durationBox.html(this.formatRecordTime(audioDuration));
								}
							});
						});
					},
					state.templates["view"]
				);
			},
			formatSize: function (bytes) {
				if (isNaN(bytes)) return '';
				if (bytes >= Math.pow(2, 30)) {
					return Math.ceil(bytes / Math.pow(2, 30)) + ' GB';
				} else if (bytes >= Math.pow(2, 20)) {
					return Math.ceil(bytes / Math.pow(2, 20)) + ' MB';
				} else if (bytes >= Math.pow(2, 10)) {
					return Math.ceil(bytes / Math.pow(2, 10)) + ' KB';
				} else {
					return bytes + ' bytes';
				}
			}
		}
	);

	Q.Template.set('Streams/audio/preview/view',
		'<div class="Streams_preview_container Streams_preview_view Q_clearfix">'
		+ '<div class="Streams_preview_audio_player"></div>'
		+ '<div class="Streams_preview_contents {{titleClass}}">'
		+ '<h2 class="Streams_preview_title">{{& inplace}}</h2>'
		+ '<div class="Streams_preview_audio_duration"></div>'
		+ '</div></div>'
	);

	//Q.Template.set('Streams/audio/preview/edit',
	//	'<audio controls autoplay src="{{baseUrl}}{{src}}" style="margin: 20px">'
	//);
})(Q, Q.$, window);
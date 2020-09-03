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
			var ps = preview.state;
			var state = this.state;

			// set edit action
			ps.actions.actions = ps.actions.actions || {};

			if (ps.editable && ps.publisherId && ps.streamName) {
				Q.Streams.get(ps.publisherId, ps.streamName, function () {
					if (!this.testWriteLevel('edit')) {
						return;
					}

					ps.actions.actions.edit = function () {
						var fields = {
							fileUploadUHandler: Q.action("Streams/Stream"),
							publisherId: ps.publisherId,
							streamName: ps.streamName,
							action: "recorder",
							onSuccess: function () {
								Q.Streams.Stream.refresh(ps.publisherId, ps.streamName, null, {messages: true});
							}
						};

						// if Q/audio tool already created, use one
						if (state.qAudio) {
							state.qAudio.recorder();
						} else {
							// activate new Q/audio tool and save to state
							$("<div>").tool("Q/audio", fields).activate(function () {
								state.qAudio = this;
							});
						}
					};
				});
			}

			if (ps.creatable) {
				if (ps.creatable.clickable) {
					ps.creatable.clickable.preventDefault = false;
				}

				// rewrite Streams/preview composer
				ps.creatable.preprocess = function (_proceed) {
					var fields = {
						fileUploadUHandler: Q.action("Streams/Stream"),
						action: "recorder",
						onSuccess: _proceed
					};

					// if Q/audio tool already created, use one
					if (state.qAudio) {
						state.qAudio.recorder();
					} else {
						// activate new Q/audio tool and save to state
						$("<div>").tool("Q/audio", fields).activate(function () {
							state.qAudio = this;
						});
					}

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

				var audioUrl = stream.fileUrl();

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
							var $durationBox = $(".Streams_preview_audio_duration", $te);
							var pieOptions = state.pie;

							// assign Q/audio player to playerBox
							playerBox.tool("Q/audio", {
								action: "player",
								url: audioUrl,
								pie: pieOptions,
								onLoad: function () { // when audio loaded (canplay event) - fill duration box
									$durationBox.html(this.formatRecordTime(this.state.duration));
								},
								onPlaying: function () { // when audio playing (playing event) - calculate elapsed time
									$durationBox.html(this.formatRecordTime(this.state.duration - this.state.currentPosition));
								},
								onEnded: function () { // when audio ended (ended event) - show again duration
									$durationBox.html(this.formatRecordTime(this.state.duration));
								}
							}).activate();
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
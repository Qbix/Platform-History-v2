(function (Q, $, window, undefined) {

	/**
	 * @module Streams-tools
	 */

	/**
	 * Renders a preview for a Streams/pdf stream
	 * @class Streams pdf preview
	 * @constructor
	 * @param {Object} [options] options to pass to this tool, besides the ones passed to preview
	 *   @uses Q inplace
	 *   @uses Q pdf
	 *   @param {Object} [options.inplace] Any options to pass to the Q/inplace tool -- see its options.
	 *   @param {Object} [options.pie] Any options to pass to the Q/pie tool -- see its options.
	 *   @param {String} [options.url] If defined, Websites/scrape will requested and created preview tool with response data
	 */
	Q.Tool.define("Streams/pdf/preview", "Streams/preview", function (options, preview) {
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
						action: "composer",
						onSuccess: function () {
							Q.Streams.Stream.refresh(ps.publisherId, ps.streamName, null, {messages: true});
						}
					};

					// if Q/pdf tool already created, use one
					if (state.qPdf) {
						state.qPdf.composer();
					} else {
						// activate new Q/pdf tool and save to state
						$("<div>").tool("Q/pdf", fields).activate(function () {
							state.qPdf = this;
						});
					}
				};
			});
		}

		if (ps.creatable) {
			if (ps.creatable.clickable) {
				ps.creatable.clickable.preventDefault = false;
			}

			if (state.url) {
				ps.creatable.options = Q.extend({}, ps.creatable.options, {
					skipComposer: true
				});
			}

			// rewrite Streams/preview composer
			ps.creatable.preprocess = function (_proceed) {
				// if url specified, just call refresh to build Q/pdf with url
				if (state.url) {
					Q.req('Websites/scrape', ['result'], function (err, response) {
						var msg = Q.firstErrorMessage(err, response && response.errors);
						if (msg) {
							return Q.alert(msg);
						}

						var result = response.slots.result;

						state.title = result.title;
						state.description = result.description;
						state.keywords = result.keywords || '';
						state.interest = {
							title: ' ' + result.host,
							icon: result.iconSmall,
						};
						state.src = result.iconBig;

						tool.refresh();
					}, {
						method: 'post',
						fields: {
							url: state.url
						}
					});

					return ;
				}

				var fields = {
					fileUploadUHandler: Q.action("Streams/Stream"),
					action: "composer",
					onSuccess: _proceed
				};

				// if Q/pdf tool already created, use one
				if (state.qPdf) {
					state.qPdf.composer();
				} else {
					// activate new Q/pdf tool and save to state
					$("<div>").tool("Q/pdf", fields).activate(function () {
						state.qPdf = this;
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
						tool.refresh(this);
					});
				}, tool);
			});
		}

		ps.onRefresh.add(tool.refresh.bind(tool));

		// add styles
		Q.addStylesheet('{{Q}}/css/pdf.css');
		Q.addStylesheet('{{Streams}}/css/tools/previews.css');
	},

	{
		url: null,
		inplace: {
			field: 'title',
			inplaceType: 'text'
		}
	},

	{
		/**
		 * Create preview tool related stream data
		 * @method refresh
		 * @param {Streams_Stream} stream
		 */
		refresh: function (stream, onLoad) {
			var tool = this;
			var state = tool.state;
			var ps = tool.preview.state;
			var $te = $(tool.element);
			var pdfUrl = state.url;
			var inplace = null;

			if (Q.Streams.isStream(stream)) {
				pdfUrl = stream.fileUrl();
				// set up the inplace options
				if (state.inplace) {
					var inplaceOptions = Q.extend({
						publisherId: stream.fields.publisherId,
						streamName: stream.fields.name
					}, state.inplace);
					var se = ps.editable;
					if (!se || (se !== true && se.indexOf('title') < 0)) {
						inplaceOptions.editable = false;
					} else {
						$te.addClass('Streams_editable_title');
					}
					inplace = tool.setUpElementHTML('div', 'Streams/inplace', inplaceOptions);
				}
			} else {
				inplace = state.title;
			}

			if (!pdfUrl) {
				throw new Q.Error("Streams/pdf/preview: URL undefined");
			}

			$te.removeClass('Q_uploading');

			var icon = stream.fields.icon;
			if (!icon.matchTypes('url').length || !icon.match(/\.[png|jpg|gif]/g)) {
				icon = stream.iconUrl(40);
			}

			// render a template
			Q.Template.render('Streams/pdf/preview/view', {
				inplace: inplace,
				icon: icon
			}, function (err, html) {
				if (err) return;

				$te.html(html);

				Q.activate($te);
			});
		}
	}
);

Q.Template.set('Streams/pdf/preview/view',
	'<div class="Streams_preview_container Streams_preview_view Q_clearfix">' +
	'	<img alt="icon" class="Streams_preview_icon Q_imagepicker" src="{{icon}}">' +
	'	<div class="Streams_preview_contents">' +
	'		<h3 class="Streams_preview_title">{{& inplace}}</h3>' +
	'	</div>' +
	'</div>'
);

})(Q, Q.$, window);
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

		// only for exist streams set onFieldChanged event - which refresh tool
		if (ps.streamName) {
			Q.Streams.retainWith(true).get(ps.publisherId, ps.streamName, function (err) {
				if (err) {
					return;
				}

				this.onAttribute().set(function (fields, k) {
					Q.Streams.Stream.refresh(ps.publisherId, ps.streamName, function () {
						tool.refresh(this);
					});
				}, tool);

				if (ps.editable && this.testWriteLevel('edit')) {
					state.isComposer = false;
					tool.stream = this;

					ps.actions.actions.edit = function () {
						tool.composer(function () {
							Q.Streams.Stream.refresh(ps.publisherId, ps.streamName, null, {messages: true});
						});
					};
				}
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
						state.interest = {
							title: ' ' + result.host,
							icon: result.iconSmall,
						};

						tool.refresh();
					}, {
						method: 'post',
						fields: {
							url: state.url
						}
					});

					return ;
				}

				tool.composer(_proceed);

				return false;
			};
		}

		var p = Q.pipe(['stylesheet', 'text'], function (params, subjects) {
			tool.text = params.text[1].pdf;
			ps.onRefresh.add(tool.refresh.bind(tool), tool);
		});

		Q.Text.get('Streams/content', p.fill('text'));

		// add styles
		Q.addStylesheet("{{Streams}}/css/tools/previews.css", p.fill('stylesheet'), { slotName: 'Streams' });
	},

	{
		url: null,
		isComposer: true,
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
		refresh: function (stream) {
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
		},
		/**
		 * Start pdf composer dialog
		 * @method composer
		 */
		composer: function (callback) {
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
				var $currentContent = $(".Q_tabbing_container .Q_tabbing_item[data-content=" + action + "]", state.mainDialog);
				if (!$currentContent.length) {
					return _error("No action selected");
				}
				var clipTool = Q.Tool.from($(".Q_clip_tool", $currentContent), "Q/clip");
				var clipStart = clipTool ? clipTool.getPosition("start") : null;
				var clipEnd = clipTool ? clipTool.getPosition("end") : null;

				var title = $("input[name=title]", $currentContent);
				title = title.length ? title.val() : null;
				var content = $("textarea[name=content]", $currentContent);
				content = content.length ? content.val() : null;

				state.mainDialog.addClass('Q_uploading');

				if (action === "link") {
					// url defined
					var url = $("input[name=url]", $currentContent).val();
					if (!url) {
						return _error("Link not found");
					}

					Q.req('Websites/file', ['result'], function (err, response) {
						var msg = Q.firstErrorMessage(err, response && response.errors);
						if (msg) {
							Q.Dialogs.pop();
							return console.warn("Q/audio: " + msg);
						}

						var siteData = response.slots.result;

						var params = {
							title: siteData.title,
							attributes: {
								host: siteData.host,
								port: siteData.port,
								url: url,
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
									Q.handle(callback, tool, [params]);
									Q.Dialogs.pop();
								}
							});
						} else {
							// new stream
							Q.handle(callback, tool, [params]);
							Q.Dialogs.pop();
						}
					}, {
						method: 'post',
						fields: {
							url: url
						}
					});
				} else if (action === "upload") {
					var $file = $("input[type=file].Streams_pdf_file", $currentContent);
					// state.file set in recorder OR html file element
					var file = ($file.length && $file[0].files[0]) || null;
					var pdfPreview = Q.Tool.from($(".Streams_pdf_composer_preview.Q_pdf_tool", tool.element), "Q/pdf");

					// check file size
					if (file.size && file.size >= parseInt(Q.info.maxUploadSize)) {
						return Q.alert(tool.text.errorFileSize.interpolate({size: Q.humanReadable(Q.info.maxUploadSize, {bytes: true})}));
					}

					var reader = new FileReader();
					reader.onload = function (event) {
						var params = {
							title: Q.getObject("state.pdfInfo.title", pdfPreview) || file.name,
							content: Q.getObject("state.pdfInfo.description", pdfPreview),
							attributes: {
								clipStart: clipStart,
								clipEnd: clipEnd,
								author: Q.getObject("state.pdfInfo.author", pdfPreview)
							},
							file: {
								data: this.result,
								pdf: true
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

									Q.handle(callback, tool, [res.slots.data, key, file || null]);

									Q.Dialogs.pop();
								}, {
									fields: params,
									method: "put"
								});
							} else {
								Q.alert('FileReader undefined');
							}
						} else { // if new stream
							Q.handle(callback, tool, [params]);
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

					tool.stream.pendingFields.title = title;
					tool.stream.pendingFields.content = content;
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

			// setting clip start position handler
			var _onStart = function (setNewPosition, toolPreview) {
				if (setNewPosition) {
					var position = toolPreview.state.currentPosition;

					toolPreview.state.clipStart = position;
					this.setPosition(position, position + '%', "start");
				} else {
					toolPreview.state.clipStart = null;
				}
				toolPreview.stateChanged('clipStart');
			};

			// setting clip end position handler
			var _onEnd = function (setNewPosition, toolPreview) {
				if (setNewPosition) {
					var contentHeight = ($(toolPreview.element).height()/toolPreview.state.stuffHeight * 100).toPrecision(3);
					var position = (parseFloat(toolPreview.state.currentPosition) + parseFloat(contentHeight)).toPrecision(3);

					toolPreview.state.clipEnd = position;
					this.setPosition(position, position + '%', "end");
				} else {
					toolPreview.state.clipEnd = null;
				}
				toolPreview.stateChanged('clipEnd');
			};

			Q.Dialogs.push({
				className: 'Streams_dialog_pdf',
				title: "PDF",
				template: {
					name: 'Streams/pdf/composer',
					fields: {
						title: tool.stream && tool.stream.fields.title,
						content: tool.stream && tool.stream.fields.content,
						isComposer: state.isComposer,
						text: tool.text,
						uploadLimit: tool.text.uploadLimit.interpolate({size: Q.humanReadable(Q.info.maxUploadSize, {bytes: true})})
					}
				},
				destroyOnClose: true,
				onActivate : function (mainDialog) {
					state.mainDialog = mainDialog;

					// if stream defined, render player
					if (tool.stream) {
						var $pdfElement = $(".Q_tabbing_container .Q_tabbing_item[data-content=edit] .Streams_pdf_composer_preview", mainDialog);
						var $clipElement = $(".Q_tabbing_container .Q_tabbing_item[data-content=edit] .Streams_pdf_composer_clip", mainDialog);
						var clipStart = tool.stream.getAttribute('clipStart') || null;
						var clipEnd = tool.stream.getAttribute('clipEnd') || null;

						$pdfElement.tool("Q/pdf", {
							action: "implement",
							clipStart: clipStart,
							clipEnd: clipEnd,
							url: tool.stream.fileUrl()
						}).activate(function () {
							var toolPreview = this;

							$clipElement.tool("Q/clip", {
								startPosition: clipStart,
								startPositionDisplay: clipStart ? clipStart + '%' : null,
								endPosition: clipEnd,
								endPositionDisplay: clipEnd ? clipEnd + '%' : null,
								onStart: function (setNewPosition) {
									Q.handle(_onStart, this, [setNewPosition, toolPreview]);
								},
								onEnd: function (setNewPosition) {
									Q.handle(_onEnd, this, [setNewPosition, toolPreview]);
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
					var _selectTab = function () {
						var $this = $(this);
						var action = $this.attr('data-name');

						mainDialog.attr("data-action", action);
						$this.addClass('Q_current').siblings().removeClass('Q_current');
						$(".Q_tabbing_container .Q_tabbing_item[data-content=" + action + "]", mainDialog).addClass('Q_current').siblings().removeClass('Q_current');
					};
					$(".Q_tabbing_tabs .Q_tabbing_tab", mainDialog).on(Q.Pointer.fastclick, _selectTab);
					// select first visible tab
					Q.handle(_selectTab, $(".Q_tabbing_tabs .Q_tabbing_tab:visible:first", mainDialog)[0]);

					// Reset button
					$("button[name=reset]", mainDialog).on(Q.Pointer.click, function (e) {
						state.dataBlob = undefined;

						Q.each($(".Q_tabbing_container .Q_tabbing_item[data-content=link], .Q_tabbing_container .Q_tabbing_item[data-content=upload]", mainDialog), function (i, content) {
							var pdfTool = Q.Tool.from($(".Streams_pdf_composer_preview", content)[0], "Q/pdf");
							var clipTool = Q.Tool.from($(".Streams_pdf_composer_clip", content)[0], "Q/clip");

							if (pdfTool) {
								$("<div>").addClass('Streams_pdf_composer_preview').insertAfter(pdfTool.element);
								Q.Tool.remove(pdfTool.element, true, true);
							}

							if (clipTool) {
								Q.Tool.remove(clipTool.element, true);
								clipTool.element.innerHTML = '';
							}
						});
					});

					// set clip start/end for upload
					$("input[type=file]", mainDialog).on('change', function () {
						var $pdfElement = $(".Q_tabbing_container .Q_tabbing_item[data-content=upload] .Streams_pdf_composer_preview", mainDialog);
						var $clipElement = $(".Q_tabbing_container .Q_tabbing_item[data-content=upload] .Streams_pdf_composer_clip", mainDialog);
						var url = URL.createObjectURL(this.files[0]);
						var toolPreview = Q.Tool.from($pdfElement, "Q/pdf");

						// check file size
						if (this.files[0].size >= parseInt(Q.info.maxUploadSize)) {
							this.value = null;
							return Q.alert(tool.text.errorFileSize.interpolate({size: Q.humanReadable(Q.info.maxUploadSize, {bytes: true})}));
						}

						Q.Tool.remove($pdfElement[0], true);
						Q.Tool.remove($clipElement[0], true);

						$pdfElement.empty();
						$clipElement.empty();

						$pdfElement.tool("Q/pdf", {
							action: "implement",
							url: url
						}).activate(function () {
							toolPreview = this;
							$clipElement.tool("Q/clip", {
								onStart: function (setNewPosition) {
									Q.handle(_onStart, this, [setNewPosition, toolPreview]);
								},
								onEnd: function (setNewPosition) {
									Q.handle(_onEnd, this, [setNewPosition, toolPreview]);
								}
							}).activate(function () {
								toolPreview.clipTool = this;
							});
						});
					});

					// set clip start/end for link
					$("button[name=setClip]", mainDialog).on(Q.Pointer.fastclick, function () {
						var $button = $(this);
						$button.addClass("Q_working");
						var $pdfElement = $(".Q_tabbing_container .Q_tabbing_item[data-content=link] .Streams_pdf_composer_preview", mainDialog);
						var $clipElement = $(".Q_tabbing_container .Q_tabbing_item[data-content=link] .Streams_pdf_composer_clip", mainDialog);
						var url = $("input[name=url]", mainDialog).val();
						if (!url.matchTypes('url').length) {
							$button.removeClass("Q_working");
							return Q.alert(tool.text.invalidURL);
						}

						Q.Tool.remove($pdfElement[0], true);
						Q.Tool.remove($clipElement[0], true);

						$pdfElement.empty();
						$clipElement.empty();

						Q.req("Websites/file", ["result"], function (err, response) {
							$button.removeClass("Q_working");

							var msg = Q.firstErrorMessage(err, response && response.errors);
							if (msg) {
								return console.warn(msg);
							}

							var result = response.slots.result;

							$pdfElement.tool("Q/pdf", {
								action: "implement",
								url: result.destinationUrl
							}).activate(function () {
								var toolPreview = this;
								$clipElement.tool("Q/clip", {
									onStart: function (setNewPosition) {
										Q.handle(_onStart, this, [setNewPosition, toolPreview]);
									},
									onEnd: function (setNewPosition) {
										Q.handle(_onEnd, this, [setNewPosition, toolPreview]);
									}
								}).activate(function () {
									toolPreview.clipTool = this;
								});
							});
						}, {
							method: "post",
							fields: {url: url}
						});
					});
				},
				beforeClose: function(mainDialog) {

				}
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

Q.Template.set('Streams/pdf/composer',
	'<div class="Streams_pdf_composer" data-composer="{{isComposer}}"><form>'
	+ '  <div class="Q_tabbing_tabs">'
	+ '  	<div data-name="edit" class="Q_tabbing_tab">{{text.edit}}</div>'
	+ '  	<div data-name="upload" class="Q_tabbing_tab">{{text.upload}}</div>'
	+ '  	<div data-name="link" class="Q_tabbing_tab">{{text.link}}</div>'
	+ '  </div>'
	+ '  <div class="Q_tabbing_container">'
	+ '	 	<div class="Q_tabbing_item" data-content="edit">'
	+ '			<input name="title" value="{{title}}" placeholder="{{text.title}}">'
	+ '			<textarea name="content" placeholder="{{text.description}}">{{content}}</textarea>'
	+ '			<div class="Streams_pdf_composer_preview"></div>'
	+ '			<div class="Streams_pdf_composer_clip"></div>'
	+ '  	</div>'
	+ '  	<div class="Q_tabbing_item" data-content="upload">'
	+ '	   		<input type="file" accept="application/pdf" class="Streams_pdf_file" />'
	+ '			<div class="Streams_pdf_composer_upload_limit">{{uploadLimit}}</div>'
	+ '			<div class="Streams_pdf_composer_preview"></div>'
	+ '			<div class="Streams_pdf_composer_clip"></div>'
	+ '		</div>'
	+ '  	<div class="Q_tabbing_item" data-content="link">'
	+ '	   		<label>'
	+ '				<input name="url" placeholder="{{text.setUrl}}" type="url">'
	+ '				<button name="setClip" type="button" class="Q_button">{{text.setClip}}</button>'
	+ '			</label>'
	+ '			<div class="Streams_pdf_composer_preview"></div>'
	+ '			<div class="Streams_pdf_composer_clip"></div>'
	+ '		</div>'
	+ '  </div>'
	+ '  <div class="Streams_pdf_composer_submit"><button name="save" class="Q_button" type="button">{{text.save}}</button><button name="reset" type="reset" class="Q_button">{{text.reset}}</button></div>'
	+ '</form></div>'
);

})(Q, Q.$, window);
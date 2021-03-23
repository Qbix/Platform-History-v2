(function (Q, $, window, undefined) {

	/**
	 * @module Streams-tools
	 */

	/**
	 * Renders a preview for a Streams/video stream
	 * @class Streams video preview
	 * @constructor
	 * @param {Object} [options] options to pass to this tool, besides the ones passed to preview
	 *   @uses Q inplace
	 *   @uses Q video
	 *   @param {Object} [options.inplace] Any options to pass to the Q/inplace tool -- see its options.
	 *   @param {Object} [options.pie] Any options to pass to the Q/pie tool -- see its options.
	 *   @param {String} [options.url] If defined, Websites/scrape will requested and created preview tool with response data
	 *   @param {Q.Event} [onLoad] called when styles and texts loaded
	 *   @param {Q.Event} [onRender] called when tool rendered
	 */
	Q.Tool.define("Streams/video/preview", "Streams/preview", function (options, preview) {
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
				// if url specified, just call refresh to build Q/video with url
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

				// when all components loaded, call composer
				state.onLoad.add(function () {
					tool.composer(_proceed);
				}, tool);

				return false;
			};
		}

		var p = Q.pipe(['stylesheet', 'text'], function (params, subjects) {
			tool.text = params.text[1].video;

			Q.handle(state.onLoad, tool);
		});

		Q.Text.get('Streams/content', p.fill('text'));

		// add styles
		Q.addStylesheet("{{Streams}}/css/tools/previews.css", p.fill('stylesheet'), { slotName: 'Streams' });
	},

	{
		url: null,
		isComposer: true,
		fileUploadUHandler: Q.action("Streams/Stream"),
		inplace: {
			field: 'title',
			inplaceType: 'text'
		},
		onLoad: new Q.Event(function () {
			this.preview.state.onRefresh.add(this.refresh.bind(this), this);
		}, "Streams/video"),
		onRender: new Q.Event()
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
			var videoUrl = state.url;
			var inplace = null;
			var icon = null;

			if (Q.Streams.isStream(stream)) {
				videoUrl = stream.fileUrl();
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
				icon = stream.fields.icon;
			} else {
				inplace = state.title;
				icon = state.src;
			}

			if (!videoUrl) {
				Q.Tool.remove(tool.element, true, true);
				console.warn("Streams/video/preview: URL undefined");
				//throw new Q.Error("Streams/video/preview: URL undefined");
			}

			$te.removeClass('Q_uploading');

			var iconCustom = true;
			if (!icon.matchTypes('url').length || !icon.match(/\.[png|jpg|gif]/g)) {
				icon = stream.iconUrl(40);
				iconCustom = false;
			}

			// render a template
			Q.Template.render('Streams/video/preview/view', {
				inplace: inplace,
				icon: icon,
				iconCustom: iconCustom
			}, function (err, html) {
				if (err) return;

				$te.html(html);

				Q.handle(state.onRender, tool);

				Q.activate($te);
			});
		},
		/**
		 * Start video composer dialog
		 * @method composer
		 * @param {function} callback Calling when data prepared to create or save stream
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
				var $currentContent = $(".Q_tabbing_container [data-content=" + action + "]", state.mainDialog);
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

					Q.req('Websites/scrape', ['result'], function (err, response) {
						var msg = Q.firstErrorMessage(err, response && response.errors);
						if (msg) {
							tool.closeComposer();
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
									Q.handle(callback, tool, [params]);
									tool.closeComposer();
								}
							});
						} else {
							// new stream
							Q.handle(callback, tool, [params]);
							tool.closeComposer();
						}
					}, {
						method: 'post',
						fields: {
							url: url
						}
					});
				} else if (action === "upload") {
					var $file = $("input[type=file].Streams_video_file", $currentContent);
					// state.file set in recorder OR html file element
					var file = ($file.length && $file[0].files[0]) || null;

					// check file size
					if (file.size && file.size >= parseInt(Q.info.maxUploadSize)) {
						return Q.alert(tool.text.errorFileSize.interpolate({size: Q.humanReadable(Q.info.maxUploadSize, {bytes: true})}));
					}

					var reader = new FileReader();
					reader.onload = function (event) {
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

									Q.handle(callback, tool, [res.slots.data, key, file || null]);
									tool.closeComposer();
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
							Q.handle(callback, tool, [params]);
							tool.closeComposer();
						}
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
							Q.handle(callback, tool);
							tool.closeComposer();
						}
					});
				} else {
					_error("Incorrect action " + action);
				}
			};

			Q.invoke({
				columnClass: "Streams_dialog_video",
				className: 'Streams_dialog_video',
				title: "Video",
				template: {
					name: 'Streams/video/composer',
					fields: {
						title: tool.stream && tool.stream.fields.title,
						content: tool.stream && tool.stream.fields.content,
						isComposer: state.isComposer,
						text: tool.text,
						uploadLimit: tool.text.uploadLimit.interpolate({size: Q.humanReadable(Q.info.maxUploadSize, {bytes: true})})
					}
				},
				fullscreen: Q.info.isMobile,
				destroyOnClose: true,
				trigger: Q.info.isMobile ? tool.element : null,
				callback: function () {
					// if opened in columns - third argument is a column element,
					// if opened dialog - first argument is dialog element
					state.mainDialog = arguments[2] instanceof HTMLElement ? arguments[2] : arguments[0];
					if (!(state.mainDialog instanceof $)) {
						state.mainDialog = $(state.mainDialog);
					}

					// if stream defined, render player
					if (tool.stream) {
						var $videoElement = $(".Q_tabbing_container [data-content=edit] .Streams_video_composer_preview", state.mainDialog);
						var $clipElement = $(".Q_tabbing_container [data-content=edit] .Streams_video_composer_clip", state.mainDialog);

						$videoElement.tool("Q/video", {
							url: tool.stream.fileUrl(),
							clipStart: tool.stream.getAttribute('clipStart'),
							clipEnd: tool.stream.getAttribute('clipEnd')
						}).activate(function () {
							var toolPreview = this;
							var clipStart = tool.stream.getAttribute('clipStart') || null;
							var clipEnd = tool.stream.getAttribute('clipEnd') || null;

							$clipElement.tool("Q/clip", {
								startPosition: clipStart,
								startPositionDisplay: clipStart ? Q.displayDuration(clipStart) : null,
								endPosition: clipEnd,
								endPositionDisplay: clipEnd ? Q.displayDuration(clipEnd) : null,
								onStart: function (setNewPosition) {
									if (setNewPosition) {
										var time = toolPreview.state.currentPosition;

										toolPreview.state.clipStart = time;
										this.setPosition(time, Q.displayDuration(time), "start");
									} else {
										toolPreview.state.clipStart = null;
									}
								},
								onEnd: function (setNewPosition) {
									if (setNewPosition) {
										var time = toolPreview.state.currentPosition;

										toolPreview.state.clipEnd = time;
										this.setPosition(time, Q.displayDuration(time), "end");
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
					$("button[name=save]", state.mainDialog).on(Q.Pointer.click, function (e) {
						e.preventDefault();
						e.stopPropagation();

						state.mainDialog.addClass('Q_uploading');

						var _error = function (err) {
							state.mainDialog.removeClass('Q_uploading');
							Q.alert(err);
						};
						var action = state.mainDialog.attr("data-action");

						if (action === 'upload') {
							if (!$("input[type=file]", state.mainDialog).val()) {
								return _error(tool.text.invalidFile);
							}
						} else if (action === 'link') {
							var url = $("input[name=url]", state.mainDialog).val();
							if (!url.matchTypes('url').length) {
								return _error(tool.text.invalidURL);
							}
						} else if (state.isComposer) {
							return _error(tool.text.errorNoSource);
						}

						Q.handle(_process, state.mainDialog);
					});

					var _selectTab = function () {
						var $this = $(this);
						var action = $this.attr('data-name');

						state.mainDialog.attr("data-action", action);
						$this.addClass('Q_current').siblings().removeClass('Q_current');
						$(".Q_tabbing_container .Q_tabbing_item[data-content=" + action + "]", state.mainDialog).addClass('Q_current').siblings().removeClass('Q_current');

						// pause all exists players
						Q.each($(".Q_video_tool", state.mainDialog), function () {
							var videoTool = Q.Tool.from(this, "Q/video");

							if (videoTool) {
								videoTool.pause();
							}
						});
					};

					// custom tabs implementation
					$(".Q_tabbing_tabs .Q_tabbing_tab", state.mainDialog).on(Q.Pointer.fastclick, _selectTab);

					// Reset button
					$("button[name=reset]", state.mainDialog).on(Q.Pointer.click, function (e) {
						state.dataBlob = undefined;

						Q.each($(".Q_tabbing_container .Q_tabbing_item[data-content=link], .Q_tabbing_container .Q_tabbing_item[data-content=upload]", state.mainDialog), function (i, content) {
							var videoTool = Q.Tool.from($(".Streams_video_composer_preview", content)[0], "Q/video");
							var clipTool = Q.Tool.from($(".Streams_video_composer_clip", content)[0], "Q/clip");

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
					$("input[type=file]", state.mainDialog).on('change', function () {
						var $videoElement = $(".Q_tabbing_container .Q_tabbing_item[data-content=upload] .Streams_video_composer_preview", state.mainDialog);
						var $clipElement = $(".Q_tabbing_container .Q_tabbing_item[data-content=upload] .Streams_video_composer_clip", state.mainDialog);
						var url = URL.createObjectURL(this.files[0]);
						var toolPreview = Q.Tool.from($videoElement, "Q/video");

						// check file size
						if (this.files[0].size >= parseInt(Q.info.maxUploadSize)) {
							this.value = null;
							return Q.alert(tool.text.errorFileSize.interpolate({size: Q.humanReadable(Q.info.maxUploadSize, {bytes: true})}));
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
							url: url
						}).activate(function () {
							toolPreview = this;
							$clipElement.tool("Q/clip", {
								onStart: function (setNewPosition) {
									if (setNewPosition) {
										var time = toolPreview.state.currentPosition;

										toolPreview.state.clipStart = time;
										this.setPosition(time, Q.displayDuration(time), "start");
									} else {
										toolPreview.state.clipStart = null;
									}
								},
								onEnd: function (setNewPosition) {
									if (setNewPosition) {
										var time = toolPreview.state.currentPosition;

										toolPreview.state.clipEnd = time;
										this.setPosition(time, Q.displayDuration(time), "end");
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
					$("button[name=setClip]", state.mainDialog).on(Q.Pointer.fastclick, function () {
						var $videoElement = $(".Q_tabbing_container .Q_tabbing_item[data-content=link] .Streams_video_composer_preview", state.mainDialog);
						var $clipElement = $(".Q_tabbing_container .Q_tabbing_item[data-content=link] .Streams_video_composer_clip", state.mainDialog);
						var url = $("input[name=url]", state.mainDialog).val();
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
										this.setPosition(time, Q.displayDuration(time), "start");
									} else {
										toolPreview.state.clipStart = null;
									}
								},
								onEnd: function (setNewPosition) {
									if (setNewPosition) {
										var time = toolPreview.state.currentPosition;

										toolPreview.state.clipEnd = time;
										this.setPosition(time, Q.displayDuration(time), "end");
									} else {
										toolPreview.state.clipEnd = null;
									}
								}
							}).activate(function () {
								toolPreview.clipTool = this;
							});
						});
					});

					Q.handle(_selectTab, $(".Q_tabbing_tabs .Q_tabbing_tab:visible:first", state.mainDialog)[0]);
				}
			});
		},
		closeComposer: function () {
			var mainDialog = this.state.mainDialog;
			if (!mainDialog) {
				return;
			}

			if(mainDialog.hasClass("Q_columns_column")) {
				var columns = Q.Tool.from(mainDialog.closest(".Q_columns_tool")[0], "Q/columns");
				columns.close({min: parseInt(mainDialog.attr("data-index"))});
			} else {
				Q.Dialogs.pop();
			}
		}
	}
);

Q.Template.set('Streams/video/preview/view',
	'<div class="Streams_preview_container Streams_preview_view Q_clearfix">' +
	'	<img alt="icon" class="Streams_preview_icon Q_imagepicker" src="{{icon}}">' +
	'	{{#if iconCustom}}' +
	'	<div class="Streams_video_preview_icon"></div>' +
	'	{{/if}}' +
	'	<div class="Streams_preview_contents">' +
	'		<h3 class="Streams_preview_title">{{& inplace}}</h3>' +
	'	</div>' +
	'</div>'
);

Q.Template.set('Streams/video/composer',
	'<div class="Streams_video_composer" data-composer="{{isComposer}}"><form>'
	+ '  <div class="Q_tabbing_tabs">'
	+ '  	<div data-name="edit" class="Q_tabbing_tab">{{text.edit}}</div>'
	+ '  	<div data-name="upload" class="Q_tabbing_tab">{{text.upload}}</div>'
	+ '  	<div data-name="link" class="Q_tabbing_tab">{{text.link}}</div>'
	+ '  </div>'
	+ '  <div class="Q_tabbing_container">'
	+ '	 	<div class="Q_tabbing_item" data-content="edit">'
	+ '			<input name="title" value="{{title}}">'
	+ '			<textarea name="content">{{content}}</textarea>'
	+ '			<div class="Streams_video_composer_preview"></div>'
	+ '			<div class="Streams_video_composer_clip"></div>'
	+ '  	</div>'
	+ '  	<div class="Q_tabbing_item" data-content="upload">'
	+ '	   		<input type="file" accept="video/*" class="Streams_video_file" />'
	+ '			<div class="Streams_video_composer_upload_limit">{{uploadLimit}}</div>'
	+ '			<div class="Streams_video_composer_preview"></div>'
	+ '			<div class="Streams_video_composer_clip"></div>'
	+ '		</div>'
	+ '  	<div class="Q_tabbing_item" data-content="link">'
	+ '	   		<label>'
	+ '				<input name="url" placeholder="{{text.setUrl}}" type="url">'
	+ '				<button name="setClip" type="button" class="Q_button">{{text.setClip}}</button>'
	+ '			</label>'
	+ '			<div class="Streams_video_composer_preview"></div>'
	+ '			<div class="Streams_video_composer_clip"></div>'
	+ '		</div>'
	+ '  </div>'
	+ '  <div class="Streams_video_composer_submit"><button name="save" class="Q_button" type="button">{{text.save}}</button><button name="reset" type="reset" class="Q_button">{{text.reset}}</button></div>'
	+ '</form></div>'
);

})(Q, Q.$, window);
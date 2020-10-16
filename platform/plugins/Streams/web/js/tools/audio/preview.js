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
	 *   @param {String} [options.url] If defined, Websites/scrape will requested and created preview tool with response data
	 */
	Q.Tool.define("Streams/audio/preview", "Streams/preview", function _Streams_audio_preview(options, preview) {
			var tool = this;
			tool.preview = preview;
			var ps = preview.state;
			var state = this.state;

			// set edit action
			ps.actions.actions = ps.actions.actions || {};

			// if false added tab "Edit" to composer where user can edit stream
			state.isComposer = true;

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
					// if url specified, just call refresh to build Q/audio with url
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

					// activate new Q/audio tool and save to state
					tool.composer(_proceed);

					return false;
				};
			}

			var p = Q.pipe(['stylesheet', 'text'], function (params, subjects) {
				tool.text = params.text[1].audio;

				ps.onRefresh.add(tool.refresh.bind(tool), tool);
				//ps.onComposer.add(tool.composer.bind(tool), tool);
			});

			Q.Text.get('Streams/content', p.fill('text'));

			// add styles
			Q.addStylesheet("{{Streams}}/css/tools/previews.css", p.fill('stylesheet'), { slotName: 'Streams' });
		},

		{
			url: null,
			inplace: {
				field: 'title',
				inplaceType: 'text'
			},
			fileUploadUHandler: Q.action("Streams/Stream"),
			pie: {
				borderSize: 5,
				color: "red"
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
				var audioUrl = state.url;
				var inplace = null;

				if (Q.Streams.isStream(stream)) {
					audioUrl = stream.fileUrl();
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

				if (!audioUrl) {
					Q.Tool.remove(tool.element, true, true);
					console.warn("Streams/audio/preview: URL undefined");
					//throw new Q.Error("Streams/audio/preview: URL undefined");
				}

				$te.removeClass('Q_uploading');

				// render a template
				Q.Template.render('Streams/audio/preview/view', {
					inplace: inplace
				}, function (err, html) {
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
							clipStart: Q.Streams.isStream(stream) ? stream.getAttribute('clipStart') : null,
							clipEnd: Q.Streams.isStream(stream) ? stream.getAttribute('clipEnd') : null,
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
				});
			},
			/**
			 * Start audio composer dialog
			 * @method composer
			 * @param {function} callback Calling when data prepared to create or save stream
			 */
			composer: function (callback) {
				var tool = this;
				var state = this.state;
				var hasUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
				var maxUploadSize = Q.humanReadable(Q.info.maxUploadSize, {bytes: true});

				/**
				 * Process composer submitting
				 * @method _process
				 */
				var _process = function () {
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
								Q.Dialogs.pop();
								return console.warn("Q/audio: " + msg);
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
							fields: {url: url}
						});
					} else if (action === "record" || action === "upload") {
						var $file = $("input[type=file].Streams_audio_file", $currentContent);
						// state.file set in recorder OR html file element
						var file = state.file || ($file.length && $file[0].files[0]) || null;

						// check file size
						if (file.size && file.size >= parseInt(Q.info.maxUploadSize)) {
							return Q.alert(tool.text.errorFileSize.interpolate({size: maxUploadSize}));
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
									audio: true
								}
							};

							if (state.publisherId && state.streamName) { // if edit existent stream
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
											if (state.mainDialog) state.mainDialog.removeClass('Q_uploading');
											return Q.handle([state.onError, state.onFinish], tool, [msg]);
										}

										// by default set src equal to first element of the response
										var key = Q.firstKey(res.slots.data, {nonEmpty: true});

										Q.handle(callback, tool, [res.slots.data, key, file || null]);
										//Q.handle([state.onSuccess, state.onFinish], tool, [res.slots.data, key, file || null]);

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
								Q.handle(callback, tool);
								Q.Dialogs.pop();
							}
						});
					} else {
						_error("Incorrect action " + action);
					}
				};

				Q.Dialogs.push({
					className: 'Streams_dialog_audio',
					title: "Audio",
					template: {
						name: 'Streams/audio/composer',
						fields: {
							title: tool.stream && tool.stream.fields.title,
							content: tool.stream && tool.stream.fields.content,
							isComposer: state.isComposer,
							uploadLimit: tool.text.uploadLimit.interpolate({size: maxUploadSize}),
							text: tool.text
						}
					},
					destroyOnClose: true,
					onActivate: function (mainDialog) {
						state.mainDialog = mainDialog;

						var pieBox = tool.pieBox = $(".Streams_audio_pie", mainDialog);
						state.recorder = null;

						// set some elements
						state.recordTimeElement = $(".Streams_audio_record_recordTime", mainDialog);
						state.recordTextElement = $(".Streams_audio_record_recordText", mainDialog);
						state.recordElapsedElement = $(".Streams_audio_record_elapsed", mainDialog);
						state.recordEncodingElement = $(".Streams_audio_encoding", mainDialog);

						// add Q/pie tool
						pieBox.tool("Q/audio", {
							action: "recorder"
						}).activate(function () {
							state.recorder = this;
						});

						// if stream defined, render player
						if (tool.stream) {
							var $audioElement = $(".Q_tabbing_container [data-content=edit] .Streams_audio_composer_preview", mainDialog);
							var $clipElement = $(".Q_tabbing_container [data-content=edit] .Streams_audio_composer_clip", mainDialog);

							$audioElement.tool("Q/audio", {
								action: "implement",
								clipStart: tool.stream.getAttribute('clipStart'),
								clipEnd: tool.stream.getAttribute('clipEnd'),
								url: tool.stream.fileUrl()
							}).activate(function () {
								var toolPreview = this;
								var clipStart = tool.stream.getAttribute('clipStart') || null;
								var clipEnd = tool.stream.getAttribute('clipEnd') || null;

								$clipElement.tool("Q/clip", {
									startPosition: clipStart,
									startPositionDisplay: clipStart ? clipStart.convertTimeToString() : null,
									endPosition: clipEnd,
									endPositionDisplay: clipEnd ? clipEnd.convertTimeToString() : null,
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
								}).activate();
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

							if (action === 'record') {
								if (Q.typeOf(state.recorder) !== 'Q.Tool') {
									return _error("Error: recorder not found");
								}

								var dataBlob = Q.getObject("recorder.state.dataBlob", state);
								// wait while track encoded
								if (Q.isEmpty(dataBlob)) {
									return _error(tool.text.errorNoSource);
								}

								state.file = dataBlob;
								state.file.name = "audio.mp3";
							} else if (action === 'upload') {
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

						var _selectTab = function () {
							var $this = $(this);
							var action = $this.attr('data-name');

							if (action === "record") {
								state.recorder && state.recorder.recorderStateChange("init");
							} else {
								state.recorder && state.recorder.recorderStateChange("clear");
							}

							mainDialog.attr("data-action", action);
							$this.addClass('Q_current').siblings().removeClass('Q_current');
							$(".Q_tabbing_container [data-content=" + action + "]", mainDialog).addClass('Q_current').siblings().removeClass('Q_current');

							// pause all exists players
							Q.each($(".Q_audio_tool", mainDialog), function () {
								var audioTool = Q.Tool.from(this, "Q/audio");

								if (audioTool) {
									audioTool.pause();
								}
							});
						};

						// custom tabs implementation
						$(".Q_tabbing_tabs .Q_tabbing_tab", mainDialog).on(Q.Pointer.fastclick, _selectTab);

						// Reset button
						$("button[name=reset]", mainDialog).on(Q.Pointer.click, function (e) {
							state.dataBlob = undefined;
							state.recorder && state.recorder.recorderStateChange("init");

							Q.each($(".Q_tabbing_container [data-content=link], .Q_tabbing_container [data-content=upload]", mainDialog), function (i, content) {
								var audioTool = Q.Tool.from($(".Streams_audio_composer_preview", content)[0], "Q/audio");
								var clipTool = Q.Tool.from($(".Streams_audio_composer_clip", content)[0], "Q/clip");

								// remove Q/audio and Q/clip tools from upload and link sections
								Q.each([audioTool, clipTool], function (i, resetTool) {
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
							var $audioElement = $(".Q_tabbing_container [data-content=upload] .Streams_audio_composer_preview", mainDialog);
							var $clipElement = $(".Q_tabbing_container [data-content=upload] .Streams_audio_composer_clip", mainDialog);
							var url = URL.createObjectURL(this.files[0]);
							var toolPreview = Q.Tool.from($audioElement, "Q/audio");

							// check file size
							if (this.files[0].size >= parseInt(Q.info.maxUploadSize)) {
								this.value = null;
								return Q.alert(tool.text.errorFileSize.interpolate({size: maxUploadSize}));
							}

							// if audio tool exists, clear url object
							if (toolPreview) {
								URL.revokeObjectURL(toolPreview.state.url);
							}

							Q.Tool.remove($audioElement[0], true);
							Q.Tool.remove($clipElement[0], true);

							$audioElement.empty();
							$clipElement.empty();

							$audioElement.tool("Q/audio", {
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
								}).activate();
							});
						});

						// set clip start/end for link
						$("button[name=setClip]", mainDialog).on(Q.Pointer.fastclick, function () {
							var $audioElement = $(".Q_tabbing_container [data-content=link] .Streams_audio_composer_preview", mainDialog);
							var $clipElement = $(".Q_tabbing_container [data-content=link] .Streams_audio_composer_clip", mainDialog);
							var url = $("input[name=url]", mainDialog).val();
							if (!url.matchTypes('url').length) {
								return Q.alert(tool.text.invalidURL);
							}

							Q.Tool.remove($audioElement[0], true);
							Q.Tool.remove($clipElement[0], true);

							$audioElement.empty();
							$clipElement.empty();

							$audioElement.tool("Q/audio", {
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
								}).activate();
							});
						});

						// select first visible tab
						Q.handle(_selectTab, $(".Q_tabbing_tabs .Q_tabbing_tab:visible:first", mainDialog)[0]);
					},
					beforeClose: function (mainDialog) {
						// clear recorder stream when dialog close.
						// In this case every time dialog opened - user should allow to use microphone
						state.recorder && state.recorder.recorderStateChange("clear");
					}
				});
			}
		}
	);

	Q.Template.set('Streams/audio/preview/view',
		'<div class="Streams_preview_container Streams_preview_view Q_clearfix">'
		+ '<div class="Streams_preview_audio_player"></div>'
		+ '<div class="Streams_preview_contents">'
		+ '<h2 class="Streams_preview_title">{{& inplace}}</h2>'
		+ '<div class="Streams_preview_audio_duration"></div>'
		+ '</div></div>'
	);

	Q.Template.set('Streams/audio/composer',
		'<div class="Streams_audio_composer" data-composer="{{isComposer}}"><form>'
		+ '  <div class="Q_tabbing_tabs">'
		+ '  	<div data-name="edit" class="Q_tabbing_tab">{{text.edit}}</div>'
		+ '  	<div data-name="record" class="Q_tabbing_tab">{{text.record}}</div>'
		+ '  	<div data-name="upload" class="Q_tabbing_tab">{{text.upload}}</div>'
		+ '  	<div data-name="link" class="Q_tabbing_tab">{{text.link}}</div>'
		+ '  </div>'
		+ '  <div class="Q_tabbing_container">'
		+ '	 	<div class="Q_tabbing_item" data-content="edit">'
		+ '			<input name="title" value="{{title}}" placeholder="{{text.title}}">'
		+ '			<textarea name="content" placeholder="{{text.description}}">{{content}}</textarea>'
		+ '			<div class="Streams_audio_composer_preview"></div>'
		+ '			<div class="Streams_audio_composer_clip"></div>'
		+ '  	</div>'
		+ '	 	<div class="Q_tabbing_item" data-content="record">'
		+ '    		<div class="Streams_audio_pie"></div>'
		+ '  	</div>'
		+ '  	<div class="Q_tabbing_item" data-content="upload">'
		+ '	   		<input type="file" accept="audio/*" class="Streams_audio_file" />'
		+ '			<div class="Streams_audio_composer_upload_limit">{{uploadLimit}}</div>'
		+ '			<div class="Streams_audio_composer_preview"></div>'
		+ '			<div class="Streams_audio_composer_clip"></div>'
		+ '		</div>'
		+ '  	<div class="Q_tabbing_item" data-content="link">'
		+ '	   		<label>'
		+ '				<input name="url" placeholder="{{text.setUrl}}" type="url">'
		+ '				<button name="setClip" type="button" class="Q_button">{{text.setClip}}</button>'
		+ '			</label>'
		+ '			<div class="Streams_audio_composer_preview"></div>'
		+ '			<div class="Streams_audio_composer_clip"></div>'
		+ '		</div>'
		+ '  </div>'
		+ '  <div class="Streams_audio_composer_submit"><button name="save" class="Q_button" type="button">{{text.save}}</button><button name="reset" type="reset" class="Q_button">{{text.reset}}</button></div>'
		+ '  <div class="Streams_audio_encoding">{{text.encoding}}</div>'
		+ '</form></div>'
	);
})(Q, Q.$, window);
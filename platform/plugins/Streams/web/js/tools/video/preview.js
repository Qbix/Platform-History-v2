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
	 *   @param {String} [options.url] If defined, Websites/scrape will requested and created preview tool with response data
	 *   @param {Boolean} [options.isComposer] Indicate whether we create new stream or edit exsitent stream
	 *   @param {Boolean} [options.teaser] Indicate whether to show teaser tab in composer
	 *   @param {String} [options.title] Explicit define composer dialog/column title
	 *   @param {Q.Event} [onInvoke] called when user click on tool element
	 *   @param {Q.Event} [onRefresh] called when tool rendered
	 */
	Q.Tool.define("Streams/video/preview", "Streams/preview", function (options, preview) {
		var tool = this;
		tool.preview = preview;
		var previewState = preview.state;
		var state = this.state;

		if (previewState.creatable) {
			if (previewState.creatable.clickable) {
				previewState.creatable.clickable.preventDefault = false;
			}

			if (state.url) {
				previewState.creatable.options = Q.extend({}, previewState.creatable.options, {
					skipComposer: true
				});
			}

			// rewrite Streams/preview composer
			previewState.creatable.preprocess = function (_proceed) {
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

					return false;
				}

				tool.composer(_proceed);
				return false;
			};
		}

		tool.preview.state.onRefresh.add(tool.refresh.bind(tool), tool);
	},

	{
		url: null,
		isComposer: true,
		teaser: false,
		title: null,
		inplace: {
			field: 'title',
			inplaceType: 'text',
			editable: false
		},
		onInvoke: new Q.Event(),
		onRefresh: new Q.Event()
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
			var previewState = tool.preview.state;
			var $toolElement = $(tool.element);
			var inplace = null;

			stream.retain(tool);

			$toolElement.off([Q.Pointer.fastclick, 'Streams_video_preview']).on([Q.Pointer.fastclick, 'Streams_video_preview'], function () {
				// if vimeo check status
				if (stream.getAttribute("provider") === "vimeo" && !stream.getAttribute("available")) {
					$toolElement.addClass("Q_working");
					Q.req("Streams/vimeo", ["info"], function (err, response) {
						$toolElement.removeClass("Q_working");
						if (err) {
							return;
						}

						var status = Q.getObject("slots.info.status", response);
						if (status !== "available") {
							return Q.alert(tool.text.video.errorNotAvailable);
						}

						Q.handle(state.onInvoke, tool, [stream]);
					}, {
						fields: {
							videoId: stream.getAttribute("videoId"),
							publisherId: stream.fields.publisherId,
							streamName: stream.fields.name
						}
					});
				} else {
					Q.handle(state.onInvoke, tool, [stream]);
				}
			});

			if (Q.Streams.isStream(stream)) {
				tool.stream = stream;

				stream.onAttribute().set(function (fields, k) {
					stream.refresh(function () {
						tool.refresh(this);
					}, {messages: true});
				}, tool);

				// set edit action
				previewState.actions.actions = previewState.actions.actions || {};
				if (previewState.editable && stream.testWriteLevel('edit')) {
					state.isComposer = false;
					previewState.actions.actions.edit = function () {
						tool.composer(function () {
							stream.refresh(null, {messages: true});
						});
					};
					tool.preview.actions();
				}

				// set up the inplace options
				if (state.inplace) {
					var inplaceOptions = Q.extend({
						publisherId: stream.fields.publisherId,
						streamName: stream.fields.name,
						editable: state.inplace.editable
					}, state.inplace);
					if (state.inplace.editable) {
						$toolElement.addClass('Streams_editable_title');
					}
					inplace = tool.setUpElementHTML('div', 'Streams/inplace', inplaceOptions);
				}
			} else {
				inplace = state.title;
			}

			$toolElement.removeClass('Q_uploading');

			// render a template
			Q.Template.render('Streams/video/preview/view', {
				inplace: inplace
			}, function (err, html) {
				if (err) return;

				Q.replace(tool.element, html);
				Q.handle(state.onRefresh, tool);
				Q.activate($toolElement, function () {
					tool.preview.icon($("img.Streams_preview_icon", $toolElement)[0]);
				});
			});
		},
		/**
		 * Start video composer dialog
		 * @method composer
		 * @param {function} callback Calling when data prepared to create or save stream
		 */
		composer: function (callback) {
			var tool = this;
			var previewState = tool.preview.state;
			var state = this.state;

			/**
			 * Process composer submitting
			 * @method _process
			 */
			var _process = function () {
				var _error = function (err) {
					state.mainDialog.removeClass('Q_uploading');
					Q.alert(err);
				};

				const action = state.mainDialog.attr('data-action');
				const $currentContent = $(".Q_tabbing_container [data-content=" + action + "]", state.mainDialog);
				const $animatedThumbnail = $("img.animatedThumbnail", state.mainDialog);
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

				var params = {
					type: "Streams/video",
					attributes: {}
				};

				// stream not created yet, but teaser stream already exists, set attr Streams/teaser/video of future stream
				if (!tool.stream && tool.teaserVideoStream) {
					params.attributes['Streams/teaser/video'] = tool.teaserVideoStream.videoUrl();
				}

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

						params = Q.extend(params, 10, {
							title: siteData.title,
							content: siteData.description,
							icon: siteData.iconBig,
							attributes: {
								host: siteData.host,
								iconSmall: siteData.iconSmall,
								'Streams.videoUrl': url,
								'Q.file.url': "",
								clipStart: clipStart,
								clipEnd: clipEnd
							}
						});

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

					params = Q.extend(params, 10, {
						file: file,
						title: file.name,
						attributes: {
							clipStart: clipStart,
							clipEnd: clipEnd
						}
					});

					if ($animatedThumbnail.length) {
						params.animatedThumbnail = $animatedThumbnail.prop("src");
					}

					if (previewState.publisherId && previewState.streamName) { // if edit existent stream
						params.publisherId = previewState.publisherId;
						params.streamName = previewState.streamName;
						params.file.name = file.name;

						// for some reason attributes with null values doesn't send to backend in request
						// so specially update attributes
						if (Q.Streams.isStream(tool.stream)) {
							tool.stream.setAttribute("clipStart", clipStart);
							tool.stream.setAttribute("clipEnd", clipEnd);
							tool.stream.save();
						}
					}

					params.fileReader = function (callback) {
						if (!window.FileReader) {
							throw new Q.Exception("FileReader undefined");
						}
						// check file size
						if (params.file.size && params.file.size >= parseInt(Q.info.maxUploadSize)) {
							return Q.alert(tool.text.errorFileSize.interpolate({size: Q.humanReadable(Q.info.maxUploadSize, {bytes: true})}));
						}

						var reader = new FileReader();
						reader.onload = function (event) {
							params.file = {
								data: this.result,
								video: true
							};
							tool.closeComposer();
							delete params.fileReader;
							Q.handle(callback, tool, [params]);
						};
						reader.readAsDataURL(file);
					}
					/**
					 * Upload with Q.Video.upload if provider defined, and use default uploader otherwise
					 */
					if (Q.videos.provider) {
						if (previewState.related) {
							params['Q.Streams.related.publisherId'] = previewState.related.publisherId;
							params['Q.Streams.related.streamName'] = previewState.related.streamName || previewState.related.name;
							params['Q.Streams.related.type'] = previewState.related.type;
							params['Q.Streams.related.weight'] = previewState.related.weight;
						}

						Q.Video.upload(params, Q.videos.provider, function (err, res) {
							//console.log(this);
							var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(res && res.errors);
							if (msg) {
								if(state.mainDialog) state.mainDialog.removeClass('Q_uploading');
								return Q.handle([state.onError, state.onFinish], tool, [msg]);
							}

							tool.closeComposer();
							delete params.fileReader;
							return Q.handle(callback, tool, [res]);
						});
					} else {
						params.fileReader(callback);
					}
				} else if (action === "edit") {
					// edit stream attributes
					if (!Q.Streams.isStream(tool.stream)) {
						return _error("Stream not found");
					}

					var fields = {
						publisherId: previewState.publisherId,
						streamName: previewState.streamName,
						title, content,
						attributes: {
							clipStart, clipEnd
						}
					};

					if ($animatedThumbnail.length) {
						fields.animatedThumbnail = $animatedThumbnail.prop("src");
					}

					Q.req("Streams/stream", [], function () {
						Q.handle(callback, tool);
						tool.closeComposer();
					}, {
						method: "put",
						fields
					});
				} else {
					_error("Incorrect action " + action);
				}
			};

			Q.invoke({
				columnClass: "Streams_dialog_video",
				className: 'Streams_dialog_video',
				title: state.title || (tool.stream ? tool.text.video.EditVideo : tool.text.video.NewVideo),
				template: {
					name: 'Streams/video/composer',
					fields: {
						title: tool.stream && tool.stream.fields.title,
						content: tool.stream && tool.stream.fields.content,
						isComposer: state.isComposer,
						text: tool.text,
						teaser: state.teaser,
						uploadLimit: tool.text.video.uploadLimit.interpolate({size: Q.humanReadable(Q.info.maxUploadSize, {bytes: true})})
					}
				},
				fullscreen: Q.info.isMobile,
				destroyOnClose: true,
				trigger: null,
				onActivate: function () {
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

						$(".Q_tabbing_container [data-content=edit] button[name=animatedThumbnail]", state.mainDialog).show()

						$videoElement.tool("Q/video", {
							url: tool.stream.videoUrl() || tool.stream.fileUrl(),
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

					// teaser video
					if (state.teaser) {
						tool.applyTeaser($(".Q_tabbing_item[data-content=teaser]", state.mainDialog));
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
								return _error(tool.text.video.invalidFile);
							}
						} else if (action === 'link') {
							var url = $("input[name=url]", state.mainDialog).val();
							if (!url.matchTypes('url').length) {
								return _error(tool.text.video.invalidURL);
							}
						} else if (state.isComposer) {
							return _error(tool.text.video.errorNoSource);
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
						if (!this.files.length) {
							return;
						}
						var $videoElement = $(".Q_tabbing_container [data-content=upload] .Streams_video_composer_preview", state.mainDialog);
						var $clipElement = $(".Q_tabbing_container [data-content=upload] .Streams_video_composer_clip", state.mainDialog);
						var url = URL.createObjectURL(this.files[0]);
						var toolPreview = Q.Tool.from($videoElement, "Q/video");
						$(".Q_tabbing_container [data-content=upload] button[name=animatedThumbnail]", state.mainDialog).show()

						// check file size
						/*if (this.files[0].size >= parseInt(Q.info.maxUploadSize)) {
							this.value = null;
							return Q.alert(tool.text.video.errorFileSize.interpolate({size: Q.humanReadable(Q.info.maxUploadSize, {bytes: true})}));
						}*/

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
							return Q.alert(tool.text.video.invalidURL);
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

					$("button[name=animatedThumbnail]", state.mainDialog).on(Q.Pointer.fastclick, function () {
						var $this = $(this);
						var $videoElement = $this.closest(".Q_tabbing_item").find("video");
						if (!$videoElement.length) {
							return Q.alert(tool.text.animatedThumbnail.VideoElementNotFound);
						}
						$videoElement.tool("Streams/video/animatedThumbnail").activate(function () {
							this.state.onReady.set(function ($img) {
								$this.siblings("img.animatedThumbnail").remove();
								$this.before($img);
							}, tool);
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
		},
		applyTeaser: function ($container) {
			var tool = this;
			var previewState = tool.preview.state;

			var teaserVideoRelationType = tool.name + "_teaserVideo";
			var toPublisherId = tool.stream ? tool.stream.fields.publisherId : Q.getObject("related.publisherId", previewState);
			var toStreamName = tool.stream ? tool.stream.fields.name : Q.getObject("related.streamName", previewState);
			if (!toPublisherId || !toStreamName) {
				return console.warn("Streams/video/preview.applyTeaser: can't construct teaser because category undefined");
			}
			var _listenTeaserVideoStream = function (stream) {
				if (!tool.stream) {
					return;
				}

				stream.retain(tool);
				stream.onAttribute("Streams.videoUrl").set(function (attributes, k) {
					tool.stream.setAttribute("Streams/teaser/video", attributes[k]).save({
						onSave: function () {
							tool.stream.refresh(null, {
								messages: true,
								evenIfNotRetained: true
							});
						}
					});
				}, tool);
			};

			// onCreate video stream, check if teaser video exists and if yes unrelate from category and relate to this just created stream
			if (!tool.stream) {
				tool.preview.state.onCreate.set(function (stream) {
					tool.teaserVideoStream.unrelateFrom(toPublisherId, toStreamName, teaserVideoRelationType);
					tool.teaserVideoStream.relateTo(teaserVideoRelationType, stream.fields.publisherId, stream.fields.name);
				}, tool);
			}

			Q.Streams.related.force(toPublisherId, toStreamName, teaserVideoRelationType, true, function () {
				var options = {
					publisherId: previewState.publisherId,
					creatable: {
						title: tool.text.video.TeaserVideo,
						clickable: false,
						addIconSize: 0,
						streamType: "Streams/video"
					},
					related: {
						publisherId: toPublisherId,
						streamName: toStreamName,
						type: teaserVideoRelationType
					}
				};
				if (!Q.isEmpty(this.relatedStreams)) {
					tool.teaserVideoStream = Object.values(this.relatedStreams)[0];
					options.streamName = tool.teaserVideoStream.fields.name;
					_listenTeaserVideoStream(tool.teaserVideoStream);
				}

				$("<div>").tool("Streams/preview", options).tool("Streams/video/preview", {
					title: tool.text.video.TeaserVideo
				}).appendTo($container).activate(function () {
					Q.Tool.from(this.element, "Streams/preview").state.onCreate.set(function (stream) {
						tool.teaserVideoStream = stream;
						tool.stream && tool.stream.setAttribute("Streams/teaser/video", stream.videoUrl()).save({
							onSave: function () {
								tool.stream.refresh(null, {
									messages: true,
									evenIfNotRetained: true
								});
							}
						});
						_listenTeaserVideoStream(tool.teaserVideoStream);
					}, tool);

					Q.Tool.from(this.element, "Streams/video/preview").state.onInvoke.set(function () {
						var videoPreviewTool = this;
						Q.invoke({
							title: videoPreviewTool.stream.fields.title,
							content: $("<div>").tool("Q/video", {
								url: videoPreviewTool.stream.videoUrl()
							}),
							className: "Streams_topic_composer_teaser_video",
							trigger: videoPreviewTool.element,
							callback: function (options, index, div, data) {

							}
						});
					}, tool);
				});
			});
		}
	}
);

Q.Template.set('Streams/video/preview/view',
	'<div class="Streams_preview_container Streams_preview_view Q_clearfix">' +
	'	<img alt="icon" class="Streams_preview_icon">' +
	'	<div class="Streams_preview_contents">' +
	'		<h3 class="Streams_preview_title">{{{inplace}}}</h3>' +
	'	</div>' +
	'</div>',
	{text: ['Streams/content']}
);

Q.Template.set('Streams/video/composer',
`<div class="Streams_video_composer" data-composer="{{isComposer}}"><form>
		<div class="Q_tabbing_tabs">
		<div data-name="edit" class="Q_tabbing_tab">{{video.edit}}</div>
		<div data-name="upload" class="Q_tabbing_tab">{{video.upload}}</div>
		<div data-name="link" class="Q_tabbing_tab">{{video.link}}</div>
		{{#if teaser}}
		<div data-name="teaser" class="Q_tabbing_tab">{{preview.Teaser}}</div>
		{{/if}}
	</div>
	<div class="Q_tabbing_container">
		<div class="Q_tabbing_item" data-content="edit">
			<input name="title" value="{{title}}">
			<textarea name="content">{{content}}</textarea>
			<div class="Streams_video_composer_preview"></div>
			<div class="Streams_video_composer_clip"></div>
			<button type="button" name="animatedThumbnail">{{video.createAnimatedThumbnail}}</button>
		</div>
		<div class="Q_tabbing_item" data-content="upload">
			<input type="file" accept="video/*" class="Streams_video_file" />
			<div class="Streams_video_composer_upload_limit">{{uploadLimit}}</div>
			<div class="Streams_video_composer_preview"></div>
			<div class="Streams_video_composer_clip"></div>
			<button type="button" name="animatedThumbnail">{{video.createAnimatedThumbnail}}</button>
		</div>
		<div class="Q_tabbing_item" data-content="link">
			<label>
				<input name="url" placeholder="{{video.setUrl}}" type="url">
				<button name="setClip" type="button" class="Q_button">{{video.setClip}}</button>
			</label>
			<div class="Streams_video_composer_preview"></div>
			<div class="Streams_video_composer_clip"></div>
		</div>
		<div class="Q_tabbing_item" data-content="teaser">
			
		</div>
	</div>
	<div class="Streams_video_composer_submit"><button name="save" class="Q_button" type="button">{{video.save}}</button><button name="reset" type="reset" class="Q_button">{{video.reset}}</button></div>
</form></div>`,
	{text: ['Streams/content']}
);

})(Q, Q.jQuery, window);
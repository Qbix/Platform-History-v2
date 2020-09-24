(function (window, Q, $, undefined) {
	
/**
 * @module Q
 */
	
/**
 * YUIDoc description goes here
 * @class Q pdf
 * @constructor
 * @param {Object} [options] Override various options for this tool
 *  @param {String} [options.url] URL of pdf doc
 *  @param {string} [options.action=composer] What to start on tool activated. Can be "composer" and "implement".
 *  @param {string} [options.url] Source to get pdf from. Can be remote url or "blob:" for local files
 *  @param {string} [options.publisherId] Publisher of Streams/pdf stream
 *  @param {string} [options.streamName] Name of Streams/pdf stream
 *  @param {string} [options.fileUploadUHandler] Handler where to upload file
 *  @param {string} [options.fileUploadUHandler] Handler where to upload file
 *  @param {string} [options.clipStart] Clip start position
 *  @param {string} [options.clipEnd] Clip end position
 *  @param {Q.Event} [options.onSuccess] Call when stream save or upload action successfully ended.
 *  @param {Q.Event} [options.onFinish] Call when stream save or upload action ended.
 *  @param {Q.Event} [options.onError] Call when error occur.
 *  @param {Q.Event} [options.onScroll] Call when pdf scrolled.
 *  @param {Q.Event} [options.onRender] Call when pdf rendered.
 *  @param {Q.Event} [options.onEnded] Call when pdf scrolled to the end.
 *
 */
Q.Tool.define("Q/pdf", function (options) {
	var tool = this;
	var state = tool.state;

	if (state.url) {
		state.url = state.url.interpolate({ "baseUrl": Q.info.baseUrl });
	}

	var p = Q.pipe(['stylesheet', 'text', 'stream'], function (params, subjects) {
		tool.text = params.text[1].pdf;

		Q.handle(tool[state.action], tool);
	});

	Q.addStylesheet(["{{Q}}/css/pdf.css"], p.fill('stylesheet'), { slotName: 'Q' });
	// we specially don' wait pdfjs lib loading, because it too big
	// it will load during user actions
	Q.addScript("{{Q}}/js/pdfjs/build/pdf.js");
	Q.Text.get('Q/content', p.fill('text'));

	tool.stream = null;
	if (state.publisherId && state.streamName) {
		state.isComposer = false;
		Q.Streams.get(state.publisherId, state.streamName, function () {
			tool.stream = this;
			p.fill('stream')();
		});
	} else {
		p.fill('stream')();
	}

	tool.Q.onStateChanged('clipStart').set(function () {
		tool.setClip("start")
	});
	tool.Q.onStateChanged('clipEnd').set(function () {
		tool.setClip("end")
	});
},

{
	action: "composer",
	url: null,
	isComposer: true,
	publisherId: null,
	streamName: null,
	fileUploadUHandler: Q.action("Q/file"),
	currentPosition: 0,
	clipStart: null,
	clipEnd: null,
	pdfInfo: {},
	onSuccess: new Q.Event(),
	onError: new Q.Event(function (message) {
		Q.alert('Flie upload error' + (message ? ': ' + message : '') + '.');
	}, 'Q/audio'),
	onFinish: new Q.Event(),
	/* </Q/audio jquery plugin states> */
	onRender: new Q.Event(function (numPages, element) {
		// remove preloader
		this.$preloader && this.$preloader.remove();

		this.state.stuffHeight = this.element.scrollHeight;

		this.setClip("start");
		this.setClip("end");
	}),
	onEnded: new Q.Event()
},

{
	/**
	 * Check clip borders and pause if outside
	 * @method checkClip
	 */
	checkClip: function () {
		var tool = this;
		var elementHeight = $(tool.element).height();
		var elementScrollTop = tool.element.scrollTop;
		var topClipLimit = tool.getClip("start");
		var bottomClipLimit = tool.getClip("end");

		// check if selected clip gap less than element height
		if (topClipLimit && bottomClipLimit && bottomClipLimit - topClipLimit < elementHeight) {
			return tool.setCurrentPosition(topClipLimit - (elementHeight - (bottomClipLimit - topClipLimit))/2);
		}

		// check clipStart border
		if (topClipLimit && topClipLimit && elementScrollTop < topClipLimit) {
			tool.setCurrentPosition(topClipLimit);
		}

		// check clipEnd border
		if (bottomClipLimit && bottomClipLimit && (elementScrollTop + elementHeight) > bottomClipLimit) {
			tool.setCurrentPosition(bottomClipLimit - elementHeight);
		}
	},
	/**
	 * Refreshes the appearance of the tool completely
	 * @method implement
	 */
	implement: function () {
		var tool = this;
		var state = this.state;
		var $toolElement = $(tool.element);

		// add preloader to cover up tool.element till pdf rendered (state.onRender)
		if (!tool.$preloader) {
			tool.$preloader = $("<div class='Q_pdf_preloader'><img src='" + Q.url("{{Q}}/img/throbbers/loading.gif") + "'></div>").appendTo(tool.element);
		}

		// wait till lib loaded
		if (Q.typeOf(window.pdfjsLib) === "undefined") {
			return setTimeout(tool.implement.bind(tool), 500);
		}

		// listen scroll event of preview element
		$toolElement.on("scroll", function () {
			state.currentPosition = ($toolElement.scrollTop()/state.stuffHeight * 100).toPrecision(3);

			tool.checkClip();
		});

		var loadingTask = pdfjsLib.getDocument(state.url);

		loadingTask.promise.then(function(pdf) {
			state.pdf = pdf;

			pdf.getMetadata().then(function(stuff) {
				state.pdfInfo.title = Q.getObject("info.Title", stuff) || Q.getObject("contentDispositionFilename", stuff);
				state.pdfInfo.description = Q.getObject("info.Subject", stuff);
				state.pdfInfo.author = Q.getObject("info.Author", stuff);
			}).catch(function(err) {
				console.log('Q/pdf: Error getting meta data');
				console.log(err);
			});

			tool.renderPage();
		});
	},
	/**
	 * Start pdf composer dialog
	 * @method renderPage
	 */
	renderPage: function (page) {
		var tool = this;
		var state = this.state;
		var pdf = state.pdf;
		var $toolElement = $(tool.element);

		if (!page) {
			return pdf.getPage(1).then(tool.renderPage.bind(tool));
		}

		//This gives us the page's dimensions at full scale
		var viewport = page.getViewport({
			scale: $toolElement.width()/page.getViewport({scale: 0.5}).width
		});

		//We'll create a canvas for each page to draw it on
		var canvas = document.createElement("canvas");
		canvas.style.display = "block";
		canvas.height = viewport.height;
		canvas.width = viewport.width;

		var context = canvas.getContext('2d');

		//Draw it on the canvas
		page.render({
			canvasContext: context,
			viewport: viewport
		});

		//Add it to the web page
		tool.element.appendChild(canvas);

		var currPage = page.pageNumber + 1;

		//Move to next page
		if (pdf !== null && currPage <= pdf.numPages) {
			pdf.getPage(currPage).then(tool.renderPage.bind(tool));
		} else if (currPage >= pdf.numPages) {
			Q.handle(state.onRender, tool, [pdf.numPages, tool.element]);
		}
	},
	/**
	 * Start pdf composer dialog
	 * @method composer
	 */
	composer: function () {
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
			var $currentContent = $(".Q_pdf_composer_content [data-content=" + action + "]", state.mainDialog);
			if (!$currentContent.length) {
				return _error("No action selected");
			}
			var clipTool = Q.Tool.from($(".Q_clip_tool", $currentContent), "Q/clip");
			var clipStart = clipTool ? clipTool.getPosition("start") : null;
			var clipEnd = clipTool ? clipTool.getPosition("end") : null;

			state.mainDialog.addClass('Q_uploading');

			if (action === "link") {
				// url defined
				var url = $("input[name=url]", $currentContent).val();
				if (!url) {
					return _error("Link not found");
				}

				Q.req('Websites/pdf', ['result'], function (err, response) {
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
							'Q.file.url': siteData.destinationUrl,
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
								Q.handle([state.onSuccess, state.onFinish], tool, [params]);
								Q.Dialogs.pop();
							}
						});
					} else {
						// new stream
						Q.handle([state.onSuccess, state.onFinish], tool, [params]);
						Q.Dialogs.pop();
					}
				}, {
					method: 'post',
					fields: {url: url}
				});
			} else if (action === "upload") {
				var $file = $("input[type=file].Q_pdf_file", $currentContent);
				// state.file set in recorder OR html file element
				var file = ($file.length && $file[0].files[0]) || null;
				var pdfPreview = Q.Tool.from($(".Q_pdf_composer_preview.Q_pdf_tool", tool.element), "Q/pdf");

				// check file size
				if (file.size && file.size >= parseInt(Q.info.maxUploadSize)) {
					return Q.alert(tool.text.errorFileSize.interpolate({size: tool.humanFileSize()}));
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

								Q.handle([state.onSuccess, state.onFinish], tool, [res.slots.data, key, file || null]);

								Q.Dialogs.pop();
							}, {
								fields: params,
								method: "put"
							});
						} else {
							Q.alert('FileReader undefined');
						}
					} else { // if new stream
						Q.handle([state.onSuccess, state.onFinish], tool, [params]);
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
			className: 'Q_dialog_pdf',
			title: "PDF",
			template: {
				name: 'Q/pdf/composer',
				fields: {
					isComposer: state.isComposer,
					text: tool.text,
					uploadLimit: tool.text.uploadLimit.interpolate({size: tool.humanFileSize(Q.info.maxUploadSize)})
				}
			},
			destroyOnClose: true,
			onActivate : function (mainDialog) {
				state.mainDialog = mainDialog;

				// if stream defined, render player
				if (tool.stream) {
					var $pdfElement = $(".Q_pdf_composer_content [data-content=edit] .Q_pdf_composer_preview", mainDialog);
					var $clipElement = $(".Q_pdf_composer_content [data-content=edit] .Q_pdf_composer_clip", mainDialog);
					var clipStart = tool.stream.getAttribute('clipStart');
					var clipEnd = tool.stream.getAttribute('clipEnd');

					$pdfElement.tool("Q/pdf", {
						action: "implement",
						clipStart: clipStart,
						clipEnd: clipEnd,
						url: tool.stream.fileUrl()
					}).activate(function () {
						var toolPreview = this;

						$clipElement.tool("Q/clip", {
							startPosition: clipStart,
							startPositionDisplay: clipStart + '%',
							endPosition: clipEnd,
							endPositionDisplay: clipEnd + '%',
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
					var action = $this.prop('name');

					mainDialog.attr("data-action", action);
					$this.addClass('Q_selected').siblings().removeClass('Q_selected');
					$(".Q_pdf_composer_content [data-content=" + action + "]", mainDialog).addClass('Q_selected').siblings().removeClass('Q_selected');
				};
				$(".Q_pdf_composer_select button", mainDialog).on(Q.Pointer.fastclick, _selectTab);
				// select first visible tab
				Q.handle(_selectTab, $(".Q_pdf_composer_select button:visible:first", mainDialog)[0]);

				// Reset button
				$("button[name=reset]", mainDialog).on(Q.Pointer.click, function (e) {
					state.dataBlob = undefined;

					Q.each($(".Q_pdf_composer_content [data-content=link], .Q_pdf_composer_content [data-content=upload]", mainDialog), function (i, content) {
						var pdfTool = Q.Tool.from($(".Q_pdf_composer_preview", content)[0], "Q/pdf");
						var clipTool = Q.Tool.from($(".Q_pdf_composer_clip", content)[0], "Q/clip");

						if (pdfTool) {
							$("<div>").addClass('Q_pdf_composer_preview').insertAfter(pdfTool.element);
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
					var $pdfElement = $(".Q_pdf_composer_content [data-content=upload] .Q_pdf_composer_preview", mainDialog);
					var $clipElement = $(".Q_pdf_composer_content [data-content=upload] .Q_pdf_composer_clip", mainDialog);
					var url = URL.createObjectURL(this.files[0]);
					var toolPreview = Q.Tool.from($pdfElement, "Q/pdf");

					// check file size
					if (this.files[0].size >= parseInt(Q.info.maxUploadSize)) {
						this.value = null;
						return Q.alert(tool.text.errorFileSize.interpolate({size: tool.humanFileSize(Q.info.maxUploadSize)}));
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
					var $pdfElement = $(".Q_pdf_composer_content [data-content=link] .Q_pdf_composer_preview", mainDialog);
					var $clipElement = $(".Q_pdf_composer_content [data-content=link] .Q_pdf_composer_clip", mainDialog);
					var url = $("input[name=url]", mainDialog).val();
					if (!url.matchTypes('url').length) {
						return Q.alert(tool.text.invalidURL);
					}

					Q.Tool.remove($pdfElement[0], true);
					Q.Tool.remove($clipElement[0], true);

					$pdfElement.empty();
					$clipElement.empty();

					Q.req("Websites/pdf", ["result"], function (err, response) {
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
	},
	/**
	 * @method setCurrentPosition
	 * @param {number} position in pixels related to top
	 */
	setCurrentPosition: function (position) {
		var element = this.element;
		element.scrollTo(element.scrollLeft, position);
	},
	/**
	 * @method setClip
	 * @param {string} which Which side to setup, "start" or "end"
	 */
	setClip: function (which) {
		var tool = this;
		var state = this.state;
		var className = "Q_pdf_clip_" + which;
		var clipValue = tool.getClip(which);

		var $element = $("." + className, tool.element);

		if (clipValue === null) {
			return $element.remove();
		}

		if (!$element.length) {
			$element = $("<div>").addClass(className).appendTo(tool.element);
		}

		var height = 0;
		var top = 0;
		switch (which) {
			case "start":
				height = clipValue;
				break;
			case "end":
				height = state.stuffHeight - clipValue;
				top = clipValue;
				break;
		}

		$element.css({
			height: height,
			top: top,
			width: tool.element.scrollWidth
		});

		// scroll doc to clipStart
		if (which === "start") {
			$(tool.element).scrollTop(clipValue);
		}
	},
	/**
	 * Get clip border in pixels related to top
	 * @method getClip
	 * @param {string} which Which side to setup, "start" or "end"
	 */
	getClip: function (which) {
		var clipValue = this.state["clip" + which.toCapitalized()] || null;

		if (clipValue === null) {
			return null;
		}

		return this.state.stuffHeight * clipValue / 100;
	},
	/**
	 * Convert bytes integer to human readable string
	 * @method humanFileSize
	 */
	humanFileSize: function humanFileSize(bytes, si=false, dp=1) {
		var thresh = si ? 1000 : 1024;

		if (Math.abs(bytes) < thresh) {
			return bytes + ' B';
		}

		/*var units = si
			? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
			: ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
		*/
		var units = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
		var u = -1;
		var r = 10**dp;

		do {
			bytes /= thresh;
			++u;
		} while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


		return bytes.toFixed(dp) + ' ' + units[u];
	}
});

Q.Template.set('Q/pdf/composer',
	'<div class="Q_pdf_composer" data-composer="{{isComposer}}"><form>'
	+ '  <div class="Q_pdf_composer_select">'
	+ '  	<button name="edit" type="button">{{text.edit}}</button>'
	+ '  	<button name="upload" type="button">{{text.upload}}</button>'
	+ '  	<button name="link" type="button">{{text.link}}</button>'
	+ '  </div>'
	+ '  <div class="Q_pdf_composer_content">'
	+ '	 	<div data-content="edit">'
	+ '			<div class="Q_pdf_composer_preview"></div>'
	+ '			<div class="Q_pdf_composer_clip"></div>'
	+ '  	</div>'
	+ '  	<div data-content="upload">'
	+ '	   		<input type="file" accept="application/pdf" class="Q_pdf_file" />'
	+ '			<div class="Q_pdf_composer_upload_limit">{{uploadLimit}}</div>'
	+ '			<div class="Q_pdf_composer_preview"></div>'
	+ '			<div class="Q_pdf_composer_clip"></div>'
	+ '		</div>'
	+ '  	<div data-content="link">'
	+ '	   		<label>'
	+ '				<input name="url" placeholder="{{text.seturl}}" type="url">'
	+ '				<button name="setClip" type="button" class="Q_button">{{text.setClip}}</button>'
	+ '			</label>'
	+ '			<div class="Q_pdf_composer_preview"></div>'
	+ '			<div class="Q_pdf_composer_clip"></div>'
	+ '		</div>'
	+ '  </div>'
	+ '  <div class="Q_pdf_composer_submit"><button name="save" class="Q_button" type="button">{{text.save}}</button><button name="reset" type="reset" class="Q_button">{{text.reset}}</button></div>'
	+ '</form></div>'
);

})(window, Q, jQuery);
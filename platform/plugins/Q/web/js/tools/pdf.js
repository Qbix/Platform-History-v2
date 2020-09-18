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
 *  @param {boolean} [options.autoplay=false] If true - start play on load
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
},

{
	action: "composer",
	url: null,
	isComposer: true,
	publisherId: null,
	streamName: null,
	fileUploadUHandler: Q.action("Q/file"),
	preprocess: null,
	duration: 0,
	currentPosition: 0,
	clipStart: null,
	clipEnd: null,
	onSuccess: new Q.Event(),
	onError: new Q.Event(function (message) {
		Q.alert('Flie upload error' + (message ? ': ' + message : '') + '.');
	}, 'Q/audio'),
	onFinish: new Q.Event(),
	/* </Q/audio jquery plugin states> */
	onLoad: new Q.Event(),
	onPlay: new Q.Event(function () {
		this.checkClip();
	}),
	onPause: new Q.Event(),
	onSeek: new Q.Event(),
	onEnded: new Q.Event()
},

{
	/**
	 * Check clip borders and pause if outside
	 * @method checkClip
	 */
	checkClip: function () {
		var tool = this;
		var state = this.state;

		// clipStart handler
		if (state.clipStart && state.currentPosition < state.clipStart) {
			tool.setCurrentPosition(state.clipStart);
		}
		// clipStart handler
		if (state.clipEnd && state.currentPosition > state.clipEnd) {
			tool.pause();
			tool.setCurrentPosition(state.clipEnd);
		}
	},
	/**
	 * Refreshes the appearance of the tool completely
	 * @method implement
	 */
	implement: function () {
		var tool = this;
		var state = this.state;


		var loadingTask = pdfjsLib.getDocument(state.url);

		loadingTask.promise.then(function(pdf) {
			state.pdf = pdf;
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
			scale: $toolElement.width()/page.getViewport({scale:1}).width
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
		if (pdf !== null && currPage <= pdf.numPages)
		{
			pdf.getPage(currPage).then(tool.renderPage.bind(tool));
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
			var clipStart = clipTool ? clipTool.getTime("start") : null;
			var clipEnd = clipTool ? clipTool.getTime("end") : null;

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

				// check file size
				if (file.size && file.size >= parseInt(Q.info.maxUploadSize)) {
					return Q.alert(tool.text.errorFileSize.interpolate({size: tool.humanFileSize()}));
				}

				var reader = new FileReader();
				reader.onload = function (event) {
					if (state.preprocess) {
						Q.handle(state.preprocess, tool);
					}

					var params = {
						title: file.name,
						attributes: {
							clipStart: clipStart,
							clipEnd: clipEnd
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

					$pdfElement.tool("Q/pdf", {
						action: "implement",
						clipStart: tool.stream.getAttribute('clipStart'),
						clipEnd: tool.stream.getAttribute('clipEnd'),
						url: tool.stream.fileUrl(),
						onPlaying: function () {
							if (this.clipTool) {
								this.clipTool.setTime(this.state.currentPosition, 'start');
								this.clipTool.setTime(this.state.currentPosition, 'end');
							}
						}
					}).activate(function () {
						var toolPreview = this;
						$clipElement.tool("Q/clip", {
							start: tool.stream.getAttribute('clipStart'),
							end: tool.stream.getAttribute('clipEnd'),
							onStart: function (time) {
								toolPreview.state.clipStart = time;
							},
							onEnd: function (time) {
								toolPreview.state.clipEnd = time;
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
				$(".Q_pdf_composer_select button", mainDialog).on(Q.Pointer.click, function (e) {
					var $this = $(this);
					var action = $this.prop('name');

					if (action === "record") {
						tool.recorderStateChange("init");
					}

					mainDialog.attr("data-action", action);
					$this.addClass('Q_selected').siblings().removeClass('Q_selected');
					$(".Q_pdf_composer_content [data-content=" + action + "]", mainDialog).addClass('Q_selected').siblings().removeClass('Q_selected');
				});

				// Reset button
				$("button[name=reset]", mainDialog).on(Q.Pointer.click, function (e) {
					state.dataBlob = undefined;

					Q.each($(".Q_pdf_composer_content [data-content=link], .Q_pdf_composer_content [data-content=upload]", mainDialog), function (i, content) {
						var pdfTool = Q.Tool.from($(".Q_pdf_composer_preview", content)[0], "Q/pdf");
						var clipTool = Q.Tool.from($(".Q_pdf_composer_clip", content)[0], "Q/clip");

						// remove Q/pdf and Q/clip tools from upload and link sections
						Q.each([pdfTool, clipTool], function (i, resetTool) {
							if (Q.typeOf(resetTool) !== 'Q.Tool') {
								return;
							}

							Q.Tool.remove(resetTool.element, true, true);
						});
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
						url: url,
						onPlaying: function () {
							if (this.clipTool) {
								this.clipTool.setTime(this.state.currentPosition, 'start');
								this.clipTool.setTime(this.state.currentPosition, 'end');
							}
						}
					}).activate(function () {
						toolPreview = this;
						$clipElement.tool("Q/clip", {
							onStart: function (time) {
								toolPreview.state.clipStart = time;
							},
							onEnd: function (time) {
								toolPreview.state.clipEnd = time;
							}
						}).activate(function () {
							toolPreview.clipTool = this;
						});
					});
				});

				// set clip start/end for link
				$("button[name=setClip]", mainDialog).on(Q.Pointer.fastclick, function () {
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

					$pdfElement.tool("Q/pdf", {
						action: "implement",
						url: url,
						onPlaying: function () {
							if (this.clipTool) {
								this.clipTool.setTime(this.state.currentPosition, 'start');
								this.clipTool.setTime(this.state.currentPosition, 'end');
							}
						}
					}).activate(function () {
						var toolPreview = this;
						$clipElement.tool("Q/clip", {
							onStart: function (time) {
								toolPreview.state.clipStart = time;
							},
							onEnd: function (time) {
								toolPreview.state.clipEnd = time;
							}
						}).activate(function () {
							toolPreview.clipTool = this;
						});
					});
				});

				$(".Q_pdf_composer_select button:visible:first", mainDialog).click();
			},
			beforeClose: function(mainDialog) {

			}
		});
	},
	/**
	 * @method play
	 */
	play: function () {
		this.state.player && this.state.player.play();
	},
	/**
	 * @method pause
	 */
	pause: function () {
		this.state.player && this.state.player.pause();
	},
	/**
	 * @method setCurrentPosition
	 * @param {integer} position in milliseonds
	 */
	setCurrentPosition: function (position) {
		this.state.player && this.state.player.currentTime(position);
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
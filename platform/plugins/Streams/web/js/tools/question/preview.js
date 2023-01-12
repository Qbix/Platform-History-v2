(function (Q, $, window, undefined) {

/**
 * Streams/question/preview tool.
 * Renders a tool to preview Streams/question stream
 * @class Streams/question/preview
 * @constructor
 * @param {Object} [options] options to pass besides the ones to Streams/preview tool
 * @param {Boolean} [multipleAnswers=false] Whether users can give more than one answer
 * @param {Q.Event} [options.onInvoke] occur onclick tool element
 */
Q.Tool.define("Streams/question/preview", ["Streams/preview"], function _Streams_question_preview (options, preview) {
	var tool = this;
	var $toolElement = $(tool.element);
	var state = this.state;
	tool.preview = preview;

	Q.addStylesheet('{{Streams}}/css/tools/previews.css', { slotName: 'Streams' });

	preview.state.editable = ["icon", "title"];
	Q.Text.get('Streams/content', function (err, text) {
		var msg = Q.firstErrorMessage(err);
		if (msg) {
			return console.warn(msg);
		}

		tool.text = text.questions;
		preview.state.onRefresh.add(tool.refresh.bind(tool));
		preview.state.creatable.preprocess = tool.composer.bind(tool);
	});

	if (preview.state.streamName) {
		$toolElement.on(Q.Pointer.fastclick, function () {
			Q.handle(state.onInvoke, tool);
		});
	}

	preview.state.onLoad.add(function () {
		// add edit action
		$toolElement.plugin('Q/actions', {
			actions: {
				edit: tool.edit.bind(tool),
				delete: function () {
					Q.confirm(tool.text.AreYouSure, function (result) {
						if (!result) {
							return;
						}

						tool.preview.delete();
					});
				}
			}
		});
	}, tool);
},

{
	multipleAnswers: false,
	onInvoke: new Q.Event()
},

{
	refresh: function (stream) {
		var tool = this;
		var state = this.state;
		tool.stream = stream;
		var publisherId = stream.fields.publisherId;
		var streamName = stream.fields.name;
		var $toolElement = $(tool.element);

		// retain with stream
		Q.Streams.retainWith(tool).get(publisherId, streamName);

		$toolElement.tool("Streams/default/preview").activate(function () {
			var $previewContents = $(".Streams_preview_contents", tool.element);

			var content = stream.fields.content;
			if (content) {
				$("<div class='Streams_question_subtitle'>").appendTo($previewContents).html(content);
			}

			tool.$answersRelated = $("<div>").insertAfter($toolElement);
			tool.$answersRelated.tool("Streams/related", {
				publisherId: publisherId,
				streamName: streamName,
				relationType: "Streams/answers",
				isCategory: true,
				relatedOptions: {
					ascending: true,
				},
				realtime: false,
				sortable: true
			}).activate(function () {
				$(".Streams_preview_container", $toolElement).on(Q.Pointer.fastclick, function (event) {
					// check if user already answer
					if (!state.multipleAnswers) {
						var answered = false;
						if (answered) {
							return Q.alert(tool.text.AlreadyAnswered);
						}
					}
				});
			});

			tool.$answersRelated[0].forEachTool("Streams/answer/preview", function () {
				this.state.onRefresh.add(function () {
					var answerTool = this;
					var reqOptions = {
						publisherId: answerTool.stream.fields.publisherId,
						streamName: answerTool.stream.fields.name,
						type: answerTool.stream.getAttribute("type"),
						multipleAnswers: state.multipleAnswers
					};
					$("input[type=radio],input[type=checkbox]", answerTool.element).on('change', function () {
						var $this = $(this);

						if (!$this.prop("checked")) {
							Q.req('Streams/answer', [], function (err, response) {
								var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(response && response.errors);
								if (msg) {
									$this.prop("checked", true);
									return Q.alert(msg);
								}
							}, {
								method: 'put',
								fields: Q.extend(reqOptions, {
									content: ""
								})
							});
							return;
						}

						$("input[type=radio],input[type=checkbox]", tool.$answersRelated).not($this).each(function () {
							var $_this = $(this);

							if (!$_this.prop("checked")) {
								return;
							}

							if (!state.multipleAnswers || ($_this.prop("type") === "radio" && $this.prop("type") === "radio")) {
								$_this.prop("checked", false).trigger("change");
							}
						});

						Q.req('Streams/answer', [], function (err, response) {
							var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(response && response.errors);
							if (msg) {
								$this.prop("checked", false);
								return Q.alert(msg);
							}
						}, {
							method: 'put',
							fields: Q.extend(reqOptions, {
								content: $this.val()
							})
						});
					});

					$("button[name=send]", answerTool.element).on(Q.Pointer.click, function () {
						var $text = $("input[type=text]", answerTool.element);
						if (!$text.length) {
							return console.warn("text element not found");
						}

						Q.req('Streams/answer', [], function (err, response) {
							var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(response && response.errors);
							if (msg) {
								$this.prop("checked", false);
								return Q.alert(msg);
							}
						}, {
							method: 'put',
							fields: Q.extend(reqOptions, {
								content: $text.val()
							})
						});
					});
				}, this);
			}, tool);
		});

		// on create question call edit immediately
		tool.preview.state.onNewStreamPreview.add(tool.edit.bind(tool), tool);
	},

	/**
	 * Start composer dialog
	 * @method composer
	 * @param {function} callback Need to call this function to start create stream process
	 */
	composer: function (callback) {
		var tool = this;

		Q.prompt(null, function (value) {
			if (!value) {
				return;
			}

			Q.handle(callback, tool, [{
				title: value
			}]);
		}, {
			title: tool.text.NewQuestion
		});
	},
	/**
	 * Start edit dialog
	 * @method edit
	 */
	edit: function () {
		var tool = this;

		Q.Dialogs.push({
			title: tool.text.EditQuestion,
			className: "Streams_dialog_editQuestion",
			template: {
				name: "Streams/question/composer"
			},
			onActivate: function (dialog) {
				$(".Streams_question_title", dialog).tool("Streams/inplace", {
					stream: tool.stream,
					field: "title",
					inplaceType: "text",
					inplace: {
						placeholder: tool.text.TitlePlaceholder,
						selectOnEdit: false
					}
				}).activate();
				$(".Streams_question_subtitle", dialog).tool("Streams/inplace", {
					stream: tool.stream,
					field: "content",
					inplaceType: "textarea",
					inplace: {
						placeholder: tool.text.ContentPlaceholder,
						selectOnEdit: false
					}
				}).activate();
				$(".Streams_question_answers", dialog).tool("Streams/related", {
					stream: tool.stream,
					relationType: "Streams/answers",
					realtime: false,
					sortable: true,
					isCategory: true,
					composerPosition: "last",
					relatedOptions: {
						ascending: true,
					},
					creatable: {
						"Streams/answer": {
							publisherId: tool.stream.fields.publisherId,
							title: tool.text.NewPossibleAnswer
						}
					}
				}).activate();
			},
			onClose: function () {
				var answersRelated = Q.Tool.from(tool.$answersRelated, "Streams/related");
				if (answersRelated) {
					answersRelated.refresh();
				}
			}
		});
	},
	Q: {
		beforeRemove: function () {
			var $answersRelated = this.$answersRelated;
			if ($answersRelated && $answersRelated.length) {
				// remove answers related tool
				Q.Tool.remove($answersRelated[0], true, true);
			}
		}
	}
});

Q.Template.set('Streams/question/composer',
	`<div class="Streams_question_title"></div>
	<div class="Streams_question_subtitle"></div>
	<h2 class="Streams_question_head">{{questions.Answers}}</h2>
	<div class="Streams_question_answers"></div>`,
	{text: ['Streams/content']}
);

})(Q, Q.$, window);
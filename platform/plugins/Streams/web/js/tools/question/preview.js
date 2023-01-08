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
	var state = this.state;
	tool.preview = preview;

	Q.addStylesheet('{{Streams}}/css/tools/previews.css', { slotName: 'Streams' });

	preview.state.editable = ["icon"];
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
		$(tool.element).on(Q.Pointer.fastclick, function () {
			Q.handle(state.onInvoke, tool);
		});
	}

	if (tool.element.parentNode) {
		// observe dom elements for mutation
		tool.domObserver = new MutationObserver(function (mutations) {
			mutations.forEach(function(mutation) {
				if (mutation.type !== 'childList' || Q.isEmpty(mutation.removedNodes)) {
					return;
				}

				mutation.removedNodes.forEach(function(removedElement) {
					if (removedElement.id === tool.element.id) {
						if (tool.$answersRelated && tool.$answersRelated.length) {
							// remove answers related tool
							Q.Tool.remove(tool.$answersRelated[0], true, true);
						}

						tool.domObserver.disconnect();
					}
				});
			});
		});
		tool.domObserver.observe(tool.element.parentNode, {childList: true});
	}

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
		var userId = Q.Users.loggedInUserId();

		// retain with stream
		Q.Streams.retainWith(tool).get(publisherId, streamName);

		$toolElement.tool("Streams/default/preview").activate(function () {
			var $previewContainer = $(".Streams_preview_container", tool.element);

			if (!$previewContainer.length) {
				return console.warn("Streams/question/preview: previewContainer not found");
			}

			tool.$answersRelated = $("<div>").insertAfter($toolElement);
			tool.$answersRelated.tool("Streams/related", {
				publisherId: publisherId,
				streamName: streamName,
				relationType: "Streams/answer",
				isCategory: true,
				realtime: true,
				sortable: false,
				beforeRenderPreview: function (tff) {
					if (!stream.testWriteLevel("edit") && tff.publisherId !== userId) {
						return false;
					}
				},
				creatable: {
					"Streams/answer": {
						publisherId: userId,
						title: tool.text.NewAnswer
					}
				}
			}).activate(function () {
				var relatedTool = this;

				$(".Streams_preview_container", $toolElement).on(Q.Pointer.fastclick, function (event) {
					// check if user already answer
					if (!state.multipleAnswers) {
						var answered = false;
						$(".Streams_preview_tool", relatedTool.element).each(function () {
							var previewTool = Q.Tool.from(this, "Streams/preview");

							if (previewTool.state.streamName && previewTool.state.publisherId === userId) {
								answered = true;
							}
						});

						if (answered) {
							return Q.alert(tool.text.AlreadyAnswered);
						}
					}

					var composerTool = Q.Tool.from($(".Streams_preview_composer", tool.$answersRelated), "Streams/preview");
					composerTool.create(event);
				});
			});
		});
	},

	/**
	 * Start composer dialog
	 * @method composer
	 * @param {function} callback Need to call this function to start create stream process
	 */
	composer: function (callback) {
		var tool = this;

		Q.Dialogs.push({
			title: tool.text.NewQuestion,
			className: "Streams_dialog_newQuestion",
			content: $("<div>").tool("Streams/question", {
				mode: "questionComposer"
			}),
			onActivate: function (dialog) {
				var questionTool = Q.Tool.from($(".Streams_question_tool", dialog), "Streams/question");

				if (!questionTool) {
					throw new Q.error("Streams/question/preview: question tool not found");
				}

				questionTool.state.onSubmit.set(function (title, content, answers) {
					Q.Dialogs.pop();

					Q.handle(callback, tool, [{
						title: title,
						content: content,
						attributes: {
							answers: answers
						}
					}]);
				}, tool);
			}
		});
	}
});

})(Q, Q.$, window);
(function (Q, $, window, undefined) {
/**
 * Streams/answer/preview tool.
 * Renders a tool to preview Streams/answer stream
 * @class Streams/answer/preview
 * @constructor
 * @param {Object} [options] options to pass besides the ones to Streams/preview tool
 * @param {integer} [options.titleMaxLength] max length of stream title
 * @param {Q.Event} [options.onInvoke] occur onclick tool element
 */
Q.Tool.define("Streams/answer/preview", ["Streams/preview"], function _Streams_answer_preview (options, preview) {
	var tool = this;
	var state = this.state;
	tool.preview = preview;

	preview.state.editable = false;

	Q.addStylesheet('{{Streams}}/css/tools/previews.css', { slotName: 'Streams' });

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
},

{
	titleMaxLength: 255,
	onInvoke: new Q.Event()
},

{
	refresh: function (stream) {
		var tool = this;
		tool.stream = stream;
		var publisherId = stream.fields.publisherId;
		var streamName = stream.fields.name;
		var $toolElement = $(tool.element);

		// retain with stream
		Q.Streams.retainWith(tool).get(publisherId, streamName);

		$toolElement.tool("Streams/default/preview").activate(function () {
			$(".Streams_preview_icon", this.element).replaceWith($("<div>").tool("Users/avatar", {
				userId: publisherId,
				short: true
			}).activate());
		});

		$toolElement.on(Q.Pointer.fastclick, function () {
			Q.Dialogs.push({
				title: tool.text.AnswerDetails,
				className: "Streams_dialog_answer",
				template: {
					name: "Streams/answer/view",
					fields: {
						options: stream.getAttribute("options") || [],
						content: stream.fields.content
					}
				}
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
		var previewState = tool.preview.state;

		Q.Dialogs.push({
			title: tool.text.AnswerQuestion,
			className: "Streams_dialog_answer",
			content: $("<div>").tool("Streams/question", {
				mode: "answerComposer",
				publisherId: previewState.related.publisherId,
				streamName: previewState.related.streamName
			}),
			onActivate: function (dialog) {
				var questionTool = Q.Tool.from($(".Streams_question_tool", dialog), "Streams/question");

				if (!questionTool) {
					throw new Q.error("Streams/answer/preview: question tool not found");
				}

				questionTool.state.onSubmit.set(function (answers) {
					Q.Dialogs.pop();

					var title = "";
					var content = "";

					if (!Q.isEmpty(answers.options)) {
						title = answers.options.join(". ");
					}

					if (answers.textarea) {
						title = title || answers.textarea;
						content = answers.textarea;
					}

					if (title.length > 255) {
						title = title.substring(0, 255) + "...";
					}

					Q.handle(callback, tool, [{
						title: title,
						content: content,
						attributes: {
							options: answers.options
						}
					}]);
				}, tool);
			}
		});
	}
});

Q.Template.set("Streams/answer/view",
	'<ul>' +
	'{{#each options}}' +
		'<li>{{this}}</li>' +
	'{{/each}}' +
	'</ul>' +
	'<div class="Streams_answer_content">{{content}}</div>'
);
})(Q, Q.$, window);
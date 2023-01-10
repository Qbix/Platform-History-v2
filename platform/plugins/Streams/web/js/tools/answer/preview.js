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

	preview.state.editable = ["icon", "title"];

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
	onRefresh: new Q.Event(),
	onInvoke: new Q.Event()
},

{
	refresh: function (stream) {
		var tool = this;
		tool.stream = stream;
		var publisherId = stream.fields.publisherId;
		var streamName = stream.fields.name;
		var type = stream.getAttribute("type");
		var content = stream.fields.content;
		var $toolElement = $(tool.element);
		var $toolContent;

		// retain with stream
		Q.Streams.retainWith(tool).get(publisherId, streamName);

		if (type === "option" || type === "option.exclusive") {
			$toolContent = $("<label class='Streams_question_answer_container' />")
				.append(
					$("<input />").attr({
						type: (type === "option" ? "checkbox" : "radio")
					}),
					$("<span />").text(content)
				).appendTo($toolElement);
		} else if (type === "textarea") {
			$toolContent = $("<textarea placeholder='" + (content || tool.text.FreeAnswer) + "'></textarea>").appendTo($toolElement);
		}

		$toolElement.html($toolContent);

		Q.handle(tool.state.onRefresh, tool);
	},

	/**
	 * Start composer dialog
	 * @method composer
	 * @param {function} callback Need to call this function to start create stream process
	 */
	composer: function (callback) {
		var tool = this;
		var previewState = tool.preview.state;

		previewState.onCreate.set(function () {
			Q.Dialogs.pop();
		}, tool);

		Q.Dialogs.push({
			title: tool.text.NewAnswer,
			className: "Streams_dialog_answer_composer",
			template: {
				name: "Streams/answer/composer"
			},
			onActivate: function (dialog) {
				var $select = $("select[name=type]", dialog);
				var $input = $("input[name=value]", dialog);

				$select.on("change", function () {
					var type = $select.val();

					if (type === "textarea") {
						$input.attr("placeholder", tool.text.Placeholder);
					} else {
						$input.removeAttr("placeholder");
					}
				}).trigger("change");

				$("button[name=save]", dialog).on(Q.Pointer.fastclick, function () {
					var title = $input.val();
					var content = title;

					if (!title) {
						return Q.alert(tool.text.TitleRequired);
					}

					if (title.length > 255) {
						title = title.substring(0, 255) + "...";
					}

					Q.handle(callback, tool, [{
						title: title,
						content: content,
						attributes: {
							type: $select.val()
						}
					}]);
					$(this).addClass("Q_working");
				});
			}
		});
	}
});

Q.Template.set('Streams/answer/composer',
`<select name="type">
			<option value="option">{{questions.answerOption}}</option>
			<option value="option.exclusive">{{questions.answerOptionExclusive}}</option>
			<option value="textarea">{{questions.answerTextarea}}</option>
		</select>
		<input name="value" />
		<button name="save" type="button" class="Q_button">{{questions.Save}}</button>`,
{text: ['Streams/content']}
);
Q.Template.set("Streams/answer/view",
`<ul>
	{{#each options}}
		<li>{{this}}</li>
	{{/each}}
	</ul>
	<div class="Streams_answer_content">{{content}}</div>`
);
})(Q, Q.$, window);
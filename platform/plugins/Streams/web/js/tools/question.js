(function (Q, $, window, undefined) {
/**
 * @module Streams-tools
 */

/**
 * Renders an question interface
 * @class Streams question
 * @constructor
 * @param {Object} [options] any options for the tool
 * @param {String} [options.publisherId] Category stream publisher id
 * @param {String} [options.streamName] Category stream name
 * @param {Q.Event} [options.onSubmit] event occur when question or answer submited.
 */
Q.Tool.define("Streams/question", function(options) {
	var tool = this;
	var state = tool.state;
	var mode = state.mode;

	var pipeFields = ["style", "text"];

	if (mode === "answerComposer") {
		if (!state.publisherId) {
			throw new Q.Error("Streams/question: missing publisherId");
		}
		if (!state.streamName) {
			throw new Q.Error("Streams/question: missing stream name");
		}

		pipeFields.push("stream");
	}

	var pipe = new Q.pipe(pipeFields, function () {
		Q.handle(tool[mode], tool);
	});

	Q.addStylesheet('{{Streams}}/css/tools/question.css', { slotName: 'Streams' }, pipe.fill("style"));

	Q.Text.get('Streams/content', function (err, text) {
		var msg = Q.firstErrorMessage(err);
		if (msg) {
			return console.warn(msg);
		}

		tool.text = text.questions;

		pipe.fill("text")();
	});

	if (mode === "answerComposer") {
		Q.Streams.get(state.publisherId, state.streamName, function (err) {
			var msg = Q.firstErrorMessage(err);
			if (msg) {
				return console.warn(msg);
			}

			tool.stream = this;
			pipe.fill("stream")();
		});
	}
},

{
	publisherId: null,
	streamName: null,
	mode: "questionComposer",
	onSubmit: new Q.Event()
},

{
	questionComposer: function () {
		var tool = this;
		var state = this.state;

		var _addAnswer = function () {
			var $answers = $(".Streams_question_answers", tool.element);

			if (!$answers.length) {
				throw new Q.error("Streams/question: answers element not found");
			}

			Q.Template.render("Streams/question/snippet",{
				text: tool.text
			}, function (err, html) {
				if (err) {
					return;
				}

				var $answer = $(html).appendTo($answers);
				var $select = $("select[name=type]", $answer);
				var $input = $("input[name=value]", $answer);

				$(".Streams_question_remove", $answer).on(Q.Pointer.fastclick, function () {
					$answer.remove();
				});

				$select.on("change", function () {
					var type = $select.val();

					$answer.attr("data-type", type);

					$input.prop("disabled", type === "textarea");
				}).trigger("change");
			});
		};

		Q.Template.render("Streams/question/composer",{
			text: tool.text
		}, function (err, html) {
			if (err) {
				return;
			}

			tool.element.innerHTML = html;

			var $title = $("input[name=title]", tool.element);
			var $content = $("textarea[name=content]", tool.element);
			var $answers = $(".Streams_question_answers", tool.element);

			// add answer composer
			$("i.Streams_question_add", tool.element).on(Q.Pointer.fastclick, _addAnswer);
			_addAnswer();

			// submit question
			$("button[name=submit]", tool.element).on(Q.Pointer.fastclick, function () {
				var title = $title.val();
				var content = $content.val();

				if (!title) {
					return Q.alert(tool.text.ErrorTitle);
				}

				var answers = [];
				$(".Streams_question_snippet", $answers).each(function () {
					var $this = $(this);
					var $content = $("input[name=value]", $this);
					var content = $content.val();

					if (!$content.prop("disabled") && !content) {
						return;
					}

					answers.push({
						type: $("select[name=type]", $this).val(),
						content: content
					});
				});

				if (Q.isEmpty(answers)) {
					return Q.alert(tool.text.ErrorAnswers);
				}

				Q.handle(state.onSubmit, tool, [title, content, answers]);
			});
		});
	},
	answerComposer: function () {
		var tool = this;
		var state = this.state;
		var stream = this.stream;

		var answers = stream.getAttribute("answers");

		Q.Template.render("Streams/answer/composer", {
			title: stream.fields.title,
			content: stream.fields.content,
			text: tool.text
		}, function (err, html) {
			if (err) {
				return;
			}

			tool.element.innerHTML = html;

			var $answers = $(".Streams_question_answers", tool.element);

			Q.each(answers, function (i) {
				if (this.type === "option") {
					$("<label><input type='checkbox' value='" + i + "'> <span>" + this.content + "</span></label>").appendTo($answers);
				} else if (this.type === "option.exclusive") {
					$("<label><input type='radio' value='" + i + "'> <span>" + this.content + "</span></label>").appendTo($answers);
				} else if (this.type === "textarea") {
					$("<textarea placeholder='" + tool.text.FreeAnswer + "'></textarea>").appendTo($answers);
				}
			});

			// if radio checked, uncheck all checkboxes and radios
			$("input[type=radio]", tool.element).on(Q.Pointer.fastclick, function () {
				$("input[type=radio], input[type=checkbox]", tool.element).prop("checked", false);
				$(this).prop("checked", true);
			});

			// if checkbox checked, uncheck all radios
			$("input[type=checkbox]", tool.element).on(Q.Pointer.fastclick, function () {
				if ($(this).prop("checked")) {
					$("input[type=radio]", tool.element).prop("checked", false);
				}
			});

			// submit question
			$("button[name=submit]", tool.element).on(Q.Pointer.fastclick, function () {
				var answers = {
					options: [],
					textarea: $("textarea", $answers).val() || null
				};

				// collect options
				$("input:checked", $answers).each(function () {
					answers.options.push($("span", this.parentElement).text());
				});

				if (!answers.textarea && Q.isEmpty(answers.options)) {
					return Q.alert(tool.text.ErrorAnswers);
				}

				Q.handle(state.onSubmit, tool, [answers]);
			});
		});
	}
});

Q.Template.set('Streams/question/composer',
'<input type="text" name="title" placeholder="{{text.TitlePlaceholder}}" />' +
	'<textarea type="text" name="content" placeholder="{{text.ContentPlaceholder}}"></textarea>' +
	'<h2 class="Streams_question_head">{{text.Answers}}</h2>' +
	'<div class="Streams_question_answers"></div>' +
	'<div class="Streams_question_add"><i class="Streams_question_add"></i> <span>{{text.AddAnotherAnswer}}</span></div>' +
	'<button name="submit" type="button" class="Q_button">{{text.SaveQuestion}}</button>'
);

Q.Template.set('Streams/question/snippet',
'<div class="Streams_question_snippet">' +
	'	<select name="type">' +
	'		<option value="option">{{text.answerOption}}</option>' +
	'		<option value="option.exclusive">{{text.answerOptionExclusive}}</option>' +
	'		<option value="textarea">{{text.answerTextarea}}</option>' +
	'	</select>' +
	'	<input name="value" />' +
	'	<i class="Streams_question_remove"></i>' +
	'</div>'
);

Q.Template.set('Streams/answer/composer',
	'<h2 class="Streams_question_head">{{title}}</h2>' +
	'<div class="Streams_question_content">{{content}}</div>' +
	'<div class="Streams_question_answers"></div>' +
	'<button name="submit" type="button" class="Q_button">{{text.SaveAnswer}}</button>'
);

})(Q, Q.$, window);
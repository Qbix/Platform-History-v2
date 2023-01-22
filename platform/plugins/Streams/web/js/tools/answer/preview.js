(function (Q, $, window, undefined) {
/**
 * Streams/answer/preview tool.
 * Renders a tool to preview Streams/answer stream
 * @class Streams/answer/preview
 * @constructor
 * @param {Object} [options] options to pass besides the ones to Streams/preview tool
 * @param {integer} [options.titleMaxLength] max length of stream title
 * @param {boolean} [options.participants=false] if tru show Streams/participants tool if enough permissions
 * @param {Q.Event} [options.onInvoke] occur onclick tool element
 */
Q.Tool.define("Streams/answer/preview", ["Streams/preview"], function _Streams_answer_preview (options, preview) {
	var tool = this;
	var state = this.state;
	tool.preview = preview;

	preview.state.editable = ["icon", "title"];

	Q.addStylesheet('{{Streams}}/css/tools/previews.css', { slotName: 'Streams' });

	preview.state.onRefresh.add(tool.refresh.bind(tool));
	preview.state.creatable.preprocess = tool.composer.bind(tool);

	if (preview.state.streamName) {
		$(tool.element).on(Q.Pointer.fastclick, function () {
			Q.handle(state.onInvoke, tool);
		});
	}

	tool.Q.onStateChanged('participants').set(tool.setParticipants.bind(tool), tool);
},

{
	titleMaxLength: 255,
	participants: true,
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
		var participant = stream.participant || {};
		var extra = participant.getExtra && participant.getExtra("content");
		var participating = participant.state === "participating";

		$(tool.element)
			.attr("data-type", type)
			.attr("data-participating", participating);

		Q.Streams.retainWith(tool).get(publisherId, streamName);

		// process message Streams/extra/changed
		stream.onMessage('Streams/extra/changed').set(function (updatedStream, message) {
			tool.updateContent(message.byUserId, message.content);
		}, tool);

		Q.Template.render("Streams/answer/view", {
			type: type,
			content: content,
			checked: participating,
			extra: extra
		}, function (err, html) {
			if (err) {
				return;
			}

			tool.element.innerHTML = html;

			tool.setParticipants();

			var $participants = $(".Streams_answer_participants", tool.element);
			stream.onFieldChanged("participatingCount").set(function (modFields, field) {
				if ($participants.hasClass("Streams_participants_tool")) {
					return;
				}

				$participants.html(modFields[field] || "");
			}, tool);

			Q.handle(tool.state.onRefresh, tool);
		});
	},
	/**
	 * Set participants tool
	 * @method setParticipants
	 */
	setParticipants: function () {
		var tool = this;
		var state = this.state;
		var publisherId = tool.stream.fields.publisherId;
		var streamName = tool.stream.fields.name;
		var $participants = $(".Streams_answer_participants", tool.element);

		$(tool.element).attr("data-participants", state.participants);
		if (!state.participants) {
			return;
		}

		if (tool.stream.testReadLevel("participants")) {
			var participantsTool = Q.Tool.from($participants[0], "Streams/participants");
			if (!participantsTool) {
				$participants.empty();
				$participants.tool("Streams/participants", {
					publisherId: publisherId,
					streamName: streamName,
					invite: false,
					showSummary: true,
					maxShow: 100,
					showControls: true,
					hideIfNoParticipants: true
				}).activate(function () {
					tool.element.forEachTool("Users/avatar", function () {
						var avatarTool = this;
						tool.stream.getParticipant(avatarTool.state.userId, function (err, participant) {
							var msg = Q.firstErrorMessage(err);
							if (msg) {
								return console.warn(msg);
							}

							$(avatarTool.element).attr('data-touchlabel', participant.getExtra('content'));
						});
					});
				});
			}
		} else {
			Q.Tool.remove($participants[0], true, false);
			$participants.html(tool.stream.fields.participatingCount || "");
		}
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
			title: tool.text.questions.NewAnswer,
			className: "Streams_dialog_answer_composer",
			template: {
				name: "Streams/answer/composer"
			},
			onActivate: function (dialog) {
				var $select = $("select[name=type]", dialog);
				var $input = $("input[name=value]", dialog);
				var $form = $('form', dialog);

				$select.on("change", function () {
					var type = $select.val();

					if (type === "text") {
						$input.attr("placeholder", tool.text.questions.Placeholder);
					} else {
						$input.removeAttr("placeholder");
					}
				}).trigger("change");

				$form.on('submit', _save);

				function _save() {
					var title = $input.val();
					var content = title;

					if (!title) {
						return Q.alert(tool.text.questions.TitleRequired);
					}

					if (title.length > 255) {
						title = title.substring(0, 255) + "...";
					}

					Q.handle(callback, tool, [{
						title: title,
						content: content,
						attributes: {
							type: $select.val()
						},
						dontSubscribe: true
					}]);
					$(this).addClass("Q_working");
				}
			}
		});
	},
	/**
	 * Update avatar element data-touchlabel attribute to the answer content
	 * @method updateContent
	 * @param {string} byUserId - user id avatar need to change
	 * @param {string} content - answer content
	 */
	updateContent: function (byUserId, content) {
		var tool = this;
		var participantsTool = Q.Tool.from($(".Streams_answer_participants", tool.element)[0], "Streams/participants");
		if (!participantsTool) {
			return;
		}

		var $avatar = participantsTool.avatarExists(byUserId);
		if ($avatar instanceof jQuery && $avatar.length) {
			$avatar.attr('data-touchlabel', content);
		}
	}
});

Q.Template.set('Streams/answer/composer',
	`<form action="">
		<select name="type">
			<option value="option">{{questions.answerOption}}</option>
			<option value="option.exclusive">{{questions.answerOptionExclusive}}</option>
			<option value="text">{{questions.answerText}}</option>
		</select>
		<input name="value" enterkeyhint="send" />
		<button type="submit" name="save" type="button" class="Q_button">{{questions.Save}}</button>
	</form>`,
	{text: ['Streams/content']}
);
Q.Template.set("Streams/answer/view",
	`{{#ifEquals type "text"}}
		<form action="">
			<input placeholder="{{content}}" type="text" value="{{extra}}" enterkeyhint="send">
			<button type="submit" class="Q_button" name="send" enterkeyhint="send">{{questions.Send}}</button>
		</form>
	{{/ifEquals}}
	{{#ifEquals type "option"}}
		<label class='Streams_question_answer_container'><input type="checkbox" {{#if checked}}checked="checked"{{/if}} value="{{content}}"><span>{{content}}</span></label>
	{{/ifEquals}}
	{{#ifEquals type "option.exclusive"}}
		<label class='Streams_question_answer_container'><input type="radio" {{#if checked}}checked="checked"{{/if}} value="{{content}}"><span>{{content}}</span></label>
	{{/ifEquals}}
	<div class="Streams_answer_participants"></div>`,
	{text: ['Streams/content']}
);
})(Q, Q.$, window);

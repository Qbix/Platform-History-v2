(function (Q, $, window, undefined) {
	/**
	 * @module Streams-tools
	 */

	/**
	 * Requires Streams/chat/preview tool to be activated on the same element.
	 * @class Streams chat preview
	 * @constructor
	 * @param {Object} [options] options to pass besides the ones to Streams/preview tool
	 *   @param {string} [options.mode=document] This option regulates tool layout. Can be 'title' and 'document'.
	 *   @param {Boolean} [options.hideIfNoParticipants] If there are no participants in the chat, hide this preview.
	 *   @param {Q.Event} [options.onRefresh] Event occurs when tool element has rendered with content
	 */
	Q.Tool.define("Streams/chat/preview", "Streams/preview", function _Streams_chat_preview(options, preview) {
		var tool = this;
		tool.preview = preview;

		$(tool.element).attr('data-mode', this.state.mode);

		Q.addStylesheet('{{Streams}}/css/tools/chat.css');

		preview.state.onRefresh.add(this.refresh.bind(this));
	},

	{
		mode: 'document',
		hideIfNoParticipants: false,
		onInvoke: new Q.Event(),
		onRefresh: new Q.Event()
	},

	{
		refresh: function (stream, callback) {
			var tool = this;
			var state = tool.state;
			var $te = $(tool.element);

			if (state.hideIfNoParticipants
				&& stream.fields.participatingCount === 0) {
				$te.addClass('Streams_chat_preview_noParticipants');
			} else {
				$te.removeClass('Streams_chat_preview_noParticipants');
			}

			var info = stream.getAttribute("interestTitle");

			// set additional attribute to flag whether subtitle exist
			$te.attr('data-subtitle', !!info);

			var fields = {
				src: stream.iconUrl('80'),
				title: stream.fields.title,
				info: info
			};
			Q.Template.render('Streams/chat/preview', fields, function (err, html) {
				if (err) return;

				Q.replace(tool.element, html);;

				setTimeout(function () {
					Q.handle(state.onRefresh, tool);
				}, 0);

				if (state.mode === 'title') {
					return;
				}

				$te.on(Q.Pointer.click, tool, function () {
					Q.handle(tool.state.onInvoke, tool, [tool.preview]);
				});

				// setup unseen element
				Q.Streams.Message.Total.setUpElement(
					$(".streams_chat_unseen", $te)[0],
					stream.fields.publisherId,
					stream.fields.name,
					'Streams/chat/message',
					tool,
					{ unseenClass: 'Streams_preview_nonzero' }
				);

				// get participants and create Users/pale
				Q.Streams.Participant.get.force(
					stream.fields.publisherId,
					stream.fields.name,
					{
						limit: 10,
						offset: 0,
						state: 'participating'
					},
					function (err, participants) {
						var msg = Q.firstErrorMessage(err);
						if (msg) {
							console.warn("Streams/chat/preview tool: " + msg);
							return;
						}

						var userIds = [];
						Q.each(participants, function (userId) {
							if (userId === Q.Users.loggedInUserId()) {
								return;
							}

							userIds.push(userId);
						});

						var $participantsElement = $(".streams_chat_participants", tool.element);
						if (userIds.length) {
							$participantsElement.tool("Users/pile", {
								avatar: {
									contents: false
								},
								userIds: userIds
							}).activate(function () {
								$te.attr('data-participants', 1);
							});
						} else {
							$participantsElement.remove();
						}
					}
				);

				Q.activate(tool);
			});
		}

	});

	Q.Template.set('Streams/chat/preview',
		'<div class="Streams_preview_container Streams_preview_view Q_clearfix">' +
		'	<img alt="icon" class="Streams_preview_icon" src="{{& src}}">' +
		'	<div class="Streams_preview_contents">' +
		'		<h3 class="Streams_preview_title Streams_preview_view">{{title}}</h3>' +
		'		<div class="Streams_chat_preview_info Streams_aspect_interests">{{info}}</div>' +
		'	</div>' +
		'	<div class="streams_chat_participants"></div>' +
		'	<div class="streams_chat_unseen"></div>' +
		'</div>'
	);
})(Q, Q.$, window);
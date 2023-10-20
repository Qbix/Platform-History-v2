(function (Q, $, window, undefined) {

/**
 * Streams/topic tool.
 * Renders a topic tool
 * @class Streams/topic
 * @constructor
 * @param {Object} [options] options to pass
 */
Q.Tool.define("Streams/topic", function(options) {
	var tool = this;
	var $toolElement = $(tool.element);
	var state = this.state;

	Q.Streams.get(state.publisherId, state.streamName, function (err) {
		var msg = Q.firstErrorMessage(err);
		if (msg) {
			return;
		}

		var stream = this;

		$toolElement.on(Q.Pointer.fastclick, ".Streams_topic_conversation", function () {
			Q.invoke({
				title: tool.text.topic.Conversation,
				content: $("<div>").tool("Streams/chat", {
					publisherId: stream.fields.publisherId,
					streamName: stream.fields.name
				}),
				trigger: tool.element,
				onActivate: function (options, index, div, data) {

				}
			});
		});

		Q.handle(tool.refresh, tool, [stream]);
	});

	Q.each(state.creatable, function (index, streamType) {
		var toolName = streamType + "/preview";
		tool.element.forEachTool(toolName, function () {
			this.state.onInvoke.set(function () {
				var previewTool = this;
				var streamsPreviewTool = Q.Tool.from(this.element, "Streams/preview");
				if (!previewTool) {
					return console.warn(toolName + ": preview tool not found");
				}

				// if composer
				if (!streamsPreviewTool.state.streamName) {
					return;
				}

				Q.Streams.get(streamsPreviewTool.state.publisherId, streamsPreviewTool.state.streamName, function (err) {
					if (err) {
						return;
					}

					var stream = this;
					var toolName, toolOptions;
					switch(streamType) {
						case "Streams/video":
							toolName = "Q/video";
							toolOptions = {
								url: stream.videoUrl() || stream.fileUrl(),
								clipStart: stream.getAttribute('clipStart'),
								clipEnd: stream.getAttribute('clipEnd')
							};
							break;
						case "Streams/audio":
							toolName = "Q/audio";
							toolOptions = {
								action: "implement",
								url: stream.fileUrl(),
								clipStart: stream.getAttribute('clipStart'),
								clipEnd: stream.getAttribute('clipEnd')
							};
							break;
						case "Streams/pdf":
							toolName = "Q/pdf";
							toolOptions = {
								url: stream.fileUrl(),
								clipStart: stream.getAttribute('clipStart'),
								clipEnd: stream.getAttribute('clipEnd')
							};
							break;
						case "Streams/topic":
							toolName = "Streams/topic";
							toolOptions = {};
							break;
						default:
							throw new Q.Exception(streamType + " not recognised");
					}

					Q.invoke({
						title: stream.fields.title,
						content: "",
						trigger: tool.element,
						onActivate: function (options, index, div, data) {
							$("<div>").appendTo($(".Q_column_slot", div)).tool(toolName, toolOptions).activate();
						}
					});
				});
			}, tool);
		});
	});
},

{
	publisherId: null,
	streamName: null,
	imagepicker: {
		showSize: "200",
		fullSize: "400"
	},
	creatable: ["Streams/video", "Streams/audio", "Streams/pdf"] //TODO: make topics browser in topic preview tool and use it instead composer to select already created topic 'Streams/topic'

},

{
	refresh: function (stream) {
		var tool = this;
		var state = tool.state;

		stream.retain(tool);

		stream.onFieldChanged("icon").set(function (modFields, field) {
			stream.refresh(function () {
				stream = this;
				$(".Streams_topic_image", tool.element).css("background-image", "url("+stream.iconUrl(state.imagepicker.showSize)+")");
			}, {
				messages: true,
				evenIfNotRetained: true
			});
		}, tool);
		stream.onFieldChanged("content").set(function (modFields, field) {
			stream.refresh(function () {
				stream = this;
				Q.replace($(".Streams_topic_text", tool.element)[0], stream.fields.content);
			}, {
				messages: true,
				evenIfNotRetained: true
			});
		}, tool);

		Q.Template.render('Streams/topic/tool', {
				src: stream.iconUrl(state.imagepicker.showSize),
				title: stream.fields.title,
				content: stream.fields.content
		}, function (err, html) {
			if (err) {
				return;
			}

			Q.replace(tool.element, html);

			// relations
			$(".Streams_topic_relations", tool.element).tool("Streams/related", {
				publisherId: stream.fields.publisherId,
				streamName: stream.fields.name,
				relationType: "Streams/subtopic",
				composerPosition: "last",
				relatedOptions: {
					ascending: true
				},
				sortable: true,
				creatable: (function () {
					var creatable = {};
					Q.each(state.creatable, function (i, streamType) {
						creatable[streamType] = {title: Q.getObject([streamType, "newItem"], tool.text.types) || "New " + streamType};
					});
					return creatable;
				})()
			}).activate();
		});
	}
});

Q.Template.set('Streams/topic/tool',
`<div class="Streams_topic_bg">
		<div class="Streams_topic_front">
			<div class="Streams_topic_image" style="background-image: url({{src}})"></div>
			<div class="Streams_topic_text">{{content}}</div>
		</div>
	</div>
	<div class="Streams_topic_conversation"><h2>{{topic.Conversation}}</h2></div>
	<div class="Streams_topic_relations"></div>`,
	{text: ['Streams/content']}
);

})(Q, Q.$, window);
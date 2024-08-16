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
				onActivate: function () {

				}
			});
		});

		Q.handle(tool.refresh, tool, [stream]);
	});

	Q.each(state.creatable, function (index, streamType) {
		var toolName = streamType + "/preview";
		tool.element.forEachTool(toolName, function () {
			var previewTool = this;
			var streamsPreviewTool = Q.Tool.from(previewTool.element, "Streams/preview");
			streamsPreviewTool.state.beforeClose = function (_delete) {
				Q.confirm(tool.text.questions.AreYouSure, function (result) {
					if (result){
						_delete();
					}
				});
			};

			streamsPreviewTool.state.actions.actions = streamsPreviewTool.state.actions.actions || {};

			previewTool.state.onInvoke.set(function () {
				// if composer
				if (!streamsPreviewTool.state.streamName) {
					return;
				}

				Q.Streams.get(streamsPreviewTool.state.publisherId, streamsPreviewTool.state.streamName, function (err) {
					if (err) {
						return;
					}

					var toolName, toolOptions;
					var stream = this;

					if (!stream.testReadLevel('content') && !Q.isEmpty(stream.fields["Assets/canPayForStreams"])) {
						return Q.alert("Error: Payment is needed to access this.");
					}

					switch(streamType) {
						case "Streams/video":
							toolName = "Q/video";
							toolOptions = {
								url: stream.videoUrl() || stream.fileUrl(),
								clipStart: stream.getAttribute('clipStart'),
								clipEnd: stream.getAttribute('clipEnd'),
								metrics: {
									publisherId: stream.fields.publisherId,
									streamName: stream.fields.name
								}
							};
							break;
						case "Streams/audio":
							toolName = "Q/audio";
							toolOptions = {
								action: "implement",
								url: stream.fileUrl(),
								clipStart: stream.getAttribute('clipStart'),
								clipEnd: stream.getAttribute('clipEnd'),
								metrics: {
									publisherId: stream.fields.publisherId,
									streamName: stream.fields.name
								}
							};
							break;
						case "Streams/pdf":
							toolName = "Q/pdf";
							toolOptions = {
								url: stream.fileUrl(),
								clipStart: stream.getAttribute('clipStart'),
								clipEnd: stream.getAttribute('clipEnd'),
								metrics: {
									publisherId: stream.fields.publisherId,
									streamName: stream.fields.name
								}
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
						className: "Streams_topic_" + Q.normalize(streamType),
						trigger: tool.element,
						onActivate: function (div) {
							$("<div>").appendTo($(".Q_content_container", div)).tool(toolName, toolOptions).activate();
						}
					});
				});
			}, tool);

			// if composer
			if (!streamsPreviewTool.state.streamName) {
				return;
			}

			Q.Streams.get(streamsPreviewTool.state.publisherId, streamsPreviewTool.state.streamName, function (err) {
				if (err) {
					return;
				}

				// add metrics action to preview tools to open metrics column
				if (["Streams/video", "Streams/audio", "Streams/pdf"].includes(streamType)) {
					if (streamsPreviewTool.state.actions.actions.metrics) {
						return;
					}

					streamsPreviewTool.state.actions.actions.metrics = function () {
						Q.invoke({
							title: tool.text.topic.Metrics,
							content: "",
							className: "Streams_topic_metrics",
							trigger: tool.element,
							onActivate: function (div) {
								$("<div>").appendTo($(".Q_content_container", div)).tool("Streams/metrics", {
									publisherId: streamsPreviewTool.state.publisherId,
									streamName: streamsPreviewTool.state.streamName
								}).activate();
							}
						});
					};
					streamsPreviewTool.actions();
				}
			});
		});
	});
},

{
	publisherId: null,
	streamName: null,
	imagepicker: {
		showSize: "200x",
		fullSize: "1000x"
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

})(Q, Q.jQuery, window);
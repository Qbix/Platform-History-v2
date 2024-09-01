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

		Q.handle(tool.refresh, tool, [this]);
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
					var canReadContent = stream.testReadLevel('content');
					var teaser;

					switch(streamType) {
						case "Streams/video":
							toolName = "Q/video";
							break;
						case "Streams/audio":
							toolName = "Q/audio";
							break;
						case "Streams/pdf":
							toolName = "Q/pdf";
							break;
						case "Streams/topic":
							toolName = "Streams/topic";
							break;
						default:
							throw new Q.Exception(streamType + " not recognised");
					}

					if (canReadContent) {
						toolOptions = {
							url: stream.videoUrl() || stream.fileUrl(),
							clipStart: stream.getAttribute('clipStart'),
							clipEnd: stream.getAttribute('clipEnd'),
							metrics: {
								publisherId: stream.fields.publisherId,
								streamName: stream.fields.name
							}
						};
					} else {
						teaser = stream.getAttribute("teaser:Streams/" + streamType.split('/').pop());
						if (teaser) {
							toolOptions = {
								url: teaser
							};
						} else {
							return tool.subscribe(stream);
						}
					}

					if (streamType === "Streams/topic") {
						toolOptions = {
							publisherId: stream.fields.publisherId,
							streamName: stream.fields.name
						};
					}

					Q.invoke({
						title: stream.fields.title,
						content: "",
						className: "Streams_topic_" + Q.normalize(streamType),
						trigger: tool.element,
						onActivate: function (div) {
							$("<div>").appendTo($(".Q_content_container", div)).tool(toolName, toolOptions).activate(function () {
								if (teaser) {
									var throttle = Q.throttle(tool.subscribe.bind(tool, stream), 300);
									this.state.onEnded && this.state.onEnded.set(throttle, tool);
									this.state.onPause && this.state.onPause.set(throttle, tool);
								}
							});
						}
					});
				});
			}, tool);

			// if composer
			if (!streamsPreviewTool.state.streamName) {
				return;
			}

			Q.Streams.get(streamsPreviewTool.state.publisherId, streamsPreviewTool.state.streamName, function (err, stream) {
				if (err) {
					return;
				}

				// add metrics action to preview tools to open metrics column
				if (["Streams/video", "Streams/audio", "Streams/pdf"].includes(streamType)) {
					if (!streamsPreviewTool.state.actions.actions.metrics && stream.testReadLevel(40)) {
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
					if (!streamsPreviewTool.state.actions.actions.subscribe && !stream.testReadLevel(40)) {
						streamsPreviewTool.state.actions.actions.subscribe = tool.subscribe.bind(tool, stream);
						streamsPreviewTool.actions();
					}
				}
			});
		});
	});

	var _refreshOnLogin = function () {
		var $column = $toolElement.closest('.Q_columns_column');
		if ($column.length) {
			var min = parseInt($column.data('index')) + 1;
			var columns = Q.Tool.from($toolElement.closest(".Q_columns_tool"), "Q/columns");
			columns.close({min: min}, null, {animation: {duration: 0}});
		}

		Q.Streams.get.force(state.publisherId, state.streamName, function (err) {
			if (err) {
				return;
			}

			tool.refresh(this);
		});
	};
	Q.Users.onLogin.set(_refreshOnLogin, this);
	Q.Users.onLogout.set(_refreshOnLogin, this);
	Q.Assets.Subscriptions.onSubscribe.set(_refreshOnLogin, this);
},

{
	publisherId: null,
	streamName: null,
	imagepicker: {
		showSize: "200x",
		fullSize: "1000x"
	},
	creatable: ["Streams/video", "Streams/audio", "Streams/pdf", "Streams/topic"] //TODO: make topics browser in topic preview tool and use it instead composer to select already created topic 'Streams/topic'

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
				Q.replace($(".Streams_topic_description", tool.element)[0], stream.fields.content);
			}, {
				messages: true,
				evenIfNotRetained: true
			});
		}, tool);

		var fullAccess = stream.testReadLevel(40);

		$(tool.element).attr("data-fullAccess", fullAccess);

		var content = fullAccess ? stream.fields.content : stream.getAttribute("teaser:Streams/description") || "";

		Q.Template.render('Streams/topic/tool', {
			src: stream.iconUrl(state.imagepicker.showSize),
			title: stream.fields.title,
			content
		}, function (err, html) {
			if (err) {
				return;
			}

			Q.replace(tool.element, html);

			$(".Streams_topic_conversation", tool.element).on(Q.Pointer.fastclick, function () {
				Q.invoke({
					title: tool.text.topic.Conversation,
					content: $("<div>").tool("Streams/chat", {
						publisherId: state.publisherId,
						streamName: state.streamName
					}),
					trigger: tool.element,
					onActivate: function () {

					}
				});
			});

			var teaserVideoUrl = stream.getAttribute("teaser:Streams/video");
			if (teaserVideoUrl) {
				$("<div>").tool("Q/video", {
					url: teaserVideoUrl,
					autoplay: true,
					controls: false,
					loop: true
				}).appendTo($(".Streams_topic_image", tool.element).attr("data-video", true)).activate();
			}

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
				specificOptions: {
					teaser: true
				},
				creatable: (function () {
					var creatable = {};
					Q.each(state.creatable, function (i, streamType) {
						creatable[streamType] = {title: Q.getObject([streamType, "newItem"], tool.text.types) || "New " + streamType};
					});
					return creatable;
				})()
			}).activate();
		});
	},
	subscribe: function (stream) {
		Q.Assets.Subscriptions.showPlansRelated(stream);
	}
});

Q.Template.set('Streams/topic/tool',
`<div class="Streams_topic_image" style="background-image: url({{src}})"></div>
	<div class="Streams_topic_description">{{{content}}}</div>
	<div class="Streams_topic_conversation"><h2>{{topic.Conversation}}</h2></div>
	<div class="Streams_topic_relations"></div>`,
	{text: ['Streams/content']}
);

})(Q, Q.jQuery, window);
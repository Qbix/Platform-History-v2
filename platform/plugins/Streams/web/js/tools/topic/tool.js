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
							return tool.payment(stream);
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
									var throttle = Q.throttle(tool.payment.bind(tool, stream), 300);
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
				Q.replace($(".Streams_topic_text", tool.element)[0], stream.fields.content);
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
					autoplay: true
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
	payment: function (stream) {
		var tool = this;
		var $toolElement = $(this.element);
		var state = this.state;
		var canPayForStreams = stream.fields["Assets/canPayForStreams"];

		if (Q.isEmpty(canPayForStreams)) {
			return Q.alert("Error: Not enough permissions to view this content.");
		}

		Q.Dialogs.push({
			title: "Please subscribe",
			className: "Streams_topic_subscribe",
			onActivate: function (dialog) {
				var $content = $(".Q_dialog_content", dialog);

				Q.each(canPayForStreams, function (i, streamData) {
					Q.Assets.Subscriptions.getPlansRelated(streamData, function (err, streams) {
						if (err) {
							return;
						}

						Q.each(streams, function (i, stream) {
							$("<div>").tool("Streams/preview", {
								publisherId: stream.fields.publisherId,
								streamName: stream.fields.name
							}).tool("Assets/plan/preview").appendTo($content).activate(function () {
								var assetsPlanPreview = this;
								this.state.onInvoke.set(function () {
									Q.Dialogs.push({
										title: "Please subscribe",
										className: "Streams_topic_subscribe_plan",
										content: $("<div>").tool("Assets/plan", {
											publisherId: stream.fields.publisherId,
											streamName: stream.fields.name
										}),
										onActivate: function (dialog) {
											var assetsPlan = Q.Tool.from($(".Assets_plan_tool", dialog)[0], "Assets/plan");
											assetsPlan.state.onSubscribe.set(function () {
												Q.Dialogs.pop();
												Q.Dialogs.pop();

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
											}, assetsPlanPreview);
										}
									});
								}, assetsPlanPreview);
							});
						});
					});
				});
			}
		});
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
(function (Q, $, window, undefined) {

var Streams = Q.Streams;
/**
 * @module Streams-tools
 */

/**
 * Compose or play Streams/experience related stream.
 * @class Streams experience
 * @constructor
 * @param {Object} [options] any options for the tool
 * @param {Object} [options.category] The main category where to experience categories related
 * @param {String} [options.category.publisherId=Q.Users.communityId]
 * @param {String} [options.category.streamName="Streams/experience/main"]
 * @param {String} [options.category.relationType="Streams/topic"]
 * @param {String} [options.publisherId] User id on whose behalf related streams will be created. Logged in user by default.
 * @param {String} [options.streamName] Name of category to relate streams to.
 * @param {Boolean} [options.moveNext=true] define how people move to next step:
 * 		If true - need to finish current before going next,
 * 		if numeric - force to go next after this number seconds.
 * @param {Boolean} [options.automatic=true] means people advance to the next one at a given time
 */
Q.Tool.define("Streams/experience", function(options) {
	var tool = this;
	var state = tool.state;
	var category = state.category;
	var composerRelationType = category.relationType + "/composer";

	if (!state.publisherId) {
		throw new Q.Error("Streams/experience: publisherId required");
	}

	var pipe = new Q.pipe(["style", "text", "stream"], function () {
		if (state.streamName) {
			tool.play();
		} else {
			tool.composer();
		}
	});

	if (state.streamName) {
		Streams.get(state.publisherId, state.streamName, function (err) {
			if (err) {
				return;
			}

			tool.stream = this;
			pipe.fill("stream")();
		});
	} else {
		// get current category
		Streams.related(category.publisherId, category.streamName, composerRelationType, true, function (err) {
			if (err) {
				return;
			}

			var relatedStreams = this.relatedStreams;

			// if no composer stream, create one
			if (Q.isEmpty(relatedStreams)) {
				Streams.create({
					publisherId: state.publisherId,
					type: 'Streams/topic',
					title: 'Untitled experience'
				}, function (err) {
					if (err) {
						return;
					}

					tool.stream = this;
					pipe.fill("stream")();
				}, {
					publisherId: category.publisherId,
					streamName: category.streamName,
					type: composerRelationType,
					weight: Math.round(Date.now() / 1000)
				});
			} else {
				tool.stream = relatedStreams[Object.keys(relatedStreams)[0]];
				pipe.fill("stream")();
			}
		});
	}

	Q.Text.get("Streams/content", function (err, content) {
		if (err) {
			return;
		}

		tool.text = content;
		pipe.fill("text")();
	});
	Q.addStylesheet('{{Streams}}/css/tools/experience.css', { slotName: 'Streams' }, pipe.fill("style"));

},

{
	publisherId: Q.Users.loggedInUserId(),
	streamName: null,
	category: {
		publisherId: Q.Users.communityId,
		streamName: "Streams/experience/main",
		relationType: "Streams/topic"
	},
	moveNext: true,
	streamTypes: {
		"Streams/video": {
			icon: "{{Streams}}/img/icons/Streams/video/40.png"
		},
		"Streams/audio": {
			icon: "{{Streams}}/img/icons/Streams/audio/40.png"
		},
		"Streams/image": {
			icon: "{{Streams}}/img/icons/Streams/image/40.png"
		},
		"Streams/question": {
			icon: "{{Streams}}/img/icons/Streams/question/40.png"
		},
		"Streams/pdf": {
			icon: "{{Streams}}/img/icons/files/pdf/40.png"
		},
		"Streams/webrtc": {
			icon: "{{Streams}}/img/icons/Streams/webrtc/40.png"
		},
		"Websites/webpage": {
			icon: "{{Websites}}/img/icons/Websites/webpage/40.png"
		}
	}
},

{
	composer: function () {
		var tool = this;
		var state = this.state;
		var $toolElement = $(this.element);
		var relationType = state.category.relationType;

		Q.invoke({
			title: tool.text.NewExperience,
			className: "Streams_experience_invoke",
			content: Q.Tool.setUpElement('div', 'Streams/related', {
				publisherId: tool.stream.fields.publisherId,
				streamName: tool.stream.fields.name,
				relationType: relationType,
				editable: false,
				closeable: true,
				realtime: true,
				sortable: false
			}),
			trigger: tool.element,
			callback: function (content) {
				var relatedTool = Q.Tool.from($(".Streams_related_tool", content), "Streams/related");

				$("<div class='Streams_experience_composer'>+</div>").appendTo(relatedTool.element).plugin('Q/contextual', {
					className: "Streams_experience_addons",
					onConstruct: function (contextual) {
						tool.contextual = contextual;

						Q.each(state.streamTypes, function (type, info) {
							tool.addContextual({
								title: type,
								icon: info.icon,
								className: "Streams_experience_contextual",
								handler: function () {
									$("<div>").hide().appendTo(content).tool("Streams/preview", {
										publisherId: state.publisherId,
										closeable: false,
										editable: false,
										related: {
											publisherId: relatedTool.state.publisherId,
											streamName: relatedTool.state.streamName,
											type: relationType
										},
										creatable: {
											//title: title,
											clickable: false,
											addIconSize: 0,
											streamType: type,
											options: {
												skipComposer: true
											}
										}
									}).tool(type + "/preview").activate();
								}
							});
						});
					}
				});
			}
		});
	},
	/**
	 * Add element to addons contextual menu
	 * @method addContextual
	 * @param {object} params
	 * @param {string} params.title Element text
	 * @param {string} [params.icon] Element icon url
	 * @param {string} [params.className] Element class
	 * @param {object} [params.attributes] Element attributes
	 * @param {function} [params.handler] click event handler
	 * @return {jQuery} Result element
	 */
	addContextual: function (params) {
		var tool = this;

		var $element = $("<li class='Streams_experience_addon'></li>");

		$("<div class='Streams_experience_addon_icon'><img src='" + Q.url(params.icon) + "' /></div>").appendTo($element);

		$("<span class='Streams_experience_addon_title'>" + params.title + "</span>").appendTo($element);

		if (params.className) {
			$element.addClass(params.className);
		}

		if (Q.typeOf(params.attributes) === "object") {
			$element.attr(params.attributes);
		}

		if (Q.typeOf(params.handler) === "function") {
			$element.data("handler", params.handler);
		}

		$("ul.Q_listing", tool.element).append($element);

		return $element.appendTo(tool.contextual);
	}
});

})(Q, Q.$, window);
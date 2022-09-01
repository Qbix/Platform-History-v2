(function (Q, $, window, undefined) {

var Streams = Q.Streams;

/**
 * @module Streams-tools
 */

/**
 * Compose or play Streams/topic stream.
 * @class Streams topic
 * @constructor
 * @param {Object} [options] any options for the tool
 * @param {String} [options.publisherId] User id on whose behalf related streams will be created. Logged in user by default.
 * @param {object} [options.streamTypes]
 */
Q.Tool.define("Streams/topic/preview", "Streams/preview", function (options, preview) {
	var tool = this;
	tool.preview = preview;
	var previewState = preview.state;
	var state = tool.state;

	if (previewState.related) {
		state.category = previewState.related;
	}
	state.category.composerRelationType = state.category.type + "/composer";

	if (previewState.creatable) {
		// rewrite Streams/preview composer
		previewState.creatable.preprocess = function (_proceed) {
			tool.composer(_proceed);
			return false;
		};
	}

	preview.state.onRefresh.add(this.refresh.bind(this));

	var pipe = new Q.pipe(["style", "text"], function () {

	});

	var textsToLoad = [];
	Q.each(state.streamTypes, function (type) {
		var textPath = type.split('/')[0] + "/content";
		if (textsToLoad.indexOf(textPath) >= 0) {
			return;
		}

		textsToLoad.push(textPath);
	});
	Q.Text.get(textsToLoad, function (err, content) {
		if (err) {
			return;
		}

		// update streamTypes with titles
		Q.each(content.types, function (type) {
			if (!state.streamTypes[type]) {
				return;
			}

			state.streamTypes[type]["title"] = this.displayType;
		})

		tool.text = content;
		pipe.fill("text")();
	});
	Q.addStylesheet('{{Streams}}/css/tools/experience.css', { slotName: 'Streams' }, pipe.fill("style"));

	// only for exist streams set onFieldChanged event - which refresh tool
	if (previewState.streamName) {
		// set edit action
		previewState.actions.actions = previewState.actions.actions || {};

		Streams.retainWith(true).get(previewState.publisherId, previewState.streamName, function (err) {
			if (err) {
				return;
			}

			if (previewState.editable && this.testWriteLevel('edit')) {
				tool.stream = this;
				previewState.actions.actions.edit = tool.editor.bind(tool);
				//preview.actions();
			}
		});
	}
},

{
	category: {
		publisherId: Q.Users.currentCommunityId,
		streamName: "Streams/experience/main",
		type: "Streams/topic"
	},
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
	refresh: function () {
		$(this.element).tool("Streams/default/preview").activate();
	},
	composer: function () {
		var tool = this;
		var state = this.state;
		var category = state.category;
		var publisherId = Q.Users.loggedInUserId();

		if (!publisherId) {
			return Q.Users.login();
		}

		Q.prompt(null, function (title) {
			if (!title) {
				return;
			}

			Streams.create({
				publisherId: publisherId,
				type: "Streams/topic",
				title: title
			}, function (err) {
				if (err) {
					return;
				}

				tool.stream = this;
				tool.editor();
			}, {
				publisherId: category.publisherId,
				streamName: category.streamName,
				type: category.type,
				weight: Math.round(Date.now() / 1000)
			});
		}, {
			title: tool.text.experience.NewExperience,
			placeholder: tool.text.experience.DefineTitlem,
			maxlength: 255,
			className: "Streams_experience_title"
		});
	},
	editor: function () {
		var tool = this;
		var state = this.state;
		var category = state.category;
		var stream = this.stream;

		// get topics category first
		if (!tool.stream) {
			return tool.getComposerStream(function () {
				tool.composer(_proceed);
			});
		}

		var relationType = category.type;

		Q.invoke({
			title: stream.fields.title,
			className: "Streams_experience_invoke",
			content: Q.Tool.setUpElement('div', 'Streams/related', {
				publisherId: tool.stream.fields.publisherId,
				streamName: tool.stream.fields.name,
				relationType: relationType,
				editable: false,
				closeable: true,
				realtime: true,
				sortable: false,
				creatable: state.streamTypes
			}),
			trigger: tool.element,
			onActivate: function (content) {
				var relatedTool = Q.Tool.from($(".Streams_related_tool", content), "Streams/related");

				/*$("<div class='Streams_experience_composer'>+</div>").appendTo(relatedTool.element).plugin('Q/contextual', {
					className: "Streams_experience_addons",
					onConstruct: function (contextual) {
						tool.contextual = contextual;

						Q.each(state.streamTypes, function (type, info) {
							tool.addContextual({
								title: Q.getObject(["types", type, "displayType"], tool.text) || type,
								icon: info.icon,
								className: "Streams_experience_contextual",
								handler: function () {
									$("<div>").hide().appendTo(content).tool("Streams/preview", {
										publisherId: publisherId,
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
				});*/
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
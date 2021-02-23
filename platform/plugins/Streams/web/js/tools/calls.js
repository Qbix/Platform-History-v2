(function (Q, $, window, undefined) {

var Streams = Q.Streams;
var Users = Q.Users;

/**
 * @module Streams-tools
 */

/**
 * Renders an interface to handle Streams/calls
 * @class Streams calls
 * @constructor
 * @param {Object} [options] any options for the tool
 * @param {Q.Event} [options.maxCalls=0] Max calls can be related to this category
 * @param {Q.Event} [options.publisherId=Users.currentCommunityId] Publisher of Streams/calls/main stream
 * @param {Q.Event} [options.streamName=Streams/calls/main] Category stream name
 */
Q.Tool.define("Streams/calls", function(options) {
	var tool = this;
	var state = this.state;

	var pipe = new Q.pipe(["style", "text", "stream"], function () {
		if (tool.stream.testWriteLevel("edit")) {
			tool.settings();
		} else {
			tool.call();
		}
	});

	Streams.get.force(state.publisherId, state.streamName, function (err) {
		var msg = Q.firstErrorMessage(err);
		if (msg) {
			return Q.alert(msg);
		}

		// join every user to allow get messages
		this.join();

		tool.stream = this;
		pipe.fill("stream")();
	}, {
		withRelatedToTotals: [state.relationType]
	});

	Q.Text.get("Streams/content", function (err, content) {
		if (err) {
			return;
		}

		tool.text = content;
		pipe.fill("text")();
	});
	Q.addStylesheet('{{Streams}}/css/tools/calls.css', { slotName: 'Streams' }, pipe.fill("style"));
},

{
	maxCalls: 0,
	publisherId: Users.currentCommunityId,
	streamName: "Streams/calls/main",
	relationType: "Streams/call"
},

{
	/**
	 * @method refresh
	 */
	refresh: function () {

	},
	/**
	 * Implement settings UI for admins
	 * @method settings
	 */
	settings: function () {
		var tool = this;
		var state = tool.state;
		var $toolElement = $(tool.element);

		$toolElement.addClass("Streams_calls_settings").on(Q.Pointer.fastclick, function () {
			Q.invoke({
				title: tool.text.calls.SettingsTitle,
				columnClass: "Streams_calls_settings",
				className: "Streams_calls_settings",
				template: {
					name: "Streams/calls/settings",
					fields: {
						text: tool.text.calls,
						maxCalls: tool.stream.getAttribute("maxRelations")
					}
				},
				trigger: $toolElement[0],
				callback: function () {
					// if opened in columns - third argument is a column element,
					// if opened dialog - first argument is dialog element
					var parentElement = arguments[2] instanceof HTMLElement ? arguments[2] : arguments[0];
					$(".Streams_calls_related", parentElement).tool("Streams/related", {
						publisherId: state.publisherId,
						streamName: state.streamName,
						relationType: state.relationType,
						editable: false,
						closeable: true,
						sortable: false,
						realtime: true
					}).activate();

					$("button[name=update]", parentElement).on(Q.Pointer.fastclick, function () {
						var maxCalls = parseInt($("input[name=maxCalls]", parentElement).val());
						var oldMaxCalls = parseInt(tool.stream.getAttribute("maxRelations"));

						if (maxCalls !== oldMaxCalls) {
							tool.stream.setAttribute("maxRelations", maxCalls).save();
						}

					});
				}
			});
		});
	},
	/**
	 * Implement call UI for regular users
	 * @method call
	 */
	call: function () {
		var tool = this;
		var state = tool.state;
		var $toolElement = $(tool.element);

		$toolElement.addClass("Streams_calls_call").on(Q.Pointer.fastclick, function () {
			Streams.WebRTC.start({
				publisherId: state.publisherId,
				streamName: state.streamName,
				relationType: state.relationType,
				resumeClosed: false,
				useExisting: false,
				tool: tool
			});
		});
	}
});

Q.Template.set("Streams/calls/settings",
	'<div class="Streams_calls_related"></div>' +
	'<label>{{text.MaxCalls}}</label><input name="maxCalls" type="number" value="{{maxCalls}}">' +
	'<button class="Q_button" name="update">{{text.Update}}</button>'
);

})(Q, Q.$, window);
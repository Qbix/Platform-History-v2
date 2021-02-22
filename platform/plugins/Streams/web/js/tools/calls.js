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

	Streams.get(state.publisherId, state.streamName, function (err) {
		var msg = Q.firstErrorMessage(err);
		if (msg) {
			return Q.alert(msg);
		}

		// join every user to allow get messages
		this.join();

		tool.stream = this;
		pipe.fill("stream")();
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
	streamName: "Streams/calls/main"
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
				template: {
					name: "Streams/calls/settings",
					fields: {
						text: tool.text.calls,
						maxCalls: state.maxCalls
					}
				},
				trigger: $toolElement[0],
				callback: function (options, index, columnElement, data) {
					$(".Streams_calls_related", columnElement).tool("Streams/related", {
						publisherId: state.publisherId,
						streamName: state.streamName,
						relationType: "Streams/call",
						editable: false,
						closeable: true,
						sortable: false,
						realtime: true
					}).activate();
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
				resumeClosed: false,
				useExisting: false,
				tool: tool
			});
		});
	}
});

Q.Template.set("Streams/calls/settings",
	'<div class="Streams_calls_related"></div>' +
	'<label>{{text.MaxCalls}}</label><input name="maxCalls" value="{{maxCalls}}">' +
	'<button class="Q_button">{{text.Update}}</button>'
);

})(Q, Q.$, window);
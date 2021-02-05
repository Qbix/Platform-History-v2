(function (Q, $, window, undefined) {

var Streams = Q.Streams;
/**
 * @module Streams-tools
 */

/**
 * Play Streams/topic stream.
 * @class Streams experience
 * @constructor
 * @param {Object} [options] any options for the tool
 * @param {String} [options.publisherId] Logged in user by default.
 * @param {String} [options.streamName]
 * @param {Boolean} [options.moveNext=true] define how people move to next step:
 * 		If true - need to finish current before going next,
 * 		if numeric - force to go next after this number seconds.
 */
Q.Tool.define("Streams/experience", function (options) {
	var tool = this;
	var state = tool.state;

	var pipe = new Q.pipe(["style", "text", "stream"], function () {
		tool.refresh();
	});

	Streams.get(state.publisherId, state.streamName, function (err) {
		var msg = Q.firstErrorMessage(err);
		if (msg) {
			return Q.alert(msg);
		}

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
	Q.addStylesheet('{{Streams}}/css/tools/experience.css', { slotName: 'Streams' }, pipe.fill("style"));

},

{
	publisherId: Q.Users.loggedInUserId(),
	moveNext: true
},

{
	refresh: function () {
		var tool = this;
		var state = this.state;
		var $toolElement = $(this.element);

	}
});

})(Q, Q.$, window);
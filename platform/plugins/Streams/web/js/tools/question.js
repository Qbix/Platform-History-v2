(function (Q, $, window, undefined) {
/**
 * @module Streams-tools
 */

/**
 * Renders an question interface
 * @class Streams question
 * @constructor
 * @param {Object} [options] any options for the tool
 * @param {String} [options.publisherId] Category stream publisher id
 * @param {String} [options.streamName] Category stream name
 * @param {Q.Event} [options.onSubmit] event occur when question or answer submited.
 */
Q.Tool.define("Streams/question", function(options) {
	var tool = this;
	var state = tool.state;

	var streamName = state.stream ? state.stream.fields.name : state.streamName;

	if (!state.creatable["Streams/question"].title) {
		state.creatable["Streams/question"].title = tool.text.questions.NewQuestion;
	}

	$(tool.element).tool("Streams/related", state).activate();
},

{
	stream: null,
	publisherId: null,
	streamName: null,
	relationType: "Streams/questions",
	realtime: false,
	sortable: true,
	isCategory: true,
	creatable: {
		"Streams/question": {
			publisherId: Q.Users.communityId,
			//title: tool.text.NewQuestion
		}
	}
},

{
});

})(Q, Q.$, window);
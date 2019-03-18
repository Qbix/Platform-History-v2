(function (window, Q, $, undefined) {
	
/**
 * @module MyApp
 */
	
/**
 * YUIDoc description goes here
 * @class MyApp cool
 * @constructor
 * @param {Object} [options] Override various options for this tool
 *  @param {String} [options.publisherId] user id of the publisher of the stream
 *  @param {String} [options.streamName] the stream's name
 *  @param {Q.Event} [options.onMove] Event that fires after a move
 */

Q.Tool.define("MyApp/cool", function (options) {
	var tool = this;
	var state = tool.state;

	if (!state.publisherId || !state.streamName) {
		throw new Q.Exception(tool.id + ": publisherId or streamName is required");
	}
	
	Q.Streams.get(state.publisherId, state.streamName, function () {
		$(tool.element).text(this.fields.title);
	});

	Q.addStylesheet("css/MyApp.css", { slotName: 'MyApp' }); // add any css you need
	
	// set up some event handlers
	this.getMyStream(function (err) {
		if (err) return;
		var stream = this;
		stream.onMove.set(function (err, message) {
			// do something here
		}, this); // handler will be auto-removed when this tool is removed
	});
},

{ // default options here
	publisherId: null,
	streamName: null,
	onMove: new Q.Event() // an event that the tool might trigger
},

{ // methods go here
	
	/**
	 * Example method for this tool
	 * @method getMyStream
	 * @param {Function} callback receives arguments (err) with this = stream
	 */
	getMyStream: function (callback) {
		var state = this.state;
		Q.Streams.retainWith(this)
		.get(state.publisherId, state.streamName, callback);
	}
	
});

})(window, Q, jQuery);
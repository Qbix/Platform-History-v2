(function (Q, $, window, document, undefined) {

/**
 * Places Tools
 * @module Places-tools
 */

var Users = Q.Users;
var Streams = Q.Streams;
var Places = Q.Places;

/**
 * Allows the logged-in user to select/add areas to locations
 * @class Places areas
 * @constructor
 * @param {Object} options used to pass options
 * @param {String} options.publisherId Location stream publisher id
 */
Q.Tool.define("Places/areas", function (options) {
	var tool = this;
	var state = this.state;
	var $te = $(tool.element);

	// set communityId as publisherId if last empty
	state.publisherId = state.publisherId || Q.Users.communityId;

	Q.addStylesheet('Q/plugins/Places/css/areas.css');

	// get location stream and run refresh method
	tool.refresh();
},

{ // default options here
	publisherId: null
},

{ // methods go here
	/**
	 * Refresh the display
	 * @method refresh
	 */
	refresh: function () {
		var tool = this;
		var state = tool.state;
		var $te = $(tool.element);

		// create Streams/participants tool
		$te.tool('Streams/lookup', {
			publisherId: Q.Users.communityId,
			types: ["Places/area"],
			filter: {
				placeholder: "Any area inside this location?"
			},
			onChoose: function (streamName, element, obj) {
				console.log(streamName);
			}
		}, tool.prefix).activate(function(){
			// no need stream type selector as we use only one
			$("select[name=streamType]", this.element).remove();
		});
	},
	/**
	 * Render template with locations, so user can select one of them
	 * @method selectLocation
	 */
	/**
	 * Get location stream and launch callback with this stream as argument
	 * @method getStream
	 * @param {Function} [callback] callback
	 */
	getStream: function(callback){
		var state = this.state;

		Q.Streams.get(state.publisherId, state.streamName, function (err) {
			var fem = Q.firstErrorMessage(err);
			if (fem) {
				return console.warn("Places/areas: " + fem);
			}

			Q.handle(callback, this, [this]);
		});
	}
});

})(Q, jQuery, window, document);
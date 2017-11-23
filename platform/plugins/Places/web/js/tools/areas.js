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
 * @param {String} options.streamName Location stream name
 * @param {String} options.stream Location stream
 * @param {Object} options.location Location object
 */
Q.Tool.define("Places/areas", function (options) {
	var tool = this;
	var state = this.state;
	var $te = $(tool.element);

	Q.addStylesheet('Q/plugins/Places/css/areas.css');

	// get location stream and run refresh method
	tool.refresh();
},

{ // default options here
	publisherId: null,
	streamName: null,
	location: null,
	stream: null
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
		var qFilterTool = tool.$(".Q_tool.Q_filter_tool")[0];
		qFilterTool = qFilterTool ? Q.Tool.from(qFilterTool) : null;

		// if Q/filter didn't created - create one
		if (!qFilterTool) {
			$te.tool('Q/filter', {
				placeholder: "Any area inside this location?"
			}, 'Q_filter')
			.appendTo(tool.element)
			.activate(function(){
				qFilterTool = Q.Tool.from(this.element, "Q/filter");
			});
		}

		tool.getStream(function(stream){
			$("<div>").tool("Streams/related", {
				publisherId: stream.fields.publisherId,
				streamName: stream.fields.name,
				relationType: 'area',
				isCategory: true,
				editable: false,
				onRefresh: function(){
					// add Q_filter_result class to each preview tool
					$(".Streams_preview_container", this.element).addClass("Q_filter_result");
				},
				creatable: {
					"Places/area": {
						'title': "New area",
						'preprocess': function(_proceed){
							var title = qFilterTool.$input.val();

							if (!title) {
								Q.alert("Please set area");
								return false;
							}

							Q.handle(_proceed, this, [{
								title: title
							}]);
						}
					}
				}
			}).appendTo(qFilterTool.element).activate(function(){
				qFilterTool.state.results = this.element;
				qFilterTool.stateChanged('results');
			});
		});
	},
	/**
	 * Get location stream and launch callback with this stream as argument
	 * @method getStream
	 * @param {Function} [callback] callback
	 */
	getStream: function(callback){
		var state = this.state;

		// set communityId as publisherId if last empty
		state.publisherId = state.publisherId || Q.info.appId;

		if (!state.stream && (state.publisherId && state.streamName)) {
			state.stream = {
				publisherId: state.publisherId,
				name: state.streamName,
				stripped: true
			};
		}

		var location = state.location;

		// required publisherId and streamName OR location
		if (!state.stream && !location) {
			throw new Exception("Places/areas: required publisherId and streamName OR location");
		}

		if (state.stream && state.stream.stripped) { // stripped stream means that it have only publisherId and name
			Q.Streams.get(state.stream.publisherId, state.stream.name, function () {
				Q.handle(callback, this, [this]);
			});
		} else if(state.stream) { // we have pure stream
			Q.handle(callback, state.stream, [state.stream]);
		} else if(location) { // we have just location object and need to check whether stream exist
			// check if we already have location with lat, lng and use one
			// if no - create Places/location stream
			Q.req("Places/areas", 'data', function (err, response) {
				var msg;
				if (msg = Q.firstErrorMessage(err, response && response.errors)) {
					console.warn("Places/areas: " + msg);
					return false;
				}

				var stream = response.slots.data;
				Q.Streams.get(stream.publisherId, stream.name, function () {
					Q.handle(callback, this, [this]);
				});
			}, {
				method: 'GET',
				fields: {
					location: {
						latitude: location.latitude,
						longitude: location.longitude,
						venue: location.venue
					}
				}
			});
		}
	}
});

})(Q, jQuery, window, document);
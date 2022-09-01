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
	
	var p = Q.pipe(['stylesheet', 'text'], function (params, subjects) {
		tool.text = params.text[1];
		tool.refresh();
	});
	
	Q.addStylesheet("css/MyApp.css", p.fill('stylesheet'), { slotName: 'MyApp' });
	Q.Text.get('MyApp/content', p.fill('text'));
	
	// set up some event handlers
	tool.getMyStream(function (err) {
		if (err) return;
		var stream = this;
		stream.onMove.set(function (err, message) {
			// do something here
			tool.state.a = message.getInstruction('a');
			tool.state.b = message.getInstruction('b');
			tool.stateChanged(['a', 'b']);
		}, tool); // handler will be auto-removed when this tool is removed
	});
},

{ // default options here
	publisherId: null,
	streamName: null,
	a: 'a',
	b: 'b',
	c: 'c',
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
	},
	
	/**
	 * Refreshes the appearance of the tool completely
	 * @method getMyStream
	 * @param {Function} callback receives arguments (err) with this = stream
	 */
	refresh: function () {
		var tool = this;
		var state = tool.state;
		var fields = Q.extend({
			foo: bar
		}, tool.text);
		var elements = tool.elements = {};
		// get the stream - don't worry about how often you call it, it's a Q.getter
		tool.getMyStream(function (err, stream) {
			Q.Template.render('MyApp/cool/view', fields, function (err, html) {
				// replace all the HTML
				tool.element.innerHTML = html;
			
				// save some elements in an object
				elements.a = tool.element.getElementsByClassName('MyApp_foo');
				elements.b = tool.element.getElementsByClassName('MyApp_b');
				
				// efficient updates only where and when you need, during animation frame
				tool.rendering('a', function (changed, previous, timestamp) {
					elements.a.innerHTML = changed.a;
				}, tool);
				tool.rendering(['a', 'b', 'c'], function (changed, previous, timestamp) {
					elements.sum.value = state.a + state.b + state.c;
				}, tool);
			});
		});
	}
	
});

Q.Template.set('MyApp/cool/view',
	'<div>'
	+	'<p class="MyApp_a">{{foo.bar}}</p>'
	+	'<input class="MyApp_sum" value="{{baz}}">'
	+	'<p>{{&tool "Streams/user/location" "location"}}</p>'
	+'</div>'
);

})(window, Q, jQuery);
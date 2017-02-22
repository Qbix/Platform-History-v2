(function (Q, $, window, undefined) {
	
var Users = Q.Users;
var Streams = Q.Streams;
var Places = Q.Places;
var Travel = Q.Travel;

/**
 * Travel Tools
 * @module Travel-tools
 * @main
 */

/**
 * Used to manage a car and its riders
 * @class Travel car
 * @constructor
 * @param {Object} [options]
 *   @param {String} options.publisherId
 *   @param {String} options.streamName
 */
Q.Tool.define("Travel/car", function Users_avatar_tool(options) {
	var tool = this;
	var state = this.state;
	if (!state.publisherId) {
		throw new Q.Error("Travel/car tool: missing options.publisherId");
	}
	if (!state.streamName) {
		throw new Q.Error("Travel/car tool: missing options.streamName");
	}
	tool.refresh();
},

{
	publisherId: null,
	streamName = null;
	templates: {
		car: {
			dir: 'plugins/Travel/views',
			name: 'Travel/car',
			fields: { }
		}
	},
	onRefresh: new Q.Event()
},

{
	/**
	 * Refresh the display
	 * @method refresh
	 */
	refresh: function () {
		var tool = this;
		var state = this.state;
		var p = new Q.Pipe(['icon', 'contents'], function (params) {
			tool.element.innerHTML = params.icon[0] + params.contents[0];
		});
		Streams.get(state.publisherId, state.streamName, function (err) {
			if (err) {
				return;
			}
			p.fill('icon')(this.fields.icon);
			p.fill('contents')("blablabla");
		});
	}
}

);

Q.Template.set('Travel/car', '<img src="{{& src}}" alt="{{alt}}" class="Travel_car_icon Travel_car_icon_{{size}}">');

})(Q, jQuery, window);
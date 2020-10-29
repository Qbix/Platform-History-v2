(function (window, Q, $, undefined) {
	
/**
 * @module Q
 */
	
/**
 * YUIDoc description goes here
 * @class Q image
 * @constructor
 * @param {Object} [options] Override various options for this tool
 *  @param {string} [options.url] Source to get image from. Can be remote url or "blob:" for local files
 *
 */
Q.Tool.define("Q/image", function (options) {
	var tool = this;
	var state = tool.state;

	if (state.url) {
		state.url = state.url.interpolate({ "baseUrl": Q.info.baseUrl });
	}


	tool.refresh();
},

{
	url: null
},

{
	/**
	 * Refreshes the appearance of the tool completely
	 * @method implement
	 */
	refresh: function () {
		var tool = this;
		var state = this.state;

		$("<img>").prop("src", state.url).appendTo(tool.element);
	}
});

})(window, Q, jQuery);
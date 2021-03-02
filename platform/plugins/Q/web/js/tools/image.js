(function (window, Q, $, undefined) {
	
/**
 * @module Q
 */
	
/**
 * YUIDoc description goes here
 * @class Q image
 * @constructor
 * @param {Object} [options] Override various options for this tool
 *  @param {string} options.url Source to get image from. Can be remote url or "blob:" for local files
 *  @param {boolean} [options.useViewport=true] If true apply Q/viewport on image
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
	url: null,
	useViewport: true
},

{
	/**
	 * Refreshes the appearance of the tool completely
	 * @method implement
	 */
	refresh: function () {
		var tool = this;
		var state = this.state;
		var $toolElement = $(this.element);

		var $img = $("<img>").prop("src", state.url).appendTo(tool.element);
		if (state.useViewport) {
			$img.on("load", function () {
				// to avoid lazyload transparent image loaded
				if ($img.prop("src") !== state.url) {
					return;
				}

				// apply Q/viewport once image loaded
				$img.plugin('Q/viewport', {
					width: $toolElement.width(),
				});
			});
		}
	}
});

})(window, Q, jQuery);
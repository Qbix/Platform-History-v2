Q.exports(function() {
    /**
	 * Activate tool in a hidden element
	 * @static
	 * @method preload
	 * @param {String} toolName
	 * @param {Object} fields
	 * @param {Element|jQuery} container html element to append to
	 */
    return function Streams_Tool_preload(toolName, fields, container=document.body) {
        $("<div style='display:none'>").appendTo(container).tool(toolName, fields).activate(function () {
            this.state.onRefresh && this.state.onRefresh.set(function () {
                !Q.isEmpty(this.cacheData) && this.cache.set(this.cacheKey, 0, null, [this.cacheData]);
            });
        });
	}
});
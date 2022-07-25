(function (Q, $) {

	/**
	 * @module Websites-tools
	 */

	/**
	 * Lets the user search for Websites by type and choose them
	 * @class Websites lookup
	 * @constructor
	 * @param {Array} [options] Override various options for this tool
	 * @param {object} options.platforms platforms user can search from (youtube, soundcloud etc)
	 * @param {integer} options.debounce milliseconds to debounce onFilter event
	 * @param {function} [options.onResults] Set here function to update results before render.
	 * @param {Q.Event} [options.onChoose] This event handler occurs when one of the elements with class "Q_filter_results" is chosen.
	 * @param {Q.Event} [options.onClear] This event handler occurs when chosen result clear.
	 * @param {Object} [options.filter] any options for the Q/filter tool
	 */
	Q.Tool.define("Websites/lookup", function _Websites_lookup_tool (options) {
		var tool = this;
		var state = this.state;

		if (Q.isEmpty(state.platforms)) {
			throw new Q.Error("Websites/lookup tool: missing platforms");
		}

		var pipe = new Q.pipe(["styles", "texts"], function () {
			tool.refresh();
		});

		Q.addStylesheet('{{Websites}}/css/tools/websitesLookup.css', { slotName: 'Websites' }, pipe.fill("styles"));
		Q.Text.get('Websites/content', function (err, text) {
			tool.text = text;

			state.filter.placeholder = text.webpage.StartTypingTitleOrKeywords;
			pipe.fill("texts")();
		});

	}, {
		platforms: null,
		debounce: 300,
		filter: {
			placeholder: "Start typing..."
		},
		onResults: null,
		onChoose: new Q.Event(),
		onClear: new Q.Event()
	}, {
		/**
		 * Call this method to refresh the contents of the tool, requesting only
		 * what's needed and redrawing only what's needed.
		 * @method refresh
		 */
		refresh: function () {
			var tool = this;
			var state = tool.state;

			$(tool.element).tool("Q/filter", state.filter).activate(function () {
				var filter = Q.Tool.from(tool.element, "Q/filter");
				var _getResults = Q.debounce(function (query, element) {
					query = query || ""; // empty string default query
					var latest = Q.latest(filter);
					tool.getResults(query, function (results) {
						var $resultsElement = $(".Q_filter_results", tool.element);
						if (Q.isEmpty(results)) {
							return $resultsElement.empty().append($('<div class="Streams_noResults"/>').html("No results"));
						}

						var $content = $('<table />');
						Q.each(results, function (i, result) {
							var $tr = $('<tr class="Q_filter_result Websites_lookup_result" />').appendTo($content);
							$tr.attr({
								"data-url": result.url,
								"data-time": result.insertedTime
							});
							$('<td class="Websites_lookup_result_icon" />')
								.append($('<img />', {'src': result.icon}))
								.appendTo($tr);

							$('<td class="Websites_lookup_result_title" />')
								.text(result.title)
								.appendTo($tr);
						});

						if (Q.latest(filter, latest)) {
							$resultsElement.empty().append($content);
						}
					});
				}, state.debounce);

				filter.state.onFocus.set(_getResults, tool);
				filter.state.onFilter.set(_getResults, tool);
				filter.state.onChoose.set(function (element, obj) {
					Q.handle(state.onChoose, tool, [element, obj]);
				}, tool);
				filter.state.onClear.set(function () {
					Q.handle(state.onClear, tool);
				}, tool);
			});
		},
		/**
		 * Get query results from backend
		 * @method getResults
		 */
		getResults: Q.getter(function (query, callback) {
			var tool = this;
			var state = this.state;

			Q.req('Websites/lookup', 'results', function (err, data) {
				var msg = Q.firstErrorMessage(err, data && data.errors);
				if (msg) {
					return callback(msg, null);
				}

				var results = data.slots.results;
				results = (Q.typeOf(state.onResults) === "function" && state.onResults(results)) || results;
				Q.handle(callback, tool, [results]);
			}, {
				fields: {
					query: query,
					platforms: state.platforms
				}
			});
		})
	});

})(Q, jQuery);
(function (Q, $) {
/**
 * @module Q-tools
 */
	
/**
 * Implements an input that ratings an associated list (like an autocomplete)
 * @class Q rating
 * @constructor
 * @param {Object} [options] Override various options for this tool
 * @param {Number} [options.value] The value to represent as the rating
 * @param {Number} [options.max=5] The maximum of the range of values
 * @param {Number} [options.min=0] The minimum of the range of values
 * @param {Object} [options.stars] Information about stars
 * @param {Number} [options.stars.count=5] The number of stars corresponding to the max
 * @param {Number} [options.stars.full] Override the img src for the full star
 * @param {Number} [options.stars.empty] Override the img src for the empty star
 * @return {Q.Tool}
 */
Q.Tool.define('Q/rating', function (options) {

	var tool = this;
	var state = tool.state;
	if (state.value == undefined) {
		throw new Q.Error("Q/rating: value is expected");
	}
	var ratio = (state.value - state.min) / (state.max - state.min);
	var count = state.stars.count;
	for (var i=1; i<=count; ++i) {
		if (count * ratio >= i) {
			$('<img class="Q_rating_star_full" />')
				.attr('src', state.stars.full)
				.appendTo(tool.element);
		}
	}
},

{
	max: 5,
	min: 0,
	stars: {
		count: 5,
		full: Q.url('plugins/Q/img/rating/star-yellow.png'),
		empty: Q.url('plugins/Q/img/rating/star-gray.png')
	}
}, 

{

});

})(Q, jQuery);
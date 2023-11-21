(function (Q, $, window, document, undefined) {

/**
 * Q Tools
 * @module Q-tools
 */

/**
 * Adds a fisheye effect to an element and its children
 * @class Q fisheye
 * @constructor
 * @param {Object} [options] possible options
 * @param {Boolean} [options.horizontal=false] whether to do fisheye effect in horizontal direction
 * @param {Boolean} [options.vertical=false] whether to do fisheye effect in vertical direction
 * @param {Boolean} [options.useCenters=false] whether to calculate distance to the center
 *      instead of to the element
 * @param {Boolean} [options.fillContainer=false] whether to stretch elements
 *      to fill the whole container if they take up less width / height
 * @param {Function} [options.distribution] you can provide a continuous function that maps
 *      distance => scale
*/
Q.Tool.jQuery('Q/fisheye',

function _Q_actions(options) {
	var $this = $(this);
	var state = $this.state('Q/fisheye');
	$this.addClass('Q_fisheye').on([Q.Pointer.move, '.Q_fisheye'], function (e) {
		var x = Q.Pointer.getX(e);
		var y = Q.Pointer.getY(e);
		var total = 0, totalWidth = 0, totalHeight = 0;
		var scales = [], widths = [], heights = [];
		// NOTE: the following assumes that the elements have no margins, for now
		// You can fix this by using opacity
		$this.children().each(function () {
			var $child = $(this);
			var offset = $child.offset();
			var width = $child.outerWidth();
			var height = $child.outerHeight();
			var centerX = offset.left + width / 2;
			var centerY = offset.top + height / 2;
			var dx = x - centerX;
			var dy = y - centerY;
			var d;
			if (state.horizontal && state.vertical) {
				d = Math.sqrt((x-centerX)*(x-centerX) + (y-centerY)*(y-centerY));
				if (!state.useCenters) {
					
				}
			} else if (state.horizontal) {
				d = Math.abs(x-centerX);
			} else if (state.vertical) {
				d = Math.abs(y-centerY);
			} else {
				throw new Q.Error("Q/fisheye: horizontal and vertical can't both be false");
			}
			var scale = state.distribution(d);
			scales.push(scale);
			widths.push(width);
			heights.push(height);
			total += scale;
			totalWidth += width;
			totalHeight += height;
		});
		var width = totalWidth;
		var height = totalHeight;
		if (state.fillContainer) {
			width = Math.max(width, this.width());
			height = Math.max(height, this.height());
		}
		
	});
},

{	// default options:
	horizontal: false,
	vertical: true,
	useCenters: false,
	distribution: function (x) {
		return Math.pow(0.9, x) * 0.75 + 0.25;
	},
	fillContainer: false
},

{
	remove: function () {
		$(this).removeClass('Q_fisheye').off('.Q_fisheye');
	}
}

);

})(Q, Q.jQuery, window, document);
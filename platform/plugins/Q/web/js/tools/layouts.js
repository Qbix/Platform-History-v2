(function (Q, $) {
/**
 * @module Q-tools
 */
	
/**
 * Implements a common way to manage layouts for elements on desktop, mobile, etc.
 * @class Q layouts
 * @constructor
 * @param {Object} [options] Override various options for this tool
 * @param {Function} [options.filter] Gets passed an element, returns true if it should be processed
 * @return {Q.Tool}
 */
Q.Tool.define('Q/layouts', function (options) {

	var tool = this;
	var state = this.state;
	if (!tool.state.total) {
		throw new Q.Error("options.total is required");
	}

},

{
	filter: null,
	key: null,
	onLayout: new Q.Event()
}, 

{
	/**
	 * Sets a function to generate a layout
	 * @method setLayoutGenerator
	 * @param {String} key
	 * @param {Function} generator takes a number and returns array of DOMRect
	 */
	setLayoutGenerator: function (key, generator) {
		_generators[key] = generator;
	},
	/**
	 * Gets a layout generator that was added
	 * @method getLayoutGenerator
	 */
	getLayoutGenerator: function (key) {
		return _generators[key];
	},
	/**
	 * Applies a layout
	 * @method layout
	 * @param {String} key the key of the alyout
	 * @param {Number} count How many elements
	 */
	layout: function (key, count) {
		var layout;
		return layout = _generators[key]
			? layout(count)
			: false;
	},
	/**
	 * Animates given elements to a layout
	 * @method layout
	 * @param {String|Function} generator The name of the layout generator, or a function
	 * @param {Array|jQuery} elements An array of elements, in order to fit the layout rectangles
	 * @param {Number} [duration=0] Number of milliseconds
	 * @param {String|Function} ease
	 *  The key of the ease function in Q.Animation.ease object, or another ease function
	 * @return {Boolean} Whether the layout generator existed
	 */
	animate: function (generator, elements, duration, ease) {
		var g = (typeof generator === 'function')
			? generator
			: _generators[generator];
		if (!g) {
			return false;
		}
		var tool = this;
		var container = tool.element;
		var layout = g(container, elements.length);
		if (container.computedStyle('position') === 'static') {
			container.style.position = 'relative';
		}
		var rects = [];
		Q.each(elements, function (i) {
			rects.push(this.getBoundingClientRect());
			if (this.style.position != 'absolute') {
				this.style.position = 'absolute';
			}
		});
		if (this.animation) {
			this.animation.pause();
		}
		this.animation = Q.Animation.play(function (x, y) {
			Q.each(elements, function (i) {
				var rect1 = rects[i];
				var rect2 = layout[i];
				var ts = this.style;
				ts.left = rect1.left + (rect2.left - rect1.left) * y;
				ts.top = rect1.top + (rect2.top - rect1.top) * y;
				ts.width = rect1.width + (rect2.width - rect1.width) * y;
				ts.height = rect1.height + (rect2.height - rect1.height) * y;
			});
		}, duration, ease)
		.onComplete.set(function () {
			this.animation = null;
		});
	}
});

var _generators = {
	tiledVertical: function (container, count) {
		// TODO: implement based on element.clientWidth and element.clientHeight
		// see the photos I sent you, layout is different depending on count
		// The container may have margins, depending on the CSS of the app.
		// What we care about here is the client width and client height.
		var w = container.clientWidth;
		var h = container.clientHeight;
		var rects = [];
		var rect = new DOMRect(1, 2, 3, 4);
		rects.push(rect);
		return rects;
	},
	tiledHorizontal: function (container, count) {
	
	},
	maximizedVertical: function (container, count) {
	
	},
	maximizedHorizontal: function (ccontainer, ount) {
	
	},
	tiledVerticalMobile: function (container, count) {
		var w = container.style.width;
		var h = container.style.height;
		var rects = [];
		var rect = new DOMRect(1, 2, 3, 4)
		rects.push(rect);
		return rects;
	},
	tiledHorizontalMobile: function (container, count) {
	
	},
	maximizedVerticalMobile: function (container, count) {
	
	},
	maximizedHorizontalMobile: function (container, count) {
	
	}
}

})(Q, jQuery);
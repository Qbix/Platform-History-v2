(function (Q, $) {
	/**
	 * @module Q-tools
	 */

	/**
	 * This tool create parallax effect on tool element.
	 * @class Q parallax
	 * @constructor
	 * @param {Object}	[options] Override various options for this tool
	 *  @param {Number}	[options.speed=-2] A negative value will make it move slower than regular scrolling, and faster for positive. Recommended keeping the speed between -10 and 10.
	 *  @param {Float}	[options.center=0.5] Can move start position of parallax element. Top if > 0.5 and bottom if less.
	 *  @param {Number}	[options.zIndex] Can set particular z-index
	 *  @param {string}	[style] Any styles need to apply to element.
	 *  @param {string}	[className] Css class name need to apply to element.
	 *  @param {bool}	[horizontal=false] Horizontal parallax can enable by passing true.
	 *  This feature is intended for panoramic style websites, where users scroll horizontally instead of vertically.
	 *  Note that this can work together at the same time with the default vertical parallax. If you do not want this, pass vertical: false.
	 *  @param {bool}	[vertical=true] Vertical parallax. Enable by default.
	 *  @param {String|HTMLElement}	[wrapper] By default, the position of parallax elements is determined via the scroll position of the body.
	 *  Passing in the wrapper property will force to watch that element instead.
	 *  @param {Q.Event}	[onChange] Event that happens when parallax position changed.
	 * @return {Q.Tool}
	 */
	Q.Tool.define("Q/parallax", function () {
		var tool = this;
		var state = this.state;

		var options = {
			speed: state.speed,
			center: true,
			round: true,
			vertical: state.vertical,
			horizontal: state.horizontal,
			callback: function(positions) {
				Q.handle(state.onChange, tool, [positions]);
			}
		};

		if (state.wrapper) {
			options.wrapper = state.wrapper;
		}

		if (state.center) {
			tool.element.setAttribute('data-rellax-percentage', state.center);
		}
		if (state.zIndex) {
			tool.element.setAttribute('data-rellax-zindex', state.zIndex);
		}
		if (state.style) {
			tool.element.setAttribute('style', state.style);
		}
		if (state.className) {
			tool.element.className += ' ' + state.className;
		}

		Q.addScript("{{Q}}/js/parallax/rellax.min.js", function () {
			tool.parallax = new Rellax(tool.element, options);
		});
	},

	{
		speed: -2,
		center: 0.5,
		zIndex: null,
		horizontal: false,
		vertical: true,
		wrapper: null,
		onChange: new Q.Event()
	},

	{
		refresh: function () {
			this.parallax && this.parallax.refresh();
		},
		Q: {
			beforeRemove: function () {
				this.parallax && this.parallax.destroy();
			}
		}
	});

})(Q, jQuery);

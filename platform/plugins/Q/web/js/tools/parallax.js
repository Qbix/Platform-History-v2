(function (Q, $) {
	/**
	 * @module Q-tools
	 */

	/**
	 * This tool create parallax effect on tool element.
	 * !!!WARNING!!! In order to avoid twitching, comment this: Q.Pointer.preventRubberBand
	 * @class Q parallax
	 * @constructor
	 * @param {Object}	[options] Override various options for this tool
	 *  @param {bool|Number}	[options.speed=false] A negative value will make it move slower than regular scrolling, and faster for positive. Recommended keeping the speed between -10 and 10.
	 *  @param {Float}	[options.center=0.5] Can move start position of parallax element. Top if > 0.5 and bottom if less.
	 *  @param {Number}	[options.zIndex] Can set particular z-index
	 *  @param {string}	[style] Any styles need to apply to element.
	 *  @param {string}	[className] Css class name need to apply to element.
	 *  @param {bool|number}	[leftToRight=false] Horizontal left to right. Use number to define movement limit. If true, 1 value using (means move from border to border).
	 *  @param {bool|number}	[rightToLeft=false] Horizontal right to left. Use number to define movement limit. If true, 1 value using (means move from border to border).
	 *  @param {bool|Number}	[spin=false] will spin element to angle defined by number. If just true, angle=360.
	 *  @param {bool|Number}	[spinRev=false] same as above but spin counterclock-wise.
	 *  @param {bool|Number}	[fadeInOut=false] fade in than out.
	 *  @param {bool|Number}	[fadeIn=false] just fade in
	 *  @param {bool|Number}	[fadeOut=false] just fade out
	 *  @param {bool|number}	[zoomInOut=false] zoom in than out. Use number as measure of zoom. If true, 0.2 value using.
	 *  @param {bool|Number}	[zoomIn=false] just zoom in. Use number as measure of zoom. If true, 0.2 value using.
	 *  @param {bool|Number}	[zoomOut=false] just zoom out. Use number as measure of zoom. If true, 0.2 value using.
	 *  @param {bool|Number}	[blurInOut=false] blur in than out. Use number as measure of blur. If true, 40 value using.
	 *  @param {bool|Number}	[blurIn=false] just blur in. Use number as measure of blur. If true, 40 value using.
	 *  @param {bool|Number}	[blurOut=false] just blur out. Use number as measure of blur. If true, 40 value using.
	 *  @param {bool|number}	[spin=false] Set angle to rotate element (for example 360). If positive - clockwise, negative - back clockwise.
	 *  @param {bool|number}	[swing=false] Skew element to and fro. Use number as measure of Skew. If true, 30 value using.
	 *  @param {bool|number}	[slalom=false] Moving element to and fro. Use number as measure of swing. If true, 50 value using.
	 *  @param {number}	[offset=0] scrollY position so the animation will begin at this point
	 *  @param {String|HTMLElement}	[wrapper] By default, the position of parallax elements is determined via the scroll position of the body.
	 *  Passing in the wrapper property will force to watch that element instead.
	 *  @param {Q.Event}	[onChange] Event that happens when parallax position changed.
	 * @return {Q.Tool}
	 */
	Q.Tool.define("Q/parallax", function () {
		var tool = this;
		var state = this.state;

		if (state.style) {
			tool.element.setAttribute('style', state.style);
		}
		if (state.className) {
			tool.element.className += ' ' + state.className;
		}

		if (state.speed) {
			tool.rellax();
		} else {
			tool.lax();
		}
	},

	{
		speed: false,
		center: 0.5,
		zIndex: null,
		optimize: false,
		wrapper: null,
		leftToRight: false,
		rightToLeft: false,
		spin: false,
		fadeInOut: false,
		fadeIn: false,
		fadeOut: false,
		zoomInOut: false,
		zoomIn: false,
		zoomOut: false,
		blurInOut: false,
		blurIn: false,
		blurOut: false,
		swing: false,
		slalom: false,
		offset: 0,
		onChange: new Q.Event()
	},

	{
		lax: function () {
			var $te = $(this.element);
			var state = this.state;

			Q.addScript("{{Q}}/js/parallax/lax.js", function () {
				var htmlTag = document.getElementsByTagName("html")[0];

				// this code applied only once, so set data-q-parallax flag to HTML tag
				if (!htmlTag.getAttribute('data-q-parallax')) {
					setTimeout(function () {
						lax.setup();

						var update = function () {
							lax.update(window.scrollY);
							window.requestAnimationFrame(update);
						};

						window.requestAnimationFrame(update);

						var w = window.innerWidth;
						window.addEventListener("resize", function() {
							if(w !== window.innerWidth) {
								lax.updateElements();
							}
						});
					}, 2000);

					htmlTag.setAttribute('data-q-parallax', 1);
				}

				var preset = [];
				var options = [];

				if (state.leftToRight) {
					preset.push(state.leftToRight === true ? 'leftToRight' : 'leftToRight-' + state.leftToRight);
				} else if (state.rightToLeft) {
					preset.push(state.rightToLeft === true ? 'rightToLeft' : 'rightToLeft-' + state.rightToLeft);
				}

				if (state.spin) {
					if (state.spin > 0) {
						preset.push('spin-' + state.spin);
					} else {
						preset.push('spinRev-' + (-1 * state.spin));
					}
				}

				if (state.fadeInOut) {
					preset.push('fadeInOut');
				} else if (state.fadeIn) {
					preset.push('fadeIn');
				} else if (state.fadeOut) {
					preset.push('fadeOut');
				}

				if (state.zoomInOut) {
					preset.push(state.zoomInOut === true ? 'zoomInOut' : 'zoomInOut-' + state.zoomInOut);
				} else if (state.zoomIn) {
					preset.push(state.zoomIn === true ? 'zoomIn' : 'zoomIn-' + state.zoomIn);
				} else if (state.zoomOut) {
					preset.push(state.zoomOut === true ? 'zoomOut' : 'zoomOut-' + state.zoomOut);
				}

				if (state.blurInOut) {
					preset.push(state.blurInOut === true ? 'blurInOut' : 'blurInOut-' + state.blurInOut);
				} else if (state.blurIn) {
					preset.push(state.blurIn === true ? 'blurIn' : 'blurIn-' + state.blurIn);
				} else if (state.blurOut) {
					preset.push(state.blurOut === true ? 'blurOut' : 'blurOut-' + state.blurOut);
				}

				if (state.swing) {
					preset.push(state.swing === true ? 'swing' : 'swing-' + state.swing);
				}

				if (state.slalom) {
					preset.push(state.slalom === true ? 'slalom' : 'slalom-' + state.slalom);
				}

				if (state.optimize) {
					$te.attr('data-lax-optimize', true);
				}

				if (state.offset) {
					options.push('offset=' + state.offset);
				}

				$te.addClass('lax');
				$te.attr('data-lax-preset', preset.join(' '));
				$te.attr('data-lax-options', options.join(' '));
			});
		},
		rellax: function () {
			var tool = this;
			var state = this.state;

			Q.addScript("{{Q}}/js/parallax/rellax.js", function () {
				var options = {
					speed: state.speed,
					center: true,
					round: true,
					optimize: state.optimize,
					vertical: true,
					horizontal: false,
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

				tool.parallax = new Rellax(tool.element, options);
			});
		},
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

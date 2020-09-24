(function (Q, $) {
	/**
	 * @module Q-tools
	 */

	/**
	 * This tool show round process bar.
	 * @class Q pie
	 * @constructor
	 * @param {Object}   [options] Override various options for this tool
	 *  @param {Number}  [options.fraction] Value process
	 *  @param {Number}  [options.size] Circle size
	 *  @param {Object}  [options.bgImage] URL to image to put in background
	 *  @param {Object}  [options.color] Arc color
	 *  @param {Object}  [options.borderSize] Arc border size. The progress line width.
	 * @return {Q.Tool}
	 */
	Q.Tool.define("Q/pie", function (options) {
			var tool = this;
			var $toolElement = $(tool.element);
			var state = tool.state;
			options = options || {};

			Q.addStylesheet('{{Q}}/css/pie.css');

			// positioning tool box
			tool.positionParent();

			// rotate arcs according to fraction
			tool.Q.onStateChanged('fraction').set(function () {
				var angle = 360/(100/parseFloat(state.fraction));

				var arcLeftAngle = angle > 180 ? angle - 180 + 45 : 45;
				arcLeftAngle = angle > 360 ? 225 : arcLeftAngle;
				var arcLeftDisplay = arcLeftAngle > 45 ? "block" : "none"; // only for Chrome

				var arcRightAngle = angle < 180 ? angle + 45 : 180 + 45;
				arcRightAngle = angle < 0 ? 45 : arcRightAngle;

				$(".Q_pie_arc.Q_pie_arcLeft", $toolElement).css({transform: "rotate(" + arcLeftAngle + "deg)", display: arcLeftDisplay}); // Chrome incorrect calculate positions
				$(".Q_pie_arc.Q_pie_arcRight", $toolElement).css("transform", "rotate(" + arcRightAngle + "deg)");
			}, "Q/pie");

			// set new size
			tool.Q.onStateChanged('size').set(function () {
				var size = state.size;

				$(".Q_pie_box", $toolElement).css({width: size, height: size});
			}, "Q/pie");

			// set new Arc color
			tool.Q.onStateChanged('color').set(function () {
				var color = state.color;

				$(".Q_pie_arc.Q_pie_arcLeft", $toolElement).css("border-color", color + " " + color + " transparent transparent");
				$(".Q_pie_arc.Q_pie_arcRight", $toolElement).css("border-color", "transparent transparent " + color + " " + color);
			}, "Q/pie");

			// set new Arc borderSize
			tool.Q.onStateChanged('borderSize').set(function () {
				var borderSize = state.borderSize;

				$(".Q_pie_arc, .Q_pie_shield", $toolElement).css("border-width", borderSize);
			}, "Q/pie");

			tool.refresh();
		},

		{
			fraction: 0,
			size: 80,
			bgImage: "",
			color: 'red',
			borderSize: 5, // in px
			clickPos: {
				angle: 0,
				anglePercent: 0
			} // service param contain info about click event inside tool element
		},

		{
			refresh: function () {
				var tool = this;
				var state = tool.state;
				var $toolElement = $(tool.element);

				var bgImage = state.bgImage ? "background-image: url("+state.bgImage+")" : "";

				var fields = {
					bgImage: bgImage
				};

				Q.Template.render(
					'Q/pie/main',
					fields,
					function (err, html) {
						if (err) return;

						$toolElement.html(html);

						// set arcs rotate
						tool.stateChanged('fraction');

						// set pie size
						tool.stateChanged('size');

						// set Arc color
						tool.stateChanged('color');

						// set Arc borderSize
						tool.stateChanged('borderSize');

						var lastEvent = {};
						$toolElement.on('touchstart touchmove', function (event) {
							lastEvent = event;
						});

						// set toolElement click event
						$toolElement.on(Q.Pointer.fastclick, function (event) {
							var x = (Q.getObject(["originalEvent", "touches", 0, "pageX"], lastEvent) || event.pageX) - $toolElement.offset().left;
							var y = (Q.getObject(["originalEvent", "touches", 0, "pageY"], lastEvent) || event.pageY) - $toolElement.offset().top;
							var toolWidth = $toolElement.width();
							var insideR = (toolWidth - state.borderSize * 2)/2; // radius of circle inside arcs
							var outsideR = toolWidth/2; // radius of circle
							var angle = Math.atan2(y - outsideR, x - outsideR)*180/Math.PI + 90;
							angle = angle > 0 ? angle : 360 + angle;
							var anglePercent = angle/360*100;

							state.clickPos.angle = angle;
							state.clickPos.anglePercent = anglePercent;

							if(Math.sqrt((x - outsideR) * (x - outsideR) + (y - outsideR) * (y - outsideR)) < insideR){
								state.clickPos.inside = true;
							}else{
								state.clickPos.inside = false;

								//state.fraction = anglePercent;
								//tool.stateChanged('fraction');
							}
						});
					}
				)
			},
			/**
			 * Positioning tool box in parent box
			 * @method positionParent
			 */
			positionParent: function(){
				var tool = this;

				// if size already set in params - exit
				if(tool.state.size) return;

				var parent = $(tool.element).parent();
				var parentW = parent.width();
				var parentH = parent.height();

				tool.state.size = parentW > parentH ? parentH : parentW;
			},
			/**
			 * Set pie to initial position
			 * @method initPos
			 */
			initPos: function(){
				var tool = this;

				tool.state.fraction = 0;
				tool.stateChanged('fraction');
			}
		}
	);

	Q.Template.set('Q/pie/main',
		'<div class="Q_pie_box" style="{{bgImage}}">'
		+ '<div class="Q_pie_shield"></div>'
		+ '<div class="Q_pie_arcBox Q_pie_arcBoxRight"><div class="Q_pie_arc Q_pie_arcRight"></div></div>'
		+ '<div class="Q_pie_arcBox Q_pie_arcBoxLeft"><div class="Q_pie_arc Q_pie_arcLeft"></div></div>'
		+ '</div>'
	);

})(Q, jQuery);

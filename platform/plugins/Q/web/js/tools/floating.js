(function (Q, $) {
	/**
	 * @module Q-tools
	 */

	/**
	 * This tool make element draggable
	 * @class Q floating
	 * @constructor
	 * @param {Object}   [options] Override various options for this tool
	 * @return {Q.Tool}
	 */
	Q.Tool.define("Q/floating", function (options) {
		var tool = this;
		var $toolElement = $(tool.element);
		var state = tool.state;
		var $body = $('body');
		var dragging = false, dragged = false;
		var el_w = $toolElement.outerWidth(),
			el_h = $toolElement.outerHeight();

		Q.addStylesheet('{{Q}}/css/floating.css');

		var Q_floating_dragging = function(e) {
			if (!dragging) {
				return;
			}

			dragged = true;
			$toolElement.offset({
				top: Q.Pointer.getY(e) - el_h / 2,
				left: Q.Pointer.getX(e) - el_w / 2
			});
		};

		$toolElement.on(Q.Pointer.start, function (e) {
			$toolElement.attr({
				"unselectable": "on",
				"data-dragging": true
			});

			dragged = false
			$body.on(Q.Pointer.move, Q_floating_dragging);
			dragging = true;
		});
		$toolElement.on(Q.Pointer.end, function (e) {
			$body.off(Q.Pointer.move, Q_floating_dragging);

			$toolElement.removeAttr("unselectable").removeAttr("data-dragging");
			dragging = false;

			if (dragged) {
				Q.Pointer.cancelClick();
			}
		});
	},

	{
	},

	{

	});
})(Q, jQuery);

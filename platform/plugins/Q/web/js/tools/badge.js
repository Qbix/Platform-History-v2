(function (Q, $) {
	/**
	 * @module Q-tools
	 */

	/**
	 * Add little badge to one or multiple corners of tool element
	 * @class Q badge
	 * @constructor
	 * @param {Object}   options Override various options for this tool
	 *  @param {string}  [options.tl] settings for top left badge. If == null - badge remove.
	 *  	@param {string}  [options.tl.icon] Badge icon. Can be "{{Q}}/img/..." or "../img/...". If icon=null - badge remove.
	 *  	@param {string}  [options.tl.size=options.size] Badge width.
	 *  	@param {string}  [options.tl.top=0] Badge top position.
	 *  	@param {string}  [options.tl.left=0] Badge left position.
	 *  	@param {string}  [options.tl.right] Badge right position. if defined - left position ignored.
	 *  	@param {string}  [options.tl.bottom] Badge bottom position. if defined - top position ignored.
	 *  @param {string}  [options.tr] settings for top right badge. If == null - badge remove.
	 *  	@param {string}  [options.tr.icon] Badge icon. Can be "{{Q}}/img/..." or "../img/...". If icon=null - badge remove.
	 *  	@param {string}  [options.tr.size=options.size] Badge width.
	 *  	@param {string}  [options.tr.top=0] Badge top position.
	 *  	@param {string}  [options.tr.right=0] Badge right position.
	 *  	@param {string}  [options.tr.left] Badge left position. if defined - right position ignored.
	 *  	@param {string}  [options.tr.bottom] Badge bottom position. if defined - top position ignored.
	 *  @param {string}  [options.br] settings for bottom right badge. If == null - badge remove.
	 *  	@param {string}  [options.br.icon] Badge icon. Can be "{{Q}}/img/..." or "../img/...". If icon=null - badge remove.
	 *  	@param {string}  [options.br.size=options.size] Badge width.
	 *  	@param {string}  [options.br.right=0] Badge right position.
	 *  	@param {string}  [options.br.bottom=0] Badge bottom position.
	 *  	@param {string}  [options.br.left] Badge left position. if defined - right position ignored.
	 *  	@param {string}  [options.br.top] Badge top position. if defined - bottom position ignored.
	 *  @param {string}  [options.bl] settings for bottom left badge
	 *  	@param {string}  [options.bl.icon] Badge icon. Can be "{{Q}}/img/..." or "../img/...". If icon=null - badge remove.
	 *  	@param {string}  [options.bl.size=options.size] Badge width.
	 *  	@param {string}  [options.bl.bottom=0] Badge bottom position.
	 *  	@param {string}  [options.bl.left=0] Badge left position.
	 *  	@param {string}  [options.bl.right] Badge right position. if defined - left position ignored.
	 *  	@param {string}  [options.bl.top] Badge top position. if defined - bottom position ignored.
	 *  @param {string}  [options.size="15px"] Default badge size.
	 * @return {Q.Tool}
	 */
	Q.Tool.define("Q/badge", function (options) {
		var tool = this;
		var state = this.state;
		var $te = $(tool.element);

		// if position of tool element "static" - need to change to "relative"
		// this is important condition for placing badges
		if ($te.css("position") === "static") {
			$te.css("position", "relative");
		}

		Q.addStylesheet('{{Q}}/css/badge.css', function () {
			state.interval = setInterval(function () {
				tool.refresh();
			}, 1000);
		});
	},
	{
		tl: null,
		tr: null,
		br: null,
		bl: null,
		size: "15px"
	},
	{
		refresh: function () {
			var tool = this;
			var state = tool.state;
			var $te = $(tool.element);
			var corners = ['tl', 'tr', 'br', 'bl'];
			var id = $te.attr("id");

			Q.each(corners, function(i, corner){
				var badgeStyle = Q.getObject(corner, state);
				var $badgeElement = Q.getObject(corner, tool);

				// if empty corner or corner.icon - remove this badge
				if (Q.typeOf(badgeStyle) !== "object" || !Q.getObject("icon", badgeStyle)) {
					if ($badgeElement instanceof jQuery) {
						$badgeElement.remove();
					}

					return;
				}

				// default size
				badgeStyle.size = badgeStyle.size || state.size;

				var style = {
					width: badgeStyle.size,
					height: badgeStyle.size,
					'background-image': 'url(' + Q.url(badgeStyle.icon) + ')'
				};

				// default position
				switch (corner) {
					case 'tl':
						if (badgeStyle.bottom) {
							style.bottom = badgeStyle.bottom;
							delete style.top;
						} else {
							style.top = badgeStyle.top || 0;
						}

						if (badgeStyle.right) {
							style.right = badgeStyle.right;
							delete style.left;
						} else {
							style.left = badgeStyle.left || 0;
						}

						break;
					case 'tr':
						if (badgeStyle.bottom) {
							style.bottom = badgeStyle.bottom;
							delete style.top;
						} else {
							style.top = badgeStyle.top || 0;
						}

						if (badgeStyle.left) {
							style.left = badgeStyle.left;
							delete style.right;
						} else {
							style.right = badgeStyle.right || 0;
						}

						break;
					case 'br':
						if (badgeStyle.top) {
							style.top = badgeStyle.top;
							delete style.bottom;
						} else {
							style.bottom = badgeStyle.bottom || 0;
						}

						if (badgeStyle.left) {
							style.left = badgeStyle.left;
							delete style.right;
						} else {
							style.right = badgeStyle.right || 0;
						}

						break;
					case 'bl':
						if (badgeStyle.top) {
							style.top = badgeStyle.top;
							delete style.bottom;
						} else {
							style.bottom = badgeStyle.bottom || 0;
						}

						if (badgeStyle.right) {
							style.right = badgeStyle.right;
							delete style.left;
						} else {
							style.left = badgeStyle.left || 0;
						}

						break;
				}

				// if badge element don't exist - create one
				if (!($badgeElement instanceof jQuery)) {
					$badgeElement = Q.setObject(corner, $("<div class='Q_badge'>").appendTo($te), tool);
				}

				// remove old styles and apply new
				$badgeElement.removeAttr("style").css(style);
			});
		},
		Q: {
			beforeRemove: function () {
				var interval = Q.getObject(["state", "interval"], this);

				interval && clearInterval(interval);
			}
		}
	}
)})(Q, jQuery);

(function (window, Q, $, undefined) {

/**
 * @module Assets
 */

/**
 * Ahow circle with credits amount
 * @class Assets
 * @constructor
 * @param {Object} options Override various options for this tool
 */

Q.Tool.define("Assets/credits", function (options) {
	var tool = this;
	var state = this.state;

	Q.page('', function () {
		if (Q.Users.loggedInUserId()) {
			tool.refresh();
		}
	}, tool);

	Q.Users.onLogin.set(function (user) {
		if (!user) { // the user changed
			return;
		}

		tool.refresh();
	}, tool);
},

{ // default options here
	selection: null
},

{ // methods go here
	refresh: function () {
		var tool = this;
		var state = tool.state;

		var $dashboard = $("#dashboard_slot");
		var $Q_tab = $(state.selection);
		if (!$Q_tab.length) {
			return console.warn("Assets/credits: element not found");
		}
		var $Q_tab_badge = $(".Assets_credits_badge");
		if ($Q_tab_badge.length) {
			return;
		}
		$Q_tab_badge = $("<div class='Q_tab_badge'>").prependTo("body");
		if ($dashboard.hasClass("Q_columns_siblingContainsExpanded")) {
			$Q_tab_badge.addClass("Q_columns_siblingContainsExpanded");
		}
		var _style = function () {
			if (!document.body.contains($Q_tab[0])) {
				return tool.refresh();
			}

			var tabOffset = $Q_tab.offset();
			if (!tabOffset) {
				return; // it's not on the page
			}
			$Q_tab_badge.css({
				position: "absolute",
				"z-index": 1000,
				width: $Q_tab.width(),
				height: 0,
				left: Q.info.isMobile ? tabOffset.left : tabOffset.left - 10,
				top: Q.info.isMobile ? tabOffset.top : tabOffset.top + $Q_tab.height() - 50
			});
		};

		// relocate badge first 5 seconds
		setTimeout(function () {
			_style();
			if (Q.info.isMobile) {
				Q.onLayout($Q_tab[0]).set(_style, true);
			} else {
				new ResizeObserver(_style).observe($dashboard[0])
			}
		}, 2000);

		Q.Assets.Credits.userStream(function () {
			$Q_tab_badge.tool("Q/badge", {
				bl: {
					size: Q.info.isMobile ? '50px' : '60px',
					left: Q.info.isMobile ? "45%" : '140px',
					top: Q.info.isMobile ? "-30px" : "-2px",
					className: "User_avatar_credits",
					content: this.getAttribute("amount")
				}
			}).activate(function () {
				var badgeTool = Q.Tool.from(this.element, "Q/badge");
				Q.Assets.onCreditsChanged.set(function (credits) {
					badgeTool.state.bl.content = credits;
					badgeTool.refresh();
				}, this);
			});
		});
	}
});

})(window, Q, jQuery);
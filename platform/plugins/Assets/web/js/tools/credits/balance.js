(function (window, Q, $, undefined) {

/**
 * @module Assets
 */

/**
 * Ahow circle with credits amount
 * @class Assets
 * @constructor
 * @param {integer} [decimals=2] - decimals after point in credits amount
 * @param {Q.Event} onUpdate - event occur when credits amount updated
 */

Q.Tool.define("Assets/credits/balance", function (options) {
	var tool = this;
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
	decimals: 2,
	onUpdate: new Q.Event()
},

{ // methods go here
	refresh: function () {
		var tool = this;
		var state = tool.state;
		var _fillContent = function (credits) {
			Q.replace(tool.element, parseFloat(credits).toFixed(state.decimals));
			$(tool.element).plugin('Q/textfill', {
				maxFontPixels: 22,
				minFontPixels: 14,
				maxLines: 1
			});
		};
		Q.Assets.Credits.userStream(function (err) {
			if (err) {
				return;
			}

			_fillContent(this.getAttribute("amount"));
			Q.Assets.onCreditsChanged.set(function (credits) {
				_fillContent(credits);
				Q.handle(state.onUpdate, tool, [credits]);
			}, tool);
		}, {
			retainWith: tool
		});
	}
});

})(window, Q, jQuery);
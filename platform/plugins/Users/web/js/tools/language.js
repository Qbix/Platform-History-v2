(function (Q, $, window, undefined) {

var Users = Q.Users;

/**
 * Users Tools
 * @module Users-tools
 */

/**
 * Set users preferred language
 * @class Users language
 * @constructor
 * @param {Object} options options for the tool
 * @param {Q.Event} [options.onError] happens when error occur
 * @param {Q.Event} [options.onLoaded] happens after languages list loaded from server
 * @param {Q.Event} [options.onComplete] happens after selected language defined as preferred
 */
Q.Tool.define('Users/language', function () {
	var tool = this;
	var state = tool.state;

	// request languages list from server
	Q.req('Users/language', 'list', function (err, data) {
		var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(data && data.errors);
		if (msg) {
			Q.handle(state.onError, tool, [msg]);
			return console.warn("Users/language tool: " + msg);
		}

		tool.list = data.slots.list.list;
		tool.currentLanguage = data.slots.list.currentLanguage;

		tool.refresh();

		Q.handle(state.onLoaded, tool, [tool.list, tool.currentLanguage]);
	});

}, {
	onError: new Q.Event(),
	onLoaded: new Q.Event(),
	onComplete: new Q.Event()
}, {
	/**
	 * Refresh the contents
	 */
	refresh: function () {
		var tool = this;
		var state = this.state;
		var currentUser = Q.Users.loggedInUser;

		var $select = $("<select>").attr({
			class: tool.name,
			name: tool.name
		}).on('change', function () {
			var $this = $(this);
			var language = $this.val();

			// if user doesn't logged, just return new language, without request to server
			if (!currentUser) {
				tool.currentLanguage = language;
				Q.handle(state.onComplete, tool, [language]);
				return true;
			}

			// send request to change preferred language
			Q.req('Users/language', ['result'], function (err, data) {
				var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(data && data.errors);
				if (msg) {
					$this.val(tool.currentLanguage);
					Q.handle(state.onError, tool, [msg]);
					return Q.alert("Users/language tool: " + msg);
				}

				tool.currentLanguage = language;
				Q.handle(state.onComplete, tool, [language]);
			}, {
				method: 'post',
				fields: {
					language: language
				}
			});
		});

		Q.each(tool.list, function (index, val) {
			var $option = $("<option>").attr('value', val).text(val.toUpperCase());

			if (val === tool.currentLanguage) {
				$option.attr('selected', 'selected');
			}

			$select.append($option);
		});

		$(tool.element).html($select);
	}
});

})(Q, Q.$, window);
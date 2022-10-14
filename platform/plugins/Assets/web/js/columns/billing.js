"use strict";
(function(Q, $, undefined) {
Q.exports(function (options, index, column, data) {
	Q.addStylesheet('{{Assets}}/css/columns/billing.css', { slotName: 'Assets' });

	var _error = function (message, $el) {
		$el.removeClass("Q_working");
		return Q.alert(message);
	};

	Q.Text.get('Assets/content', function (err, text) {
		$("button[name=save]", column).on(Q.Pointer.fastclick, function () {
			var $this = $(this);
			$this.add("Q_working");
			var creditsMin = parseInt($("input[name=creditsMin]", column).val()) || 0;
			var creditsAdd = parseInt($("input[name=creditsAdd]", column).val()) || 0;

			if (creditsMin < 0) {
				return _error(text.billing.errors.CreditsMinimumNegative, $this);
			}
			if (creditsAdd < 0) {
				return _error(text.billing.errors.CreditsToAddNegative, $this);
			}

			Q.req("Assets/billing", ["results"], function (err, response) {
				$this.removeClass("Q_working");
				var msg = Q.firstErrorMessage(err, response && response.errors);
				if (msg) {
					return console.error(msg);
				}

				var results = response.slots.results;

			}, {
				method: "put",
				fields: {
					creditsMin: creditsMin,
					creditsAdd: creditsAdd
				}
			})
		});
	});
});
})(Q, jQuery);
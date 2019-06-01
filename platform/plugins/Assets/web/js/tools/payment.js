(function (window, Q, $, undefined) {

/**
 * @module Assets
 */

/**
 * Standard tool for making payments.
 * @class Assets payment
 * @constructor
 * @param {array} options Override various options for this tool
 *  @param {string} options.payments can be "authnet" or "stripe"
 *  @param {string} options.amount the amount to pay.
 *  @param {double} [options.currency="usd"] the currency to pay in. (authnet supports only "usd")
 *  @param {string} [options.payButton] Can override the title of the pay button
 *  @param {string} [options.name=Users::communityName()] The name of the organization the user will be paying
 *  @param {string} [options.image] The url pointing to a square image of your brand or product. The recommended minimum size is 128x128px.
 *  @param {string} [options.description=null] A short name or description of the product or service being purchased.
 *  @param {boolean} [options.allowRememberMe=true] Specify whether to include the option to "Remember Me" for future purchases (true or false).
 *  @param {boolean} [options.bitcoin=false] Specify whether to accept Bitcoin (true or false). 
 *  @param {boolean} [options.alipay=false] Specify whether to accept Alipay ('auto', true, or false). 
 *  @param {boolean} [options.alipayReusable=false] Specify if you need reusable access to the customer's Alipay account (true or false).
 */

Q.Tool.define("Assets/payment", function (options) {
	var tool = this;
	var state = tool.state;
	state.payments = state.payments.charAt(0).toUpperCase() + state.payments.slice(1).toLocaleLowerCase();
	var currency = state.currency.toLocaleLowerCase();

	Q.addStylesheet('{{Assets}}/css/tools/AssetsPayment.css', { slotName: 'Assets' });

	if (state.payments === 'Authnet' && currency !== 'usd') {
		throw new Q.Error("Authnet doesn't support currencies other than USD", 'currency');
	}

	if (!state.userId) {
		throw new Q.Error("Assets/payment: Don't render tool when user is not logged in");
	}

	if (!state.amount) {
		throw new Q.Error("Assets/payment: amount is required");
	}

	Q.req('Assets/payment', ["tool"], function (err, data) {
		var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(data && data.errors);
		if (msg) {
			return console.error("GET to Assets/payment: "+ msg);
		}

		tool.refresh(data.slots.tool);
	}, {
		fields: {payments: state.payments}
	});

},

{ // default options here
	payments: 'Stripe',
	amount: 0,
	currency: "usd",
	payButton: null,
	description: null,
	allowRememberMe: true,
	bitcoin: false,
	alipay: false,
	alipayReusable: false,
	name: Q.Users.communityName,
	userId: Q.Users.loggedInUserId(),
	onPay: new Q.Event()
},

{
	refresh: function (data) {
		var tool = this;
		var $te = $(tool.element);
		var state = this.state;
		var payments = state.payments;
		var token = data.token;
		var templateName = "Assets/payment/" + payments;

		if (payments === 'Authnet' && !token) {
			throw new Q.Error("Assets/payment: token is required for authnet");
		}

		// use plugin cordova-plugin-stripe-google-apple-pay for google pay
		if (typeof sgap === 'object' && Q.info.isAndroid()) {
			payments = 'googlepay';
			templateName = "Assets/payment/gpay";
		}

		Q.Template.render(
			templateName,
			Q.extend({}, data, {
				payButton: "Pay with " + payments
			}),
			function (err, html) {
				if (err) return;

				$te.html(html);

				$('.Assets_pay, .Assets_gpay', $te).on(Q.Pointer.click, function () {
					Q.Assets.Payments[payments.toLowerCase()](state, function (err) {
						if (err) {
							if (err.code !== 20) {
								alert(Q.firstErrorMessage(err));
							}
							return;
						}
						Q.handle(state.onPay, tool, arguments);
					});
					return false;
				});
			}
		);
	}
});

Q.Template.set('Assets/payment/Gpay',
	'<button class="Q_button Assets_gpay">&nbsp;</button>'
);
Q.Template.set('Assets/payment/Stripe',
	'<button class="Q_button Assets_pay">{{payButton}}</button>'
);
Q.Template.set('Assets/payment/Authnet',
	'<form method="post" target="Assets_authnet" action="{{action}}">' +
	'<input type="hidden" name="Token" value="{{token}}">' +
	'<button class="Q_button Assets_pay">{{payButton}}</button>' +
	'</form>'
);

})(window, Q, jQuery);
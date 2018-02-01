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
 *  @param {string} [options.panelLabel] The label of the payment button in the Stripe Checkout form (e.g. "Pay {{amount}}", etc.). If you include {{amount}}, it will be replaced by the provided amount. Otherwise, the amount will be appended to the end of your label.
 *  @param {string} [options.zipCode] Specify whether Stripe Checkout should validate the billing ZIP code (true or false). The default is false.
 *  @param {boolean} [options.billingAddress] Specify whether Stripe Checkout should collect the user's billing address (true or false). The default is false.
 *  @param {boolean} [options.shippingAddress] Specify whether Checkout should collect the user's shipping address (true or false). The default is false.
 *  @param {string} [options.email=Users::loggedInUser(true)->emailAddress] You can use this to override the email address, if any, provided to Stripe Checkout to be pre-filled.
 *  @param {boolean} [options.allowRememberMe=true] Specify whether to include the option to "Remember Me" for future purchases (true or false).
 *  @param {boolean} [options.bitcoin=false] Specify whether to accept Bitcoin (true or false). 
 *  @param {boolean} [options.alipay=false] Specify whether to accept Alipay ('auto', true, or false). 
 *  @param {boolean} [options.alipayReusable=false] Specify if you need reusable access to the customer's Alipay account (true or false).
 */

Q.Tool.define("Assets/payment", function (options) {
	var tool = this;
	var state = tool.state;
	var $te = $(tool.element);
	var payments = state.payments && state.payments.toLowerCase();
	if (!Q.Users.loggedInUser) {
		throw new Q.Error("Assets/payment: Don't render tool when user is not logged in");
	}
	if (['authnet', 'stripe'].indexOf(payments) < 0) {
		throw new Q.Error("Assets/payment: payments must be either 'authnet' or 'stripe'");
	}
	if (!state.amount) {
		throw new Q.Error("Assets/payment: amount is required");
	}
	if (payments === 'authnet' && !state.token) {
		throw new Q.Error("Assets/payment: token is required for authnet");
	}
	
	tool.$('.Assets_pay').on(Q.Pointer.click, function () {
		Q.Assets.Payments[payments](state, function (err) {
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
},

{ // default options here
	planPublisherId: Q.Users.communityId,
	planStreamName: null,
	onPay: new Q.Event()
},

{ // methods go here


});

Q.addStylesheet('{{Assets}}/css/Assets.css', { slotName: 'Assets' });

})(window, Q, jQuery);
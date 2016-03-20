(function (window, Q, $, undefined) {

/**
 * @module Awards
 */

/**
 * Standard tool for starting or managing payments.
 * @class Awards payment
 * @constructor
 * @param {Object} options Override various options for this tool
 *  @param {String} options.payments can be "authnet" or "stripe"
 *  @param {String} options.planStreamName the name of the payment plan's stream
 *  @param {String} [options.planPublisherId=Q.Users.communityId] the publisher of the payment plan's stream
 *  @param {String} [params.token] If payments is "authnet" then tool must be rendered server-side
 *  @param {String} [params.action] If payments is "authnet" then tool must be rendered server-side
 */

Q.Tool.define("Awards/payment", function (options) {
	var tool = this;
	var state = tool.state;
	var $te = $(tool.element);
	var payments = state.payments && state.payments.toLowerCase();
	if (['authnet', 'stripe'].indexOf(payments) < 0) {
		throw new Q.Error("Awards/payment: payments must be either 'authnet' or 'stripe'");
	}
	if (!state.amount) {
		throw new Q.Error("Awards/payment: amount is required");
	}
	if (payments === 'authnet' && !state.token) {
		throw new Q.Error("Awards/payment: token is required for authnet");
	}
	
	if (!Q.Users.loggedInUser) {
		console.warn("Awards/payment: Don't render tool when user is not logged in");
		return;
	}
	
	tool.$('.Awards_pay').on(Q.Pointer.click, function () {
		Q.Awards.Payments[payments](state, function (err) {
			if (err) {
				return alert(Q.firstErrorMessage(err));
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

Q.addStylesheet('plugins/Awards/css/Awards.css');

})(window, Q, jQuery);
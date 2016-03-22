(function (window, Q, $, undefined) {

/**
 * @module Awards
 */

/**
 * Standard tool for starting or managing subscriptions.
 * @class Awards subscription
 * @constructor
 * @param {Object} options Override various options for this tool
 *  @param {String} options.payments can be "authnet" or "stripe"
 *  @param {String} options.planStreamName the name of the subscription plan's stream
 *  @param {String} [options.planPublisherId=Q.Users.communityId] the publisher of the subscription plan's stream
 *  @param {String} [params.token] If payments is "authnet" then tool must be rendered server-side
 *  @param {String} [params.action] If payments is "authnet" then tool must be rendered server-side
 */

Q.Tool.define("Awards/subscription", function (options) {
	var tool = this;
	var state = tool.state;
	var $te = $(tool.element);
	var payments = state.payments && state.payments.toLowerCase();
	if (!Q.Users.loggedInUser) {
		throw new Q.Error("Awards/subscription: Don't render tool when user is not logged in");
	}
	if (['authnet', 'stripe'].indexOf(payments) < 0) {
		throw new Q.Error("Awards/subscription: payments must be either 'authnet' or 'stripe'");
	}
	if (!state.planStreamName) {
		throw new Q.Error("Awards/subscription: planStreamName is required");
	}
	if (payments === 'authnet' && !state.token) {
		throw new Q.Error("Awards/subscription: token is required for authnet");
	}
	
	tool.$('.Awards_subscribe').on(Q.Pointer.click, function () {
		Q.Awards.Subscriptions[payments](state, function (err) {
			if (err) {
				return alert(Q.firstErrorMessage(err));
			}
			Q.handle(state.onSubscribe, tool, arguments);
		});
		return false;
	});
},

{ // default options here
	planPublisherId: Q.Users.communityId,
	planStreamName: null,
	onSubscribe: new Q.Event()
},

{ // methods go here


});

Q.addStylesheet('plugins/Awards/css/Awards.css');

})(window, Q, jQuery);
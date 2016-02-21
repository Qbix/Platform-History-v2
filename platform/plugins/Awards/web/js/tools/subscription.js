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
 */

Q.Tool.define("Awards/subscription", function (options) {
	var tool = this;
	var state = tool.state;
	var $te = $(tool.element);

	if (!state.planStreamName) {
		throw new Q.Error("Awards/subscription: planStreamName is required");
	}
	
	if (!Q.Users.loggedInUser) {
		tool.element.style.display = 'none';
		console.warn("Don't render tool when user is not logged in");
		return;
	}
	
	tool.$('.Awards_payment').on(Q.Pointer.click, function () {
		Q.Awards.Dialogs.payment();
	});
	
	tool.$('.Awards_subscribe').on(Q.Pointer.click, function () {
		Q.Awards.subscribe(state.payments, state.planPublisherId, state.planStreamName, function () {
			Q.handle(state.onSubscribe, this, arguments);
		});
	});
},

{ // default options here
	planPublisherId: Q.Users.communityId,
	planStreamName: null,
	onSubscribe: new Q.Event()
},

{ // methods go here


});

Q.Template.set(
	'Awards/stripe',
	'<div class="{{class}}">{{& title}}</div>'
	+ '<form action="/charge" method="POST">'
	+ '<script'
	+ 'src="https://checkout.stripe.com/checkout.js" class="stripe-button"'
	+ 'data-key="pk_test_jWgB7......."'
	+ 'data-image="/img/documentation/checkout/marketplace.png"'
	+ 'data-name="Demo Site"'
	+ 'data-description="2 widgets"'
	+ 'data-amount="2000"'
	+ 'data-locale="auto">'
	+ '</script>'
	+ '</form>'
);

Q.addStylesheet('plugins/Awards/css/Awards.css');

})(window, Q, jQuery);
(function (window, Q, $, undefined) {

/**
 * @module Assets
 */

/**
 * Standard tool for starting or managing subscriptions.
 * @class Assets subscription
 * @constructor
 * @param {Object} options Override various options for this tool
 *  @param {String} options.payments can be "authnet" or "stripe"
 *  @param {String} options.planStreamName the name of the subscription plan's stream
 *  @param {String} [options.planPublisherId=Q.Users.communityId] the publisher of the subscription plan's stream
 *  @param {String} [params.token] If payments is "authnet" then tool must be rendered server-side
 *  @param {String} [params.action] If payments is "authnet" then tool must be rendered server-side
 */

Q.Tool.define("Assets/subscription", function (options) {
	var tool = this;
	var state = tool.state;
	var $te = $(tool.element);
	var payments = state.payments && state.payments.toLowerCase();
	state.publishableKey = Q.Assets.Payments.stripe.publishableKey;

	var pipe = Q.pipe(['styles', 'scripts', 'texts'], function () {
		tool.refresh();
	});

	Q.addStylesheet('{{Assets}}/css/tools/AssetsSubscription.css', {slotName: 'Assets'}, pipe.fill('styles'));
	Q.addScript('https://js.stripe.com/v3/', pipe.fill('scripts'));
	Q.Text.get('Assets/content', function (err, text) {
		var msg = Q.firstErrorMessage(err);
		if (msg) {
			return console.warn(msg);
		}

		tool.text = text.subscriptions;
		pipe.fill('texts')();
	});

	if (!Q.Users.loggedInUser) {
		throw new Q.Error("Assets/subscription: Don't render tool when user is not logged in");
	}
	if (['authnet', 'stripe'].indexOf(payments) < 0) {
		//throw new Q.Error("Assets/subscription: payments must be either 'authnet' or 'stripe'");
	}
	if (!state.planStreamName) {
		//throw new Q.Error("Assets/subscription: planStreamName is required");
	}
	if (payments === 'authnet' && !state.token) {
		//throw new Q.Error("Assets/subscription: token is required for authnet");
	}

	tool.$('.Assets_subscribe').on(Q.Pointer.click, function () {
		Q.Assets.Subscriptions[payments](state, function (err) {
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
	immediatePayment: false,
	onSubscribe: new Q.Event()
},

{
	refresh: function () {
		var tool = this;
		var state = this.state;

		Q.Dialogs.push({
			title: tool.text.SubscribePayment,
			className: "Assets_subscription_stripe",
			template: {
				name: 'Assets/subscription/stripe',
				fields: {
					text: tool.text,
					checked: state.immediatePayment ? 'checked' : ''
				}
			},
			onActivate: function ($dialog) {
				var stripe = Stripe(state.publishableKey);
				var elements = stripe.elements();
				var card = elements.create('card');
				var displayError = $("#Assets_subscription_stripe_errors", $dialog);

				card.mount($("#Assets_subscription_stripe_card", $dialog)[0]);

				// Handle real-time validation errors from the card Element.
				card.addEventListener('change', function(event) {
					if (event.error) {
						displayError.html(event.error.message);
					} else {
						displayError.html('');
					}
				});

				// Handle form submission.
				var form = $("form", $dialog)[0];
				form.addEventListener('submit', function(event) {
					event.preventDefault();

					stripe.createToken(card).then(function(result) {
						if (result.error) {
							// Inform the user if there was an error.
							displayError.html(result.error.message);
						} else {
							// Send the token to your server.
							console.log(result.token);
						}
					});
				});
			}
		});
	}
});

Q.Template.set('Assets/subscription/stripe',
	'<form>' +
	'	<div class="Assets_subscription_stripe_box">' +
	'		<div id="Assets_subscription_stripe_card"></div>' +
	'		<div id="Assets_subscription_stripe_errors" role="alert"></div>' +
	'	</div>' +
	'	<input id="Assets_subscription_stripe_immediate" {{checked}} type="checkbox"><label for="Assets_subscription_stripe_immediate">{{text.ImmediatePayment}}</label>' +
	'	<button class="Q_button" name="subscribe">{{text.SubscribePayment}}</button>' +
	'</form>'
);
})(window, Q, jQuery);
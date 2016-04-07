(function(Q, Assets, Streams, $) {

/**
 * Various front-end functionality dealing with awards, badges, credits, etc.
 * @class Assets
 */

Q.text.Assets = {
	subscriptions: {
		infoTitle: "Set Payment Information",
		confirm: {
			title: "Start Subscription",
			message: "Would you like to subscribe to {{title}}?",
			ok: "OK",
			cancel: "Cancel"
		}
	},
	payments: {
		infoTitle: "Set Payment Information",
		confirm: {
			title: "Make a Payment",
			message: "Do you agree to pay {{symbol}}{{amount}}?",
			ok: "OK",
			cancel: "Cancel"
		}
	}
};

var Users = Q.Users;
var Streams = Q.Streams;
var Assets = Q.Assets = Q.plugins.Assets = {

	/**
	 * Operates with credits.
	 * @class Assets.Credits
	 */
	
	Credits: {
		/**
		 * Get the Assets/user/credits stream published by the logged-in user, if any
		 * @method userStream
		 *  @param {Function} [callback] The function to call, receives (err, stream)
		 */
		userStream: function (callback) {
			if (!Users.loggedInUser) {
				callback(new Q.Error("Credits/userStream: not logged in"), null);
				return false;
			}
			Streams.get(Users.loggedInUser.id, "Assets/user/credits", callback);
		}
	},

	/**
	 * Operates with subscriptions.
	 * @class Assets.Subscriptions
	 */
	Subscriptions: {
		/**
		 * Show an authnet dialog where the user can choose their payment profile,
		 * then show a confirmation box, and then start a subscription with that
		 * payment profile.
		 * @method authnet
		 * @static
		 *  @param {Object} [options] Any additional options to pass to the dialog, and also:
		 *  @param {String} [options.planPublisherId=Q.Users.communityId] The publisherId of the subscription plan
		 *  @param {String} [options.planStreamName="Assets/plan/main"] The name of the subscription plan's stream
		 *  @param {String} [options.action] Required. Should be generated with Assets/subscription tool.
		 *  @param {String} [options.token] Required. Should be generated with Assets/subscription tool.
		 *  @param {Function} [callback] The function to call, receives (err, paymentSlot)
		 */
		authnet: function (options, callback) {
			var o = Q.extend({},
				Q.text.Assets.subscriptions, 
				Assets.Subscriptions.authnet.options, 
				options
			);
			Streams.get(o.planPublisherId, o.planStreamName, function (err) {
				if (err) {
					return callback && callback(err);
				}
				var plan = this;
				if (!o.action || !o.token) {
					throw new Q.Error("Assets.Subscriptions.authnet: action and token are required");
				}
				var $form = $('<form  method="post" target="Assets_authnet" />')
				.attr('action', o.action)
				.append($('<input name="Token" type="hidden" />').val(o.token));
				var html = '<iframe ' +
					'class="Assets_authnet" ' +
					'name="Assets_authnet" ' +
					'src="" ' +
					'frameborder="0" ' +
					'scrolling="yes" ' +
				'></iframe>';
				Q.Dialogs.push(Q.extend({
					title: o.infoTitle,
					apply: true,
					onActivate: {"Assets": function () {
						$form.submit();
					}},
					onClose: {"Assets": function () {
						// TODO: don't do the subscription if payment info wasn't added
						var message = o.confirm.message.interpolate({
							title: plan.fields.title,
							name: o.name
						});
						Q.extend(o, Q.text.Assets.subscriptions.confirm);
						Q.confirm(message, function (result) {
							if (!result) return;
							Assets.Subscriptions.subscribe('authnet', o, callback);
						}, o);
					}}
				}, options, {
					content: html
				}));
			});
		},
		
		/**
		 * Show a stripe dialog where the user can choose their payment profile
		 * and then start a subscription with that payment profile.
		 * @method stripe
		 * @static
		 *  @param {Object} [options] Any additional options to pass to the stripe checkout config, which include things like:
		 *  @param {String} [options.planPublisherId=Q.Users.communityId] The publisherId of the subscription plan
		 *  @param {String} [options.planStreamName="Assets/plan/main"] The name of the subscription plan's stream
		 *  @param {String} [options.action] Required. Should be generated with Assets/subscription tool.
		 *  @param {String} [options.token] Required. Should be generated with Assets/subscription tool.
		 *  @param {Function} [callback] The function to call, receives (err, paymentSlot)
		 */
		stripe: function (options, callback) {
			var o = Q.extend({
				confirm: Q.text.Assets.subscriptions.confirm
			}, Assets.Subscriptions.stripe.options, options);
			Streams.get(o.planPublisherId, o.planStreamName, function (err) {
				if (err) {
					return callback && callback(err);
				}
				var plan = this;
				Q.addScript(o.javascript, function () {
					var params = Q.extend({
						name: o.name,
						description: plan.fields.title,
						amount: plan.get('amount')
					}, o);
					params.amount *= 100;
					StripeCheckout.configure(Q.extend({
						key: Assets.Payments.stripe.publishableKey,
						token: function (token) {
							o.token = token;
							Assets.Subscriptions.subscribe('stripe', o, callback);
						}
					}, params)).open();
				});
				
			});
		},
		
		/**
		 * Subscribe the logged-in user to a particular payment plan
		 * @method subscribe
		 * @static
		 *  @param {String} payments can be "authnet" or "stripe"
		 *  @param {Object} options Any additional options, which should include:
		 *  @param {String} options.planPublisherId The publisherId of the subscription plan
		 *  @param {String} options.planStreamName The name of the subscription plan's stream
		 *  @param {String} options.token the token obtained from the hosted forms
		 *  @param {Function} [callback] The function to call, receives (err, paymentSlot)
		 */
		subscribe: function (payments, options, callback) {
			var fields = {
				payments: payments,
				planPublisherId: options.planPublisherId,
				planStreamName: options.planStreamName,
				token: options.token
			};
			Q.req('Assets/subscription', 'subscription', function (err, response) {
				var msg;
				if (msg = Q.firstErrorMessage(err, response && response.errors)) {
					return callback(msg, null);
				}
				Q.handle(callback, this, [null, response.slots.payment]);
			}, {
				method: 'post',
				fields: fields
			});
		}
	},
	
	/**
	 * Operates with payments
	 * @class Assets.Payments
	 */
	Payments: {
		/**
		 * Show an authnet dialog where the user can choose their payment profile,
		 * then show a confirmation box to make a payment, and then charge that
		 * payment profile.
		 * @method authnet
		 * @static
		 *  @param {Object} [options] Any additional options to pass to the dialog, and also:
		 *  @param {Number} options.amount the amount to pay. 
		 *  @param {String} [options.action] Required. Should be generated with Assets/payment tool.
		 *  @param {String} [options.token] Required. Should be generated with Assets/payment tool.
		 *  @param {String} [options.publisherId=Q.Users.communityId] The publisherId of the Assets/product or Assets/service stream
		 *  @param {String} [options.streamName] The name of the Assets/product or Assets/service stream
		 *  @param {String} [options.description] A short name or description of the product or service being purchased.
		 *  @param {Function} [callback] The function to call, receives (err, paymentSlot)
		 */
		authnet: function (options, callback) {
			var o = Q.extend({},
				Q.text.Assets.payments,
				Assets.Payments.authnet.options,
				options
			);
			if (!o.action || !o.token) {
				throw new Q.Error("Assets.Payments.authnet: action and token are required");
			}
			if (!o.amount) {
				throw new Q.Error("Assets.Payments.authnet: amount is required");
			}
			var $form = $('<form method="post" target="Assets_authnet" />')
			.attr('action', o.action)
			.append($('<input name="Token" type="hidden" />').val(o.token));
			var html = '<iframe ' +
				'class="Assets_authnet" ' +
				'name="Assets_authnet" ' +
				'src="" ' +
				'frameborder="0" ' +
				'scrolling="yes" ' +
			'></iframe>';
			Q.Dialogs.push(Q.extend({
				title: o.infoTitle,
				apply: true,
				onActivate: {"Assets": function () {
					$form.submit();
				}},
				onClose: {"Assets": function () {
					// TODO: don't do the payment if info wasn't added
					Assets.Currencies.load(function () {
						var message = o.confirm.message.interpolate({
							amount: o.amount,
							name: o.name,
							symbol: Assets.Currencies.symbols.USD
						});
						Q.extend(o, Q.text.Assets.payments.confirm);
						Q.confirm(message, function (result) {
							if (!result) return;
							Assets.Payments.pay('authnet', o, callback);
						}, o);
					});
				}}
			}, options, {
				content: html
			}));
		},
		
		/**
		 * Show a stripe dialog where the user can choose their payment profile
		 * and then charge that payment profile.
		 * @method stripe
		 * @static
		 *  @param {Object} [options] Any additional options to pass to the stripe checkout config, and also:		
		 *  @param {Number} options.amount the amount to pay. 
		 *  @param {String} [options.currency="usd"] the currency to pay in.
		 *  @param {String} [options.publisherId=Q.Users.communityId] The publisherId of the Assets/product or Assets/service stream
		 *  @param {String} [options.streamName] The name of the Assets/product or Assets/service stream
		 *  @param {String} [options.name=Users::communityName()] The name of the organization the user will be paying
		 *  @param {String} [options.image] The url pointing to a square image of your brand or product. The recommended minimum size is 128x128px.
		 *  @param {String} [options.description] A short name or description of the product or service being purchased.
		 *  @param {String} [options.panelLabel] The label of the payment button in the Stripe Checkout form (e.g. "Pay {{amount}}", etc.). If you include {{amount}}, it will be replaced by the provided amount. Otherwise, the amount will be appended to the end of your label.
		 *  @param {String} [options.zipCode] Specify whether Stripe Checkout should validate the billing ZIP code (true or false). The default is false.
		 *  @param {Boolean} [options.billingAddress] Specify whether Stripe Checkout should collect the user's billing address (true or false). The default is false.
		 *  @param {Boolean} [options.shippingAddress] Specify whether Checkout should collect the user's shipping address (true or false). The default is false.
		 *  @param {String} [options.email] Set the email address, if any, provided to Stripe Checkout to be pre-filled.
		 *  @param {Boolean} [options.allowRememberMe=true] Specify whether to include the option to "Remember Me" for future purchases (true or false).
		 *  @param {Boolean} [options.bitcoin=false] Specify whether to accept Bitcoin (true or false). 
		 *  @param {Boolean} [options.alipay=false] Specify whether to accept Alipay ('auto', true, or false). 
		 *  @param {Boolean} [options.alipayReusable=false] Specify if you need reusable access to the customer's Alipay account (true or false).
		 *  @param {Function} [callback] The function to call, receives (err, paymentSlot)
		 */
		stripe: function (options, callback) {
			var o = Q.extend({},
				Q.text.Assets.payments,
				Assets.Payments.stripe.options,
				options
			);
			if (!o.amount) {
				throw new Q.Error("Assets.Payments.stripe: amount is required");
			}
			Q.addScript(o.javascript, function () {
				var params = Q.extend({
					name: o.name,
					amount: o.amount
				}, o);
				params.amount *= 100;
				StripeCheckout.configure(Q.extend({
					key: Assets.Payments.stripe.publishableKey,
					token: function (token) {
						o.token = token;
						Assets.Payments.pay('stripe', o, callback);
					}
				}, params)).open();
			});
		},
		
		/**
		 * Charge the user once you've obtained a token
		 * @method pay
		 *  @param {String} payments can be "authnet" or "stripe"
		 *  @param {Object} options Any additional options, which include:
		 *  @param {String} [options.publisherId=Q.Users.communityId] The publisherId of the Assets/product or Assets/service stream
		 *  @param {String} [options.streamName] The name of the Assets/product or Assets/service stream
		 *  @param {Number} options.description A short name or description of the product or service being purchased.
		 *  @param {Number} options.amount the amount to pay. 
		 *  @param {String} [options.currency="usd"] the currency to pay in. (authnet supports only "usd")
		 *  @param {String} [options.token] the token obtained from the hosted forms
		 *  @param {Function} [callback] The function to call, receives (err, paymentSlot)
		 */
		pay: function (payments, options, callback) {
			var fields = {
				payments: payments,
				publisherId: options.publisherId,
				streamName: options.streamName,
				token: options.token,
				amount: options.amount,
				description: options.description
			};
			Q.req('Assets/payment', 'charge', function (err, response) {
				var msg;
				if (msg = Q.firstErrorMessage(err, response && response.errors)) {
					return callback(msg, null);
				}
				Q.handle(callback, this, [null, response.slots.charge]);
			}, {
				method: 'post',
				fields: fields
			});
		}
	},
	
	/**
	 * For dealing with currencies
	 * @class Assets.Currencies
	 */
	Currencies: {
		/**
		 * @method load
		 * @static
		 * Use this to load currency data into Q.Assets.Currencies
		 * @param {Function} callback Once the callback is called, 
		 *   Q.Assets.Currencies.symbols and Q.Assets.Currencies.names is accessible
		 */
		load: function (callback) {
			Q.addScript('plugins/Assets/js/lib/currencies.js', callback);
		},
		symbols: null, 
		names: null
	}
};

Assets.Subscriptions.authnet.options = {
	planPublisherId: Users.communityId,
	planStreamName: "Assets/plan/main",
	name: Users.communityName
};
Assets.Subscriptions.stripe.options = {
	planPublisherId: Users.communityId,
	planStreamName: "Assets/plan/main",
	javascript: 'https://checkout.stripe.com/checkout.js',
	name: Users.communityName
};
Assets.Payments.authnet.options = {
	name: Users.communityName,
	description: 'a product or service'
};
Assets.Payments.stripe.options = {
	description: 'a product or service',
	javascript: 'https://checkout.stripe.com/checkout.js',
	name: Users.communityName
};

Q.Tool.define({
	"Assets/subscription": "plugins/Assets/js/tools/subscription.js",
	"Assets/payment": "plugins/Assets/js/tools/payment.js"
});


})(Q, Q.plugins.Assets, Q.plugins.Streams, jQuery);
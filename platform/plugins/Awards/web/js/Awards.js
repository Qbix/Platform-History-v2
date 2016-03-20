/**
 * Various front-end functionality dealing with awards, badges, credits, etc.
 * @class Awards
 */

Q.text.Awards = {
	subscriptions: {
		confirm: {
			title: "Start subscription",
			message: "Would you like to subscribe to {{title}}?",
			ok: "OK",
			cancel: "Cancel"
		}
	}
};

var Users = Q.Users;
var Streams = Q.Streams;
var Awards = Q.Awards = Q.plugins.Awards = {

	/**
	 * Operates with credits.
	 * @class Awards.Credits
	 */
	
	Credits: {
		/**
		 * Get the Awards/user/credits stream published by the logged-in user, if any
		 * @method userStream
		 *  @param {Function} [callback] The function to call, receives (err, stream)
		 */
		userStream: function (callback) {
			if (!Users.loggedInUser) {
				callback(new Q.Error("Credits/userStream: not logged in"), null);
				return false;
			}
			Streams.get(Users.loggedInUser.id, "Awards/user/credits", callback);
		}
	},

	/**
	 * Operates with subscriptions.
	 * @class Awards.Subscriptions
	 */
	Subscriptions: {
		/**
		 * Show an authnet dialog where the user can choose their payment profile,
		 * then show a confirmation box to make a payment, and then charge that
		 * payment profile.
		 * @method authnet
		 *  @param {Object} [options] Any additional options to pass to the dialog, and also:
		 *  @param {}
		 *  @param {String} [params.planPublisherId=Q.Users.communityId] The publisherId of the subscription plan
		 *  @param {String} [params.planStreamName="Awards/plan/main"] The name of the subscription plan's stream
		 *  @param {String} [params.action] Required. Should be generated with Awards/subscription tool.
		 *  @param {String} [params.token] Required. Should be generated with Awards/subscription tool.
		 *  @param {Function} [callback] The function to call, receives (err, paymentSlot)
		 */
		authnet: function (options, callback) {
			var o = Q.extend({
				confirm: Q.text.Awards.subscriptions.confirm
			}, Awards.Subscriptions.authnet.options, options);
			Streams.get(o.planPublisherId, o.planStreamName, function (err) {
				if (err) {
					return callback && callback(err);
				}
				var plan = this;
				if (!o.action || !o.token) {
					throw new Q.Error("Awards.Subscriptions.authnet: action and token are required");
				}
				var $form = $('<form target="Awards_authnet" />')
				.attr('action', o.action)
				.append($('<input name="Token" type="hidden" />').val(o.token));
				var html = '<iframe ' +
					'name="Awards_authnet" ' +
					'src="" ' +
					'width="480" ' +
					'height="640" ' +
					'frameborder="0" ' +
					'scrolling="no" ' +
					'class="authnet" ' +
				'></iframe>';
				Q.Dialogs.push(Q.extend({
					title: 'Set Payment Information',
					apply: true,
					onActivate: {"Awards": function () {
						$form.submit();
					}},
					onClose: {"Awards": function () {
						// TODO: don't do the subscription if payment info wasn't added
						var message = o.confirm.message.interpolate({
							title: plan.fields.title
						});
						Q.prompt(message, function (result) {
							if (!result) return;
							Awards.Subscriptions.subscribe('authnet', o, callback);
						}, o);
					}}
				}, options, {
					content: html
				}));
			});
		},
		
		/**
		 * Show a stripe dialog where the user can choose their payment profile
		 * and then charge that payment profile.
		 * @method authnet
		 *  @param {Object} [options] Any additional options to pass to the stripe checkout config, and also:
		 *  @param {}
		 *  @param {String} [params.planPublisherId=Q.Users.communityId] The publisherId of the subscription plan
		 *  @param {String} [params.planStreamName="Awards/plan/main"] The name of the subscription plan's stream
		 *  @param {String} [params.action] Required. Should be generated with Awards/subscription tool.
		 *  @param {String} [params.token] Required. Should be generated with Awards/subscription tool.
		 *  @param {Function} [callback] The function to call, receives (err, paymentSlot)
		 */
		stripe: function (options, callback) {
			var o = Q.extend({
				confirm: Q.text.Awards.subscriptions.confirm
			}, Awards.Subscriptions.stripe.options, options);
			Streams.get(o.planPublisherId, o.planStreamName, function (err) {
				if (err) {
					return callback && callback(err);
				}
				var plan = this;
				Q.addScript(o.javascript, function () {
					var params = {
						name: o.name,
						description: plan.fields.title,
						amount: plan.get('amount') * 100,
					};
					StripeCheckout.configure(Q.extend({
						key: Awards.Payments.stripe.publishableKey,
						token: function (token) {
							o.token = token;
							Awards.Subscriptions.subscribe('stripe', o, callback);
						}
					}, o)).open(Q.extend(params, o));
				});
			});
		},
		
		/**
		 * Subscribe the logged-in user to a particular payment plan
		 * @method subscribe
		 *  @param {String} payments can be "authnet" or "stripe"
		 *  @param {String} planPublisherId the publisher of the subscription plan's stream
		 *  @param {String} planStreamName the name of the subscription plan's stream
		 *  @param {String} token the token obtained from the hosted forms
		 *  @param {Function} [callback] The function to call, receives (err, paymentSlot)
		 */
		subscribe: function (payments, options, callback) {
			var fields = {
				payments: payments,
				planPublisherId: options.planPublisherId,
				planStreamName: options.planStreamName,
				token: options.token
			};
			Q.req('Awards/subscription', 'payment', function (err, response) {
				var msg;
				if (msg = Q.firstErrorMessage(err, response)) {
					return callback(msg, null);
				}
				Q.handle(callback, this, [null, response.slots.payment]);
			}, {
				method: 'post',
				fields: fields
			});
		}
	}
	
	/**
	 * @class Awards.Payments
	 */
};

Awards.Subscriptions.authnet.options = {
	planPublisherId: Users.communityId,
	planStreamName: "Awards/plan/main"
};

Awards.Subscriptions.stripe.options = {
	planPublisherId: Users.communityId,
	planStreamName: "Awards/plan/main",
	javascript: 'https://checkout.stripe.com/checkout.js',
	name: Users.communityName,
};

(function(Q, Awards, Streams, $) {

	Q.Tool.define({
		"Awards/subscription"           : "plugins/Awards/js/tools/subscription.js"
	});


})(Q, Q.plugins.Awards, Q.plugins.Streams, jQuery);
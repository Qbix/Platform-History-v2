(function (Q, Assets, Streams, $) {

	/**
	 * Various front-end functionality dealing with awards, badges, credits, etc.
	 * @class Assets
	 */

	var Users = Q.Users;
	Streams = Q.Streams;
	Assets = Q.Assets = Q.plugins.Assets = {

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
			},
			/**
			 * Buy credits
			 * @method buy
			 *  @param {object} options
			 *  @param {number} [options.amount=100] Default amount of credits to buy.
			 *  @param {string} [options.currency=USD] Currency ISO 4217 code (USD, EUR etc)
			 *  @param {string} [options.missing=false] Whether to show text about credits missing.
			 *  @param {function} [options.onSuccess] Callback to run when payment has completed successfully.
			 *  @param {function} [options.onFailure] Callback to run when payment failed.
			 */
			buy: function (options) {
				options = Q.extend({
					amount: 100,
					currency: 'USD',
					missing: false
				}, options);
				var title = Assets.texts.credits.BuyCredits;
				var YouMissingCredits = null;
				var templateName = 'Assets/credits/buy';
				if (options.missing) {
					templateName = 'Assets/credits/missing';
					title = Assets.texts.credits.MissingCredits;
					YouMissingCredits = Assets.texts.credits.YouMissingCredits.interpolate({amount: options.amount});
				}

				var bonuses = [];
				Q.each(Q.getObject("credits.bonus.bought", Assets), function (credits, bonus) {
					bonuses.push(Assets.texts.credits.BuyBonus.interpolate({amount: "<span class='credits'>" + credits + "</span>", bonus: "<span class='bonus'>" + bonus + "</span>"}));
				});

				Q.Template.set('Assets/credits/missing',
					'<div class="Assets_credits_buy_missing">{{YouMissingCredits}}</div>' +
					'<input type="hidden" name="amount" value="{{amount}}">' +
					'<button class="Q_button" name="buy">{{texts.PurchaseCredits}}</button>'
				);
				Q.Template.set('Assets/credits/buy',
			'{{#each bonuses}}' +
					'	<div class="Assets_credits_bonus">{{this}}</div>' +
					'{{/each}}' +
					'<div class="Assets_credits_buy"><input name="amount" value="{{amount}}"> {{texts.Credits}}</div>' +
					'<button class="Q_button" name="buy">{{texts.PurchaseCredits}}</button>'
				);

				// indicator of payment process started
				var paymentStarted = false;

				// load payment lib and set required params
				Assets.Payments.load();

				Q.Dialogs.push({
					title: title,
					className: "Assets_credits_buy",
					template: {
						name: templateName,
						fields: {
							amount: options.amount,
							YouMissingCredits: YouMissingCredits,
							bonuses: bonuses,
							texts: Assets.texts.credits
						}
					},
					onActivate: function (dialog) {
						$("button[name=buy]", dialog).on(Q.Pointer.fastclick, function () {
							paymentStarted = true;
							var credits = parseInt($("input[name=amount]", dialog).val());
							if (!credits) {
								return Q.alert(Assets.texts.credits.ErrorInvalidAmount);
							}

							var currency = options.currency;
							var rate = Q.getObject(['exchange', currency], Assets.Credits);
							if (!rate) {
								return Q.alert(Assets.texts.credits.ErrorInvalidCurrency.interpolate({currency: currency}));
							}
							
							// apply currency rate
							var amount = Math.ceil(credits/rate);

							Q.Dialogs.pop();

							Assets.Payments.stripe({
								amount: amount,
								currency: currency,
								description: Assets.texts.credits.BuyAmountCredits.interpolate({amount: credits}),
								onSuccess: options.onSuccess,
								onFailure: options.onFailure
							}, function(err, data) {
								if (err) {
									return Q.handle(options.onFailure, null, [err]);
								}
								return Q.handle(options.onSuccess, null, [data]);
							});
						});
					},
					onClose: function () {
						if (!paymentStarted) {
							Q.handle(options.onFailure);
						}
					}
				});
			},
			/**
			 * Make a payment to some user in the system.
			 * Pay with credits if you have enough of them, otherwise you are prompted to purchase the remained first.
			 * @method pay
			 *  @param {object} options
			 *  @param {number} options.amount
			 *  @param {string} options.currency Currency ISO 4217 code (USD, EUR etc)
			 *  @param {Streams_Stream} [options.userId] The id of user who would receive credits
			 *  @param {Stream} [options.reason] payment reason
			 *  @param {Streams_Stream} [options.toStream] Valuable stream object for which the payment is being made.
			 *    It also can be object with keys "publisherId" and "streamName"
			 *  @param {Array} [options.items] an array of objects, each with "publisherId", "streamName" and "amount"
			 *  @param {function} [options.onSuccess] Callback to run when payment has completed successfully.
			 *  @param {function} [options.onFailure] Callback to run when payment failed.
			 */
			pay: function (options) {
				var stream = options.toStream;
				if (Streams.isStream(stream)) {
					options.toStream = {
						publisherId: stream.fields.publisherId,
						streamName: stream.fields.name
					};
				}

				// check payment details consistent
				if (options.items) {
					var checkSum = 0;
					Q.each(options.items, function (i, item) {
						checkSum += item.amount;
					});
					if (parseFloat(options.amount) !== parseFloat(checkSum)) {
						throw new Q.Exception("Assets.Credits.pay: amount not equal to items total");
					}
				}

				Q.req("Assets/credits", ['status', 'details'], function (err, response) {
					var msg = Q.firstErrorMessage(err, response && response.errors);
					if (msg) {
						Q.handle(options.onFailure);
						return Q.alert(msg);
					}

					if (!response.slots.status) {
						var details = response.slots.details;

						Assets.Credits.buy({
							missing: true,
							amount: details.needCredits,
							onSuccess: function () {
								Assets.Credits.pay(options);
							},
							onFailure: options.onFailure
						});
						return;
					}

					Q.handle(options.onSuccess, null, response.slots);
				}, {
					method: 'post',
					fields: {
						amount: options.amount,
						currency: options.currency,
						toUserId: options.userId,
						toStream: options.toStream,
						reason: options.reason,
						items: options.items
					}
				});
			},
			/**
			 * Convert from currency to credits
			 * @method convertToCredits
			 * @static
			 *  @param {Number} amount
			 *  @param {String} currency
			 */
			convertToCredits: function (amount, currency) {
				var exchange = Q.getObject(["exchange", currency], Assets.Credits);

				if (!exchange) {
					return null;
				}

				return Math.ceil(parseFloat(amount) * parseFloat(exchange));
			}
		},

		onPaymentSuccess: new Q.Event(),

		onBeforeNotice: new Q.Event(),
		onCreditsChanged: new Q.Event(),

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
					Assets.texts.subscriptions,
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
						onActivate: {
							"Assets": function () {
								$form.submit();
							}
						},
						onClose: {
							"Assets": function () {
								// TODO: don't do the subscription if payment info wasn't added
								var message = o.confirm.message.interpolate({
									title: plan.fields.title,
									name: o.name
								});
								Q.extend(o, Assets.texts.subscriptions.confirm);
								Q.confirm(message, function (result) {
									if (!result) return;
									Assets.Subscriptions.subscribe('authnet', o, callback);
								}, o);
							}
						}
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
					confirm: Assets.texts.subscriptions.confirm
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
							amount: plan.getAttribute('amount')
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
			 * In order to use Assets.Payments methods need to call method Assets.Payments.load()
			 * This method load needed libs and make some needed actions when libs loaded
			 * @method checkLoaded
			 * @static
			 */
			checkLoaded: function () {
				if (Q.getObject("Payments.loaded", Assets)) {
					return true;
				}

				throw new Q.Error("In order to use Assets.Payments methods need to call method Assets.Payments.load()");
			},
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
				Assets.Payments.checkLoaded();

				var o = Q.extend({},
					Assets.texts.payments,
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
					onActivate: {
						"Assets": function () {
							$form.submit();
						}
					},
					onClose: {
						"Assets": function () {
							// TODO: don't do the payment if info wasn't added
							Assets.Currencies.load(function () {
								var message = o.confirm.message.interpolate({
									amount: o.amount,
									name: o.name,
									symbol: Assets.Currencies.symbols.USD
								});
								Q.extend(o, Assets.texts.payments.confirm);
								Q.confirm(message, function (result) {
									if (!result) return;
									Assets.Payments.pay('authnet', o, callback);
								}, o);
							});
						}
					}
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
			 *  @param {String} [options.name=Users::communityName()] The name of the organization the user will be paying
			 *  @param {String} [options.email] Email of user paying. Logged in user email by default.
			 *  @param {String} [options.image] The url pointing to a square image of your brand or product. The recommended minimum size is 128x128px.
			 *  @param {String} [options.description] Operation code which detailed text can be fetch from lang json (Assets/content/payments).
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
				Assets.Payments.checkLoaded();

				options = Q.extend({},
					Assets.texts.payments,
					Assets.Payments.stripe.options,
					options
				);
				if (!options.amount) {
					err = _error("Assets.Payments.stripe: amount is required");
					return Q.handle(callback, null, [err]);
				}

				if (!Users.loggedInUser) {
					return Q.Users.login({
						onSuccess: function () {
							Q.handle(window.location.href);
						}
					});
				}

				options.email = options.email || Q.getObject("loggedInUser.email", Users);
				options.userId = options.userId || Q.Users.loggedInUserId();
				options.currency = (options.currency || 'USD').toUpperCase();

				if (!Q.info.isCordova && Q.info.platform === 'ios' && Q.info.browser.name === 'safari') { // It's considered that ApplePay is supported in IOS Safari
					Assets.Payments.applePayStripe(options, function (err, res) {
						if (err && (err.code === 21)) { // code 21 means that this type of payment is not supported in some reason
							Assets.Payments.standardStripe(options, callback);
							return;
						}

						Q.handle(callback, null, [err, res]);
					});
				} else if (Q.info.isCordova && window.ApplePay) { // check for payment request
					Assets.Payments.applePayCordova(options, function (err, res) {
						if (err) {
							return Assets.Payments.standardStripe(options, callback);
						}
						Q.handle(callback, null, [err, res]);
					});
				} else if (!Q.info.isCordova && window.PaymentRequest) {
					// check for payment request
					Assets.Payments.paymentRequestStripe(options, function (err, res) {
						if (err && (err.code === 9)) {
							Assets.Payments.standardStripe(options, callback);
							return;
						}
						Q.handle(callback, null, [err, res]);
					});
				} else {
					if (Q.info.isCordova && (window.location.href.indexOf('browsertab=yes') === -1)) {
						_redirectToBrowserTab(options);
					} else {
						Assets.Payments.standardStripe(options, callback);
					}
				}
			},
			/**
			 * Load js libs and do some needed actions.
			 * @method load
			 * @static
			 *  @param {Function} [callback]
			 */
			load: Q.getter(function (callback) {
				Q.addScript(Assets.Payments.stripe.jsLibrary, function () {
					Stripe.setPublishableKey(Assets.Payments.stripe.publishableKey);
					Stripe.applePay.checkAvailability(function (available) {
						Assets.Payments.stripe.applePayAvailable = available;
						Assets.Payments.loaded = true;
						Q.handle(callback);
					});
				});
			}),
			/**
			 * This method use googlePay
			 * and then charge that payment profile.
			 * @method googlepay
			 * @static
			 *  @param {Object} [options] Any additional options to pass to the stripe checkout config, and also:
			 *  @param {Number} options.amount the amount to pay.
			 *  @param {String} [options.currency="usd"] the currency to pay in.
			 *  @param {Function} [callback]
			 */
			googlepay: function (options, callback) {
				Assets.Payments.checkLoaded();

				var googlePayConfig = Q.getObject("Q.Assets.Payments.googlePay");
				if (!googlePayConfig) {
					return _redirectToBrowserTab(options);
				}

				sgap.setKey(Assets.Payments.stripe.publishableKey).then(function () {
					sgap.isReadyToPay()
				}).then(function () {
					sgap.requestPayment(options.amount, options.currency).then(function (token) {
						options.token = token;
						Assets.Payments.pay('stripe', options, callback);
					});
				}).catch(function (err) {
					Q.handle(callback, this, [err])
				});
			},
			/**
			 * This method use to pay on iOS cordova. Using cordova-plugin-applepay inside.
			 * @method applePayCordova
			 * @static
			 *  @param {Object} [options] Any additional options to pass to the stripe checkout config, and also:
			 *  @param {String} options.email users email.
			 *  @param {Float} options.amount the amount to pay.
			 *  @param {String} options.description Payment description.
			 *  @param {Boolean} options.shippingAddress Whether shipping address required.
			 *  @param {string} [options.shippingType=service] Can be shipping, delivery, store, service
			 *  @param {String} [options.currency="usd"] the currency to pay in.
			 *  @param {Function} [callback]
			 */
			applePayCordova: function (options, callback) {
				Assets.Payments.checkLoaded();

				var merchantIdentifier = Q.getObject("Assets.Payments.applePay.merchantIdentifier", Q);
				if (!merchantIdentifier) {
					return _redirectToBrowserTab(options);
				}

				var supportedNetworks = ['amex', 'discover', 'masterCard', 'visa'];
				var merchantCapabilities = ['3ds', 'debit', 'credit'];

				ApplePay.canMakePayments({
					// supportedNetworks should not be an empty array. The supported networks currently are: amex, discover, masterCard, visa
					supportedNetworks: supportedNetworks,

					// when merchantCapabilities is passed in, supportedNetworks must also be provided. Valid values: 3ds, debit, credit, emv
					merchantCapabilities: merchantCapabilities
				}).then((message) => {
					ApplePay.makePaymentRequest({
						email: options.email,
						items: [{
							label: options.description,
							amount: options.amount
						}],
						supportedNetworks: supportedNetworks,
						merchantCapabilities: merchantCapabilities,
						merchantIdentifier: merchantIdentifier,
						currencyCode: options.currency,
						countryCode: 'US',
						billingAddressRequirement: options.shippingAddress ? 'all' : 'none',
						shippingAddressRequirement: options.shippingAddress ? 'all' : 'none',
						shippingType: options.shippingType || 'service'
					}).then((paymentResponse) => {
						paymentResponse.id = JSON.parse(atob(paymentResponse.paymentData)); //paymentResponse.paymentData - base64 encoded token
						options.token = paymentResponse;
						Assets.Payments.pay('stripe', options, function (err) {
							if (err) {
								ApplePay.completeLastTransaction('failure');
								Q.handle(callback, null, [err]);
								return console.error(err);
							}
							ApplePay.completeLastTransaction('success');
							Q.handle(callback, null, [null, true]);
						});
					});
				}).catch((err) => {
					Q.handle(callback, null, [err]);
					ApplePay.completeLastTransaction('failure');
				});
			},
			/**
			 * This method use to pay on iOS browsers.
			 * @method applePayStripe
			 * @static
			 *  @param {Object} [options] Any additional options to pass to the stripe checkout config, and also:
			 *  @param {String} options.email users email.
			 *  @param {Float} options.amount the amount to pay.
			 *  @param {String} options.description Payment description.
			 *  @param {Boolean} options.shippingAddress Whether shipping address required.
			 *  @param {string} [options.shippingType=service] Can be shipping, delivery, store, service
			 *  @param {String} [options.currency="usd"] the currency to pay in.
			 *  @param {Function} [callback]
			 */
			applePayStripe: function (options, callback) {
				Assets.Payments.checkLoaded();

				if (!Q.getObject("Payments.stripe.applePayAvailable", Assets)) {
					return callback(_error('Apple pay is not available', 21));
				}
				var request = {
					email: options.email,
					currencyCode: options.currency,
					countryCode: options.countryCode ? options.countryCode : 'US',
					total: {
						label: options.description,
						amount: options.amount
					}
				};

				// add shipping option
				if (options.shippingAddress) {
					request.requiredBillingContactFields = true;
					request.requiredShippingContactFields = true;
					request.shippingType = options.shippingType || 'shipping';
				}

				var session = Stripe && Stripe.applePay.buildSession(request,
					function (result, completion) {
						options.token = result.token;
						Assets.Payments.pay('stripe', options, function (err) {
							if (err) {
								completion(ApplePaySession.STATUS_FAILURE);
								callback(err);
							} else {
								completion(ApplePaySession.STATUS_SUCCESS);
								callback(null, true);
							}
						});
					}, function (err) {
						callback(err);
					});
				session.oncancel = function () {
					callback(_error("Request cancelled", 20));
				};
				session.begin();
			},
			/**
			 * This method use to pay on browsers with object window.PaymentRequest
			 * @method paymentRequestStripe
			 * @static
			 *  @param {Object} [options] Any additional options to pass to the stripe checkout config, and also:
			 *  @param {String} options.email users email.
			 *  @param {Float} options.amount the amount to pay.
			 *  @param {String} options.description Payment description.
			 *  @param {Boolean} options.shippingAddress Whether shipping address required.
			 *  @param {string} [options.shippingType=service] Can be shipping, delivery, store, service
			 *  @param {String} [options.currency="usd"] the currency to pay in.
			 *  @param {Function} [callback]
			 */
			paymentRequestStripe: function (options, callback) {
				Assets.Payments.checkLoaded();

				var currency = options.currency || 'USD';

				var supportedInstruments = [
					{
						supportedMethods: 'basic-card',
						data: {
							supportedNetworks: ['amex', 'discover', 'mastercard', 'visa'],
							supportedTypes: ['credit']
						}
					}
				];
				if (Assets.Payments.googlePay) {
					supportedInstruments.push({
						supportedMethods: 'https://google.com/pay',
						data: {
							environment: Assets.Payments.googlePay.environment,
							apiVersion: 2,
							apiVersionMinor: 0,
							merchantInfo: {
								// A merchant ID is available after approval by Google.
								// @see {@link https://developers.google.com/pay/api/web/guides/test-and-deploy/integration-checklist}
								//merchantId: Assets.Payments.googlePay.merchantId,
								//merchantName: Assets.Payments.googlePay.merchantName
								merchantName: 'Example Merchant'
							},
							allowedPaymentMethods: [{
								type: 'CARD',
								parameters: {
									allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
									allowedCardNetworks: ["AMEX", "DISCOVER", "JCB", "MASTERCARD", "VISA"]
								},
								tokenizationSpecification: {
									type: 'PAYMENT_GATEWAY',
									// Check with your payment gateway on the parameters to pass.
									// @see {@link https://developers.google.com/pay/api/web/reference/object#Gateway}
									parameters: {
										//'gateway': Assets.Payments.googlePay.gateway,
										//'gatewayMerchantId': Assets.Payments.stripe.publishableKey
										'gateway': 'example',
										'gatewayMerchantId': 'exampleGatewayMerchantId'
									}
								}
							}],
							transactionInfo: {
								totalPriceStatus: "FINAL",
								totalPrice: options.amount.toString(10),
								currencyCode: currency
							}
						}
					})
				}
				var globalShippingOptions = [
					{
						id: 'economy',
						label: 'Economy Shipping (5-7 Days)',
						amount: {
							currency: 'USD',
							value: '0',
						},
					}, {
						id: 'express',
						label: 'Express Shipping (2-3 Days)',
						amount: {
							currency: 'USD',
							value: '5',
						},
					}, {
						id: 'next-day',
						label: 'Next Day Delivery',
						amount: {
							currency: 'USD',
							value: '12',
						},
					}
				];
				var details = {
					email: options.email,
					total: {
						label: options.description ? options.description : 'Total due',
						amount: {currency: currency, value: options.amount}
					},
					shippingOptions: globalShippingOptions
				};
				var paymentRequest = new PaymentRequest(supportedInstruments, details, {
					requestPayerEmail: true,
					requestShipping: options.shippingAddress
				});

				paymentRequest.addEventListener('shippingaddresschange', (event) => {
					const prInstance = event.target;
					event.updateWith(details);
				});
				paymentRequest.addEventListener('shippingoptionchange', (event) => {
					// Step 1: Get the payment request object.
					const prInstance = event.target;

					// Step 2: Get the ID of the selected shipping option.
					const selectedId = prInstance.shippingOption;

					// Step 3: Mark selected option
					globalShippingOptions.forEach((option) => {
						option.selected = option.id === selectedId;
					});

					details.shippingOptions = globalShippingOptions;
					event.updateWith(details);
				});
				paymentRequest.show().then(function (result) {
					var promise;
					if (result.methodName === 'basic-card') {
						promise = new Q.Promise(function (resolve, reject) {
							Stripe.setPublishableKey(Assets.Payments.stripe.publishableKey);
							Stripe.card.createToken({
								number: result.details.cardNumber,
								cvc: result.details.cardSecurityCode,
								exp_month: result.details.expiryMonth,
								exp_year: result.details.expiryYear
							}, function (res, token) {
								if (res !== 200) {
									return reject({result: result, err: new Error('Stripe gateway error')});
								}
								options.token = token;
								return Assets.Payments.pay('stripe', options, function (err) {
									if (err) {
										return reject({result: result, err: err});
									}
									return resolve(result);
								});
							});
						});
					} else if (result.methodName === 'https://google.com/pay') {
						promise = new Q.Promise(function (resolve, reject) {
							options.token = Q.getObject("details.paymentMethodData.tokenizationData", result);
							return Assets.Payments.pay('stripe', options, function (err) {
								if (err) {
									return reject({result: result, err: err});
								}
								return resolve(result);
							});
						});
					}
					return promise ? promise : Q.Promise.reject({result: result, err: new Error('Unsupported method')});
				}).then(function (result) {
					result.complete('success');
					callback(null, result);
				}).catch(function (err) {
					if (Q.getObject("result.complete", err)) {
						return err.result.complete('fail');
					}
					callback(err);
				});
			},
			/**
			 * This method use to pay with standard stripe payment
			 * @method standardStripe
			 * @static
			 *  @param {Object} [options] Any additional options to pass to the stripe checkout config, and also:
			 *  @param {String} options.email payer email. Logged user email by default.
			 *  @param {Float} options.amount the amount to pay.
			 *  @param {String} options.description Payment description.
			 *  @param {Boolean} [options.shippingAddress=false] Whether shipping address required.
			 *  @param {string} options.name
			 *  @param {Boolean} [options.allowRememberMe=true] Whether shipping address required.
			 *  @param {string} [options.shippingType=service] Can be shipping, delivery, store, service
			 *  @param {String} [options.currency="usd"] the currency to pay in.
			 *  @param {Function} [callback]
			 */
			standardStripe: function (options, callback) {
				Assets.Payments.checkLoaded();

				Q.addScript(Assets.Payments.stripe.options.javascript, function () {
					var token_triggered = false;
					StripeCheckout.configure({
						key: Assets.Payments.stripe.publishableKey,
						name: options.name,
						email: options.email,
						description: options.description,
						amount: options.amount * 100,
						allowRememberMe: options.allowRememberMe,
						shippingAddress: options.shippingAddress,
						billingAddress: options.shippingAddress,
						closed: function() {
							if (!token_triggered) {
								callback(_error("Request cancelled", 20));
							}
						},
						token: function (token) {
							token_triggered = true;
							options.token = token;
							Assets.Payments.pay('stripe', options, callback);
						}
					}).open();
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
			 *  @param {String} [options.userId] logged in userId, needed for cordova ios / android payments
			 *  @param {Function} [callback] The function to call, receives (err, paymentSlot)
			 */
			pay: function (payments, options, callback) {
				Assets.Payments.checkLoaded();

				var fields = {
					payments: payments,
					publisherId: options.publisherId,
					streamName: options.streamName,
					token: options.token,
					amount: options.amount,
					currency: options.currency,
					description: options.description,
					userId: options.userId

				};
				Q.req('Assets/payment', 'charge', function (err, response) {
					var msg;
					if (msg = Q.firstErrorMessage(err, response && response.errors)) {
						return callback(msg, null);
					}
					Q.handle(callback, this, [null, response.slots.charge]);
					Assets.onPaymentSuccess.handle(response);
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
			 * Use this to load currency data into Q.Assets.Currencies.symbols and Q.Assets.Currencies.names
			 * @method load
			 * @static
			 * @param {Function} callback Once the callback is called,
			 *   Q.Assets.Currencies.symbols and Q.Assets.Currencies.names is accessible
			 */
			load: Q.getter(function (callback) {
				Q.req('Assets/currency', 'load', function (err, data) {
					var msg = Q.firstErrorMessage(err, data && data.errors);
					if (msg) {
						return alert(msg);
					}

					Assets.Currencies.symbols = data.slots.load.symbols;
					Assets.Currencies.names = data.slots.load.names;

					Q.handle(callback, Assets.Currencies, [Assets.Currencies.symbols, Assets.Currencies.names]);
				});
			}),
			/**
			 * Use this to get symbol for currency
			 * @method getSymbol
			 * @static
			 * @param {String} currency Currency in ISO 4217 (USD, EUR,...)
			 * @param {Function} callback
			 */
			getSymbol: function (currency, callback) {
				Assets.Currencies.load(function (symbols, names) {
					Q.handle(callback, null, [Q.getObject(currency, symbols) || currency]);
				});
			}
		},

		/**
		 * Create batcher
		 * @method batchFunction
		 */
		butchFunctions: {},
		batchFunction: function Assets_batchFunction() {
			return Q.batcher.factory(this.butchFunctions, Q.info.baseUrl,"/action.php/Assets/batch", "batch", "batch");
		},

		NFT: {
			/**
			 * For dealing with NFTs on web3 (EVM-compatible) blockchains
			 * @class Assets.NFT.Web3
			 */
			Web3: {
				onTokenRemovedFromSale: new Q.Event(),
				onTokenAddedToSale: new Q.Event(),
				onTransfer: new Q.Event(),
				onTransferAuthorship: new Q.Event(),
				onInstanceCreated: new Q.Event(),
				onInstanceOwnershipTransferred: new Q.Event(),
				_onContractUpdated: {},
				_onFactoryUpdated: {},
				onContractUpdated: Q.Event.factory(this._onContractUpdated, [""]),
				onFactoryUpdated: Q.Event.factory(this._onFactoryUpdated, [""]),
				contracts: [],
				factories: [],

				/**
				 * Check web3 provider (MetaMask) connected, and switch to valid chain
				 * @method checkProvider
				 * @param {Object} chain
				 * @param {function} callback
				 * @param {object} [options]
				 * @param {object} [options.mode="contract"] - What to create "contract" or "factory"
				 */
				checkProvider: function (chain, callback, options) {
					var mode = Q.getObject("mode", options) || "contract";
					Q.Users.Web3.connect(function (err, provider) {
						if (err) {
							Q.handle(callback, null, [err]);
						}

						var _process = function () {
							if (mode === "contract") {
								Assets.NFT.Web3.getContract(chain, callback, options);
							} else if (mode === "factory") {
								Assets.NFT.Web3.getFactory(chain, callback, options);
							} else {
								throw new Q.Exception("mode " + mode + " is not supported in Assets.NFT.Web3.checkProvider");
							}
						};
						// check valid chain selected
						if (window.ethereum.chainId === chain.chainId) {
							_process();
						} else { // if no, lead to switch chain
							Q.Users.Web3.setChain(chain, function () {
								// after chain switched need update contract
								Assets.NFT.Web3.contracts[chain.chainId] = null;
								Assets.NFT.Web3.factories[chain.chainId] = null;

								_process();
							}, function (err) {
								Q.handle(callback, null, [err]);
							});
						}
					});
				},
				/**
				 * Set the info for a series
				 * @method setSeriesInfo
				 * @param {String} contractAddress
				 * @param {String} seriesId
				 * @param {Object} info Only info.price is really required
				 * @param {String} info.price The price (in currency) that minting the NFTs would cost.
				 * @param {String} info.fixedPointPrice The fixed-point large integer price (in currency) that minting the NFTs would cost.
				 * @param {String} [info.currency] Set the ERC20 contract address, otherwise price would be in the native coin (ETH, BNB, MATIC, etc.)
				 * @param {String} [info.authorAddress] Give rights to this address to mintAndDistribute
				 * @param {String} [info.limit] maximum number that can be minted
				 * @param {String} [info.onSaleUntil] timestamp in seconds since Unix epoch
				 * @param {String} [info.duration] can be used instead of onSaleUntil
				 * @param {Object} [info.commission] information about commissions
				 * @param {Number} [info.commission.fraction] fraction between 0 and 1
				 * @param {Address} [info.commission.address] where to send commissions to
				 * @param {String} [info.baseURI] to override global baseURI, if necessary
				 * @param {String} [info.suffix] to override global suffix, if necessary
				 * @return {Promise} promise from ethers.Contract call transaction
				 */
				setSeriesInfo: function (contractAddress, seriesId, info, callback) {
					if (typeof contractAddress !== 'string'
					&& !(contractAddress instanceof String)) {
						throw new Q.Error("contractAddress must be a string");
					}
					if (seriesId.toString().substr(0, 2) !== '0x') {
						throw new Q.Error("seriesId must be a string starting with 0x");
					}
					var FRACTION = 100000;
					info = info || {};
					var authorAddress = info.authorAddress || Q.Users.Web3.getSelectedXid();
					var limit = info.limit || 0;
					var onSaleUntil = info.onSaleUntil
						|| (Math.floor(Date.now()/1000) + (info.duration || 60*60*24*30));
					var currency = info.currency || "0x0000000000000000000000000000000000000000";
					var price = info.fixedPointPrice
						? String(info.fixedPointPrice)
						: ethers.utils.parseEther(String(info.price));
					info.commission = info.commission || {};
					var commissionFraction = Math.floor((info.commission.fraction || 0) * FRACTION);
					var commissionAddress = info.commission.address || authorAddress;
					var baseURI = info.baseURI || ''; // default
					var suffix = info.suffix || ''; // default
					return Q.Users.Web3.getContract(contractAddress)
					.then(function (contract) {
						return contract.setSeriesInfo(seriesId, 
							[authorAddress, limit, 
								[onSaleUntil, currency, price],
								[commissionFraction, commissionAddress], baseURI, suffix
							]
						);
					}).catch(function (err) {
						Q.alert(err);
					});
				},
				/**
				 * Get or create factory
				 * @method getFactory
				 * @params {Object} chain
				 * @params {function} callback
				 * @params {object} [options]
				 * @params {boolean} [options.checkWeb3=false] If true, check wallet before create factory
				 */
				getFactory: function (chain, callback, options) {
					if (Q.isEmpty(window.ethereum)) {
						return Q.handle(callback, null, ["Ethereum provider not found", null]);
					}

					// if chain is a chainId, convert to chain
					if (Q.typeOf(chain) === "string") {
						chain = Assets.NFT.Web3.chains[chain];
					}

					var _subMethod = function (factory) {
						// if option checkWeb3 defined, check if web3 wallet connected
						if (Q.getObject("checkWeb3", options) === true) {
							return Q.Users.Web3.connect(function (err, provider) {
								Q.handle(callback, null, [err, factory]);
							});
						}

						// else just return factory
						Q.handle(callback, null, [null, factory]);
					};

					var factory = Assets.NFT.Web3.factories[chain.chainId];

					// if factory exists, return one
					if (factory) {
						return _subMethod(factory);
					}

					var address = chain.factory;

					// loading ABI json
					$.getJSON(Q.url("{{baseUrl}}/ABI/" + address + ".json"), function (ABI) {
						var provider = new ethers.providers.Web3Provider(window.ethereum);
						factory = new ethers.Contract(address, ABI, provider.getSigner());

						factory.on("InstanceCreated", function (name, symbol, instance, length) {
							Q.handle(Assets.NFT.Web3.onInstanceCreated, null, [name, symbol, instance, length])
						});
						factory.on("OwnershipTransferred", function (previousOwner, newOwner) {
							Q.handle(Assets.NFT.Web3.onInstanceOwnershipTransferred, null, [previousOwner, newOwner]);
						});

						Assets.NFT.Web3.factories[chain.chainId] = factory;

						Q.handle(Assets.NFT.Web3.onFactoryUpdated(chain.chainId), null, [factory]);

						return _subMethod(factory);
					});
				},
				/**
				 * Create contract for user
				 * @method getContract
				 * @params {Object} chain
				 * @params {function} callback
				 * @params {object} [options]
				 * @params {boolean} [options.checkWeb3=false] If true, check wallet before create contract
				 */
				getContract: function (chain, callback, options) {
					if (Q.isEmpty(window.ethereum)) {
						return Q.handle(callback, null, ["Ethereum provider not found", null]);
					}

					// if chain is a chainId, convert to chain
					if (Q.typeOf(chain) === "string") {
						chain = Assets.NFT.Web3.chains[chain];
					}

					var _subMethod = function (contract) {
						// if option checkWeb3 defined, check if web3 wallet connected
						if (Q.getObject("checkWeb3", options) === true) {
							return Q.Users.Web3.connect(function (err, provider) {
								Q.handle(callback, null, [err, contract]);
							});
						}

						// else just return contract
						Q.handle(callback, null, [null, contract]);
					};

					var contract = Assets.NFT.Web3.contracts[chain.chainId];

					// if contract exists, return one
					if (contract) {
						return _subMethod(contract);
					}

					var address = chain.contract;

					// loading ABI json
					$.getJSON(Q.url("{{baseUrl}}/ABI/" + address + ".json"), function (ABI) {
						var provider = new ethers.providers.Web3Provider(window.ethereum);
						contract = new ethers.Contract(address, ABI, provider.getSigner());

						contract.on("TokenRemovedFromSale", function (tokenId) {
							Q.handle(Assets.NFT.Web3.onTokenRemovedFromSale, null, [tokenId]);
						});
						contract.on("TokenAddedToSale", function (tokenId, amount, consumeToken) {
							Q.handle(Assets.NFT.Web3.onTokenAddedToSale, null, [tokenId, amount, consumeToken]);
						});
						contract.on("Transfer", function (oldAddress, newAddress, token) {
							Q.handle(Assets.NFT.Web3.onTransfer, null, [oldAddress, newAddress, token]);
						});
						contract.on("TransferAuthorship", function (oldAddress, newAddress, token) {
							Q.handle(Assets.NFT.Web3.onTransferAuthorship, null, [oldAddress, newAddress, token]);
						});

						Assets.NFT.Web3.contracts[chain.chainId] = contract;

						Q.handle(Assets.NFT.Web3.onContractUpdated(chain.chainId), null, [contract]);

						return _subMethod(contract);
					});
				},
				/**
				 * Get amount of tokens by wallet and chain
				 * @method balanceOf
				 * @params {String} tokenId NFT tokenId
				 * @params {Object} chain
				 * @params {function} callback
				 */
				balanceOf: function (wallet, chain, callback) {
					Assets.NFT.Web3.getContract(chain, function (err, contract) {
						if (err) {
							Q.handle(callback, null, [err]);
						}

						contract.balanceOf(wallet).then(function (tokensAmount) {
							Q.handle(callback, null, [null, tokensAmount]);
						}, function (err) {
							Q.handle(callback, null, [err.reason]);
						});
					});
				},
				/**
				 * Get author of NFT by tokenId and chain.
				 * If wrong chain selected, suggest to switch chain.
				 * @method getAuthor
				 * @params {String} tokenId NFT tokenId
				 * @params {Object} chain
				 * @params {function} callback
				 */
				getAuthor: function (tokenId, chain, callback) {
					Assets.NFT.Web3.getContract(chain, function (err, contract) {
						if (err) {
							Q.handle(callback, null, [err]);
						}

						contract.authorOf(tokenId).then(function (address) {
							Q.handle(callback, null, [null, address, contract]);
						}, function (err) {
							Q.handle(callback, null, [err.reason]);
						});
					});
				},
				/**
				 * Get owner of NFT by tokenId and chain.
				 * If wrong chain selected, suggest to switch chain.
				 * @method getOwner
				 * @params {String} tokenId NFT tokenId
				 * @params {Object} chain
				 * @params {function} callback
				 */
				getOwner: function (tokenId, chain, callback) {
					Assets.NFT.Web3.getContract(chain, function (err, contract) {
						if (err) {
							Q.handle(callback, null, [err]);
						}

						contract.ownerOf(tokenId).then(function (address) {
							Q.handle(callback, null, [null, address, contract]);
						}, function (err) {
							Q.handle(callback, null, [err.reason]);
						});
					});
				},
				/**
				 * Get commissionInfo of NFT by tokenId and chain.
				 * If wrong chain selected, suggest to switch chain.
				 * @method commissionInfo
				 * @params {String} tokenId NFT tokenId
				 * @params {Object} chain
				 * @params {function} callback
				 */
				commissionInfo: function (tokenId, chain, callback) {
					Assets.NFT.Web3.getContract(chain, function (err, contract) {
						if (err) {
							Q.handle(callback, null, [err]);
						}

						contract.getCommission(tokenId).then(function (info) {
							Q.handle(callback, null, [null, info, contract]);
						}, function (err) {
							Q.handle(callback, null, [err.reason]);
						});
					});
				},
				/**
				 * Get saleInfo of NFT by tokenId and chain.
				 * If wrong chain selected, suggest to switch chain.
				 * @method saleInfo
				 * @params {String} tokenId NFT tokenId
				 * @params {Object} chain
				 * @params {function} callback
				 */
				saleInfo: function (tokenId, chain, callback) {
					Assets.NFT.Web3.getContract(chain, function (err, contract) {
						if (err) {
							Q.handle(callback, null, [err]);
						}

						contract.saleInfo(tokenId).then(function (info) {
							var price = Q.getObject("1._hex", info);
							Q.handle(callback, null, [null, {
								price: price,
								priceDecimal: parseInt((price || 0), 16)/1e18,
								currencyToken: Q.getObject("0", info) || null,
								isSale: !!Q.getObject("2", info)
							}, contract]);
						}, function (err) {
							Q.handle(callback, null, [err.reason]);
						});
					});
				},
				/**
				 * Transfer NFT from one wallet to another.
				 * @method transferFrom
				 * @params {String} tokenId NFT tokenId
				 * @params {Object} chain
				 * @params {String} newAddress wallet address to transfer to
				 * @params {function} callback
				 */
				transferFrom: function (tokenId, chain, newAddress, callback) {
					Q.handle(Assets.NFT.Web3.getOwner, this, [tokenId, chain, function (err, owner, contract) {
						if (err) {
							return Q.alert(err);
						}

						contract.transferFrom(owner, newAddress, tokenId).then(function (info) {
							Q.handle(callback, null, [null, info]);
						}, function (err) {
							Q.handle(callback, null, [err.reason]);
						});
					}]);
				},
				/**
				 * Buy NFT.
				 * If wrong chain selected, suggest to switch chain.
				 * @method buy
				 * @params {String} tokenId NFT tokenId
				 * @params {Object} chain Blockchain chain where the tokenId was created
				 * @params {String} currency currency of NFT
				 * @params {function} callback
				 */
				buy: function (tokenId, chain, currency, callback) {
					if (window.ethereum.chainId !== chain.chainId) {
						Q.handle(callback, null, [true]);
						return Q.alert(Assets.texts.NFT.WrongChain.interpolate({chain: chain.name}), {
							title: texts.errors.Error
						});
					}
					var _waitTransaction = function (transactionRequest) {
						if (!Q.getObject("wait", transactionRequest)) {
							Q.handle(callback, null, [true])
							return Q.alert("Transaction request invalid!");
						}

						transactionRequest.wait(1).then(function (TransactionReceipt) {
							if (Assets.NFT.Web3.isSuccessfulTransaction(TransactionReceipt)) {
								Q.handle(callback, null, [null, TransactionReceipt]);
							} else {
								Q.handle(callback, null, ["transaction failed"]);
							}
						}, function (err) {
							Q.alert(err.reason, {
								title: texts.errors.Error
							});
							Q.handle(callback, null, [err.reason]);
						});
					};

					Assets.NFT.Web3.saleInfo(tokenId, chain, function (err, price) {
						if (err) {
							return console.warn(err);
						}

						Assets.NFT.Web3.getContract(chain, function (err, contract) {
							if (err) {
								return;
							}

							/*contract.estimateGas.buy(tokenId, {value: price.price, from: window.ethereum.selectedAddress}).then(function (gasAmount) {
                                contract.buy(tokenId, {value: price.price, gasLimit: parseInt(gasAmount._hex, 16)}).then(_waitTransaction);
                            }).catch(function (err) {
                                debugger;
                            });*/
							contract.buy(tokenId, {value: price.price, gasLimit: 10000000}).then(_waitTransaction);
						});
					});
				},
				/**
				 * Get long string and minimize to fixed length with some chars at the end and dots in the middle
				 * @method minimizeAddress
				 * @param {string} str
				 * @param {integer} length result length
				 * @param {integer} endChars amount of chars at the end
				 */
				minimizeAddress: function (str, length, endChars) {
					if (!str) {
						return str;
					}

					endChars = endChars || 0;
					var strLength = str.length;
					if (strLength <= length) {
						return str;
					}

					return str.substr(0, length - endChars - 3) + "..." + str.substr(-endChars, endChars);
				},
				/**
				 * Check if transaction successful
				 * @method isSuccessfulTransaction
				 * @param {object} receipt
				 */
				isSuccessfulTransaction: function (receipt) {
					var status = Q.getObject("status", receipt);
					if (status === '0x1' || status === 1) {
						return true;
					}

					return false;
				}
			}
		},
		Web3: {
		   	/**
		   	 * Generates a link for opening a coin
		   	 * @static
		   	 * @method addAsset
		   	 * @param {String} asset in UAI format https://github.com/trustwallet/developer/blob/master/assets/universal_asset_id.md
			 * @param {String} symbol A ticker symbol or shorthand, up to 5 chars.
			 * @param {Number} decimals The number of decimals in the token
			 * @param {String} [image] A string url of the token logo
		   	 * @return {String}
		   	 */			
			addAsset: {	
				metamask: function (asset, symbol, decimals, image) {
					return ethereum.request({
						method: 'wallet_watchAsset',
						params: {
							type: 'ERC20',
							options: {
								address: asset,
								symbol: symbol,
								decimals: decimals,
								image: image
							}
						}
					});
				},
				trustwallet: function (asset) {
					window.open(Assets.Web3.Links.addAsset.trustwallet('c60_t'+asset));
				}
			},
			
			Links: {
			   	/**
			   	 * Generates a link for adding an asset
			   	 * @static
			   	 * @method addAsset
			   	 * @param {String} asset in UAI format https://github.com/trustwallet/developer/blob/master/assets/universal_asset_id.md
			   	 * @return {String}
			   	 */
				addAsset: { trustwallet: function (asset) {
					return 'https://link.trustwallet.com/add_asset?asset='+asset;
				}},
			   	/**
			   	 * Generates a link for opening a coin
			   	 * @static
			   	 * @method openCoin
			   	 * @param {String} asset in UAI format https://github.com/trustwallet/developer/blob/master/assets/universal_asset_id.md
			   	 * @return {String}
			   	 */
			   	openCoin: { trustwallet: function (asset) {
					return 'https://link.trustwallet.com/open_coin?asset='+asset;
				}},
			   	/**
			   	 * Generates a link for sending a payment
			   	 * @static
			   	 * @method send
			   	 * @param {String} asset in UAI format https://github.com/trustwallet/developer/blob/master/assets/universal_asset_id.md
			   	 * @param {String} address some Ethereum address
			   	 * @param {Number} amount The amount to send
			   	 * @param {String} [memo] What to say with the payment
			   	 * @return {String}
			   	 */
			   	send: { trustwallet: function (asset, address, amount, memo) {
					return Q.url('https://link.trustwallet.com/send', {
						asset: asset,
						address: address,
						amount: amount,
						memo: memo || ''
					});
				}},
			   	/**
			   	 * Generates a link for swapping between tokens
			   	 * @static
			   	 * @method addAsset
			   	 * @param {String} from in UAI format https://github.com/trustwallet/developer/blob/master/assets/universal_asset_id.md
			   	 * @param {String} to in UAI format https://github.com/trustwallet/developer/blob/master/assets/universal_asset_id.md
			   	 * @return {String}
			   	 */
			   	swap: { trustwallet: function (from, to) {
					return Q.url('https://link.trustwallet.com/swap', {
						from: from,
						to: to,
					});
				}}
			}
		}
	};

	Assets.Subscriptions.authnet.options = {
		name: Users.communityName
	};
	Assets.Subscriptions.stripe.options = {
		javascript: 'https://checkout.stripe.com/checkout.js',
		name: Users.communityName,
		email: Q.getObject("loggedInUser.email", Users)
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
		"Assets/subscription": "{{Assets}}/js/tools/subscription.js",
		"Assets/payment": "{{Assets}}/js/tools/payment.js",
		"Assets/history": "{{Assets}}/js/tools/history.js",
		"Assets/service/preview": "{{Assets}}/js/tools/servicePreview.js",
		"Assets/NFT/preview": "{{Assets}}/js/tools/NFT/preview.js",
		"Assets/NFT/series/preview": "{{Assets}}/js/tools/NFT/series.js",
		"Assets/NFT/owned": "{{Assets}}/js/tools/NFT/owned.js",
		"Assets/NFT/list": "{{Assets}}/js/tools/NFT/list.js"
	});
	
	Q.onInit.add(function () {
		// preload this, so it's available on gesture handlers
		Q.Text.get('Assets/content', function (err, text) {
			var msg = Q.firstErrorMessage(err);
			if (msg) {
				return console.warn("Assets/text: " + msg);
			}

			Assets.texts = text;
		});

		// Listen for Assets/user/credits stream changes to update Q.Assets.Credits on client.
		// and listem messages to show Q.Notices
		var _listenUserStream = function () {
			Assets.Credits.userStream(function (err) {
				if (err) {
					return;
				}

				this.onFieldChanged('attributes').set(function (fields, k) {
					if (!fields[k]) {
						return;
					}

					try {
						Assets.Credits.amount = JSON.parse(fields[k]).amount;
						Q.handle(Assets.onCreditsChanged, null, [Assets.Credits.amount]);
					} catch (e) {}
				}, 'Assets');

				var _createNotice = function (stream, message) {
					// check if message already displayed
					var messageId = message.getInstruction('messageId');
					if (Q.isEmpty(this.usedIds)) {
						this.usedIds = [messageId];
					} else if (this.usedIds.includes(messageId)) {
						return;
					} else {
						this.usedIds.push(messageId);
					}

					var reason = message.getInstruction('reason');
					var content = message.content;
					if (reason) {
						content += '<br>' + reason;
					}

					var options = {
						content: content,
						timeout: 5,
						group: reason || null,
						handler: function () {
							if (content.includes("credit") || reason.includes("credit")) {
								Q.handle(Q.url("me/credits"));
							}
						}
					};

					Q.handle(Assets.onBeforeNotice, message, [options]);

					Q.Notices.add(options);
				};
				this.onMessage('Assets/credits/received').set(_createNotice, 'Assets');
				this.onMessage('Assets/credits/sent').set(_createNotice, 'Assets');
				this.onMessage('Assets/credits/spent').set(_createNotice, 'Assets');
				this.onMessage('Assets/credits/granted').set(_createNotice, 'Assets');
				this.onMessage('Assets/credits/bought').set(_createNotice, 'Assets');
				this.onMessage('Assets/credits/bonus').set(_createNotice, 'Assets');
			});
		};

		_listenUserStream();

		Users.onLogin.set(function (user) {
			if (!user) { // the user changed
				return;
			}

			_listenUserStream();
		}, "Assets");

	}, 'Assets');

	function _error(message, code) {
		var err = new Q.Error(message);
		if (code) {
			err.code = code;
		}
		console.warn(err);
		return err;
	}

	function _redirectToBrowserTab(options) {
		var url = new URL(document.location.href);
		url.searchParams.set('browsertab', 'yes');
		url.searchParams.set('scheme', Q.info.scheme);
		url.searchParams.set('paymentOptions', JSON.stringify({
			amount: options.amount,
			email: options.email,
			userId: Q.Users.loggedInUserId(),
			currency: options.currency
		}));
		cordova.plugins.browsertabs.openUrl(url.toString(), {
			scheme: Q.info.scheme
		}, function(successResp) {
			Q.handle(options.onSuccess, null, [successResp]);
		}, function(err) {
			Q.handle(options.onFailure, null, [err]);
		});
	}

	if (window.location.href.indexOf('browsertab=yes') !== -1) {
		window.onload = function() {
			var params = new URLSearchParams(document.location.href);
			try {
				var paymentOptions = JSON.parse(params.get('paymentOptions'));
			} catch(err) {
				console.warn("Undefined payment options");
				throw(err);
			}

			if (Q.isEmpty(paymentOptions)) {
				return console.warn("Undefined payment options");
			}

			var scheme = params.get('scheme');

			// need Stripe lib for safari browserTab
			Assets.Payments.load(function () {
				if ((Q.info.platform === 'ios') && (Q.info.browser.name === 'safari')) { // It's considered that ApplePay is supported in IOS Safari
					var $button = $('#browsertab_pay');
					var $info = $('#browsertab_pay_info');
					var $cancel = $('#browsertab_pay_cancel');
					var $error = $('#browsertab_pay_error');
					$button.show();
					$button.on('click', function() {
						Assets.Payments.stripe(paymentOptions, function(err, res) {
							$button.hide();
							if (err && err.code === 20) {
								$cancel.show();
							} else if (err) {
								$error.show();
							} else {
								// if scheme defined, redirect to scheme to close browsertab
								scheme && (location.href = scheme);
								$info.show();
							}
						});
					});
				} else {
					Assets.Payments.stripe(paymentOptions, function () {
						if (scheme) {
							location.href = scheme;
						} else {
							window.close();
						}
					});
				}
			});
		};
	}

	// catch Assets/connected request and rewrite handler to open new tab
	Q.Tool.onActivate('Q/tabs').set(function () {
		// only for main Q/tabs tool from dashboard
		if (!$(this.element).closest("#dashboard").length) {
			return;
		}

		this.state.beforeSwitch.set(function (tab, href) {
			if (!href || !href.includes("Assets/connected")) {
				return true;
			}

			var $tab = $(tab);

			$tab.addClass("Q_working");

			Q.req(href, "content", function (err, data) {
				$tab.removeClass("Q_working");

				var fem = Q.firstErrorMessage(err, data);
				if (fem) return Q.alert(fem);

				var redirectUrl = Q.getObject("slots.content.redirectUrl", data);

				if (!redirectUrl) {
					Q.alert("Assets/connected: invalid url");
				}

				Q.openUrl(redirectUrl);
			});

			return false;
		}, 'Assets');
	}, 'Assets');
})(Q, Q.plugins.Assets, Q.plugins.Streams, jQuery);
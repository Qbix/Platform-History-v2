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

				Q.Template.set('Assets/credits/missing',
					'<div class="Assets_credits_buy_missing">{{YouMissingCredits}}</div>' +
					'<input type="hidden" name="amount" value="{{amount}}">' +
					'<button class="Q_button" name="buy">{{texts.PurchaseCredits}}</button>'
				);
				Q.Template.set('Assets/credits/buy',
					'<div class="Assets_credits_buy"><input name="amount" value="{{amount}}"> {{texts.Credits}}</div>' +
					'<button class="Q_button" name="buy">{{texts.PurchaseCredits}}</button>'
				);

				// indicator of payment process started
				var paymentStarted = false;

				Q.Dialogs.push({
					title: title,
					className: "Assets_credits_buy",
					template: {
						name: templateName,
						fields: {
							amount: options.amount,
							YouMissingCredits: YouMissingCredits,
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
						userId: options.userId,
						toStream: options.toStream,
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

		onSuccessPayment: new Q.Event(),

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
				Q.addScript(Q.Assets.Payments.stripe.jsLibrary, function () {
					Stripe.setPublishableKey(Q.Assets.Payments.stripe.publishableKey);
					Stripe.applePay.checkAvailability(function (available) {
						Q.Assets.Payments.stripe.applePayAvailable = available;
						Q.Assets.Payments.loaded = true;
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

				var applePayConfig = Q.getObject("Q.Assets.Payments.applePay");
				if (!applePayConfig) {
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
						merchantIdentifier: applePayConfig.merchantIdentifier,
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
					Assets.onSuccessPayment.handle(response);
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
		"Assets/service/preview": "{{Assets}}/js/tools/servicePreview.js"
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
				this.onMessage('Assets/credits/granted').set(_createNotice, 'Assets');
				this.onMessage('Assets/credits/bought').set(_createNotice, 'Assets');
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
			Q.Assets.Payments.load(function () {
				if ((Q.info.platform === 'ios') && (Q.info.browser.name === 'safari')) { // It's considered that ApplePay is supported in IOS Safari
					var $button = $('#browsertab_pay');
					var $info = $('#browsertab_pay_info');
					var $cancel = $('#browsertab_pay_cancel');
					var $error = $('#browsertab_pay_error');
					$button.show();
					$button.on('click', function() {
						Q.Assets.Payments.stripe(paymentOptions, function(err, res) {
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
					Q.Assets.Payments.stripe(paymentOptions, function () {
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

				// open browsertab for cordova
				var browsertab = Q.getObject("cordova.plugins.browsertabs");
				if (browsertab) {
					return browsertab.openUrl(redirectUrl);
				}

				window.open(redirectUrl, '_blank').focus();
			});

			return false;
		}, 'Assets');
	}, 'Assets');
})(Q, Q.plugins.Assets, Q.plugins.Streams, jQuery);
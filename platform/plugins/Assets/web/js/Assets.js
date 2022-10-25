(function (Q) {

	/**
	 * Various front-end functionality dealing with awards, badges, credits, etc.
	 * @class Assets
	 */

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
				Streams.retainWith(true).get(Users.loggedInUser.id, "Assets/user/credits", callback);
			},
			/**
			 * Buy credits
			 * @method buy
			 *  @param {object} options
			 *  @param {number} [options.amount=100] Default amount of credits to buy.
			 *  @param {string} [options.currency=USD] Currency ISO 4217 code (USD, EUR etc)
			 *  @param {string} [options.missing=false] Whether to show text about credits missing.
			 *  @param {object} [options.metadata] Data to pass to payment gateway to get them back and save to message instructions
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
								metadata: options.metadata
							}, function(err, data) {
								if (err) {
									return Q.handle(options.onFailure, null, [err]);
								}
								return Q.handle(options.onSuccess, null, [null, data]);
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

						var metadata = {};
						// some payment gateways require metadata values only strings
						if (!Q.isEmpty(options.toStream)) {
							metadata.publisherId = options.toStream.publisherId;
							metadata.streamName = options.toStream.streamName;
						}

						Assets.Credits.buy({
							missing: true,
							amount: details.needCredits,
							onSuccess: function () {
								Assets.Credits.pay(options);
							},
							onFailure: options.onFailure,
							metadata: metadata
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
			 *  @param {String} [options.planPublisherId=Q.Users.communityId] - The publisherId of the subscription plan
			 *  @param {String} options.planStreamName - The name of the subscription plan's stream
			 *  @param {Boolean} [option.immediatePayment=false] - If true, try to charge funds using stripe customer id.
			 *  @param {Function} [callback] The function to call, receives (err, paymentSlot)
			 */
			stripe: function (options, callback) {
				// load payment lib and set required params
				Assets.Payments.load(function () {
					Streams.get(options.planPublisherId, options.planStreamName, function (err) {
						if (err) {
							return callback && callback(err);
						}

						options = Q.extend(Assets.Subscriptions.stripe.options, options);

						var plan = this;
						var amount = parseInt(plan.getAttribute('amount'));
						var _payment = function () {
							Assets.Payments.stripe({
								amount: amount,
								currency: options.currency,
								description: plan.fields.title,
								metadata: {
									publisherId: options.planPublisherId,
									streamName: options.planStreamName
								}
							}, function(err, data) {
								if (err) {
									return Q.handle(callback, null, [err]);
								}
								return Q.handle(callback, null, [null, data]);
							});
						};

						if (options.immediatePayment) {
							// just dummy dialog with throbber to show user that payment processing
							Q.Dialogs.push({
								title: Assets.texts.subscriptions.ImmediatePayment,
								className: "Assets_stripe_payment Assets_stripe_payment_loading",
								content: null
							});
							Q.req("Assets/subscription", ["subscription"], function (err, response) {
								// close dummy dialog
								Q.Dialogs.pop();

								var msg = Q.firstErrorMessage(err, response && response.errors);
								if (msg) {
									return Q.alert(msg);
								}

								var subscription = response.slots.subscription;

								if (subscription) {
									return Q.handle(callback, null, [null, subscription]);
								} else {
									_payment();
								}
							}, {
								method: "post",
								fields: {
									payments: "stripe",
									planPublisherId: options.planPublisherId,
									planStreamName: options.planStreamName
								}
							});
						} else {
							_payment();
						}
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
					immediatePayment: options.immediatePayment,
					token: options.token
				};

				// just dummy dialog with throbber to show user that payment processing
				Q.Dialogs.push({
					title: Assets.texts.subscriptions.ProcessingPayment,
					className: "Assets_stripe_payment Assets_stripe_payment_loading",
					content: null
				});

				Q.req('Assets/subscription', ['status', 'details'], function (err, response) {
					Q.Dialogs.pop();
					var msg = Q.firstErrorMessage(err, response && response.errors);
					if (msg) {
						return callback(msg, null);
					}

					// payment fail for some reason
					if (!response.slots.status) {
						var details = response.slots.details;

						var metadata = {
							publisherId: options.planPublisherId,
							streamName: options.planStreamName
						};

						Assets.Credits.buy({
							missing: true,
							amount: details.needCredits,
							onSuccess: function () {
								Assets.Subscriptions.subscribe(payments, options, callback);
							},
							onFailure: options.onFailure,
							metadata: metadata
						});
						return;
					}

					Q.handle(callback, this, [null, response.slots.details]);
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
			 *  @param {String} [options.description] Operation code which detailed text can be fetch from lang json (Assets/content/payments).
			 *  @param {object} [options.metadata] Data to pass to payment gateway to get them back and save to message instructions
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
					var err = _error("Assets.Payments.stripe: amount is required");
					return Q.handle(callback, null, [err]);
				}

				if (!Users.loggedInUser) {
					return Q.Users.login({
						onSuccess: function () {
							Q.handle(window.location.href);
						}
					});
				}

				options.userId = options.userId || Q.Users.loggedInUserId();
				options.currency = (options.currency || 'USD').toUpperCase();

				if (Q.info.isCordova && (window.location.href.indexOf('browsertab=yes') === -1)) {
					_redirectToBrowserTab(options);
				} else {
					Assets.Payments.standardStripe(options, callback);
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
					if (Assets.Payments.loaded) {
						return Q.handle(callback);
					}

					Assets.Payments.stripeObject = Stripe(Assets.Payments.stripe.publishableKey);
					Assets.Payments.loaded = true;

					Q.handle(callback);

					// check payment intent
					var clientSecret = new URLSearchParams(window.location.search).get("payment_intent_client_secret");
					if (clientSecret) {
						Assets.Payments.stripeObject.retrievePaymentIntent(clientSecret).then(function ({paymentIntent}) {
							Assets.Payments.stripePaymentResult(paymentIntent);

							// push url without query string
							Q.Page.push(window.location.href.split('?')[0], document.title);
						}).catch(function (err) {
							console.error(err);
						});
					}
				});
			}),
			/**
			 * This method use to pay with standard stripe payment
			 * @method standardStripe
			 * @static
			 *  @param {Object} [options] Any additional options to pass to the stripe checkout config, and also:
			 *  @param {Float} options.amount the amount to pay.
			 *  @param {String} options.description Payment description.
			 *  @param {Object} options.metadata Data to pass to payment gateway to get them back and save to message instructions
			 *  @param {String} [options.currency="usd"] the currency to pay in.
			 *  @param {Function} [callback]
			 */
			standardStripe: function (options, callback) {
				Assets.Payments.checkLoaded();

				Q.Template.set('Assets/stripe/payment',
					`<div class="Assets_Stripe_requestButton"></div>
					<div class="Assets_Stripe_elements"></div>
					<button class="Q_button" name="pay"></button>`
				);

				var paymentRequestButton, paymentElement;

				Q.Dialogs.push({
					title: options.description,
					className: "Assets_stripe_payment Assets_stripe_payment_loading",
					template: {
						name: 'Assets/stripe/payment',
						fields: {
							text: Assets.texts
						}
					},
					onActivate: function ($dialog) {
						var pipeDialog = new Q.pipe(["currencySymbol", "paymentIntent"], function (params) {
							var currencySymbol = params.currencySymbol[0];
							var clientSecret = params.paymentIntent[0];
							var amount = parseInt(options.amount);
							var $payButton = $("button[name=pay]", $dialog);

							$payButton.text(Assets.texts.payment.Pay + ' ' + currencySymbol + amount.toFixed(2));

							var pipeElements = new Q.pipe(['paymentRequest', 'payment'], function (params) {
								$dialog.removeClass("Assets_stripe_payment_loading");
							});

							// <create payment request button>
							var paymentRequest = Assets.Payments.stripeObject.paymentRequest({
								country: 'US',
								currency: options.currency.toLowerCase(),
								total: {
									label: options.description,
									amount: amount * 100, // stripe need amount in minimum units (cents)
								},
								requestPayerName: true,
								requestPayerEmail: true
							});
							paymentRequest.on('paymentmethod', function(ev) {
								// Confirm the PaymentIntent without handling potential next actions (yet).
								Assets.Payments.stripeObject.confirmCardPayment(
									clientSecret,
									{payment_method: ev.paymentMethod.id},
									{handleActions: false}
								).then(function(confirmResult) {
									if (confirmResult.error) {
										// Report to the browser that the payment failed, prompting it to
										// re-show the payment interface, or show an error message and close
										// the payment interface.
										ev.complete('fail');

										console.error(confirmResult.error);
										Q.alert("Payment failed");
										return;
									}

									// Report to the browser that the confirmation was successful, prompting
									// it to close the browser payment method collection interface.
									ev.complete('success');

									Q.Dialogs.pop();

									// Check if the PaymentIntent requires any actions and if so let Stripe.js
									// handle the flow. If using an API version older than "2019-02-11"
									// instead check for: `paymentIntent.status === "requires_source_action"`.
									if (confirmResult.paymentIntent.status === "requires_source_action" || confirmResult.paymentIntent.status === "requires_action") {
										// Let Stripe.js handle the rest of the payment flow.
										Assets.Payments.stripeObject.confirmCardPayment(clientSecret).then(function(result) {
											if (result.error) {
												// The payment failed -- ask your customer for a new payment method.
												Q.alert(result.error.message);
											} else {
												// The payment has succeeded.
												//Assets.Payments.stripePaymentResult({status: 'succeeded'})
											}
										});
									} else {
										// The payment has succeeded.
										//Assets.Payments.stripePaymentResult({status: 'succeeded'})
									}
								});
							});
							paymentRequestButton = Assets.Payments.stripeObject.elements().create('paymentRequestButton', {
								paymentRequest: paymentRequest,
							});
							paymentRequestButton.on('ready', pipeElements.fill('paymentRequest'));

							// Check the availability of the Payment Request API first.
							paymentRequest.canMakePayment().then(function(result) {
								var $paymentRequestButton = $(".Assets_Stripe_requestButton", $dialog);

								if (result) {
									paymentRequestButton.mount($paymentRequestButton[0]);
								} else {
									$paymentRequestButton.hide();
									pipeElements.fill('paymentRequest')();
								}
							});
							// </create payment request button>

							// <create stripe "payment" element>
							var elements = Assets.Payments.stripeObject.elements({clientSecret});
							paymentElement = elements.create('payment', {
								wallets: {
									applePay: 'never',
									googlePay: 'never'
								}
							});
							paymentElement.on('ready', pipeElements.fill('payment'));
							paymentElement.mount($(".Assets_Stripe_elements", $dialog)[0]);

							$payButton.on(Q.Pointer.fastclick, function () {
								var $this = $(this);
								$this.addClass("Q_working");
								Assets.Payments.stripeObject.confirmPayment({
									elements,
									confirmParams: {
										return_url: Q.url("{{baseUrl}}/me/credits")
									},
									redirect: 'if_required'
								}).then(function (response) {
									Q.Dialogs.pop();

									if (response.error) {
										if (response.error.type === "card_error" || response.error.type === "validation_error") {
											Q.alert(response.error.message);
										} else {
											Q.alert("An unexpected error occurred.");
										}
										return;
									}

									//Assets.Payments.stripePaymentResult(paymentIntent);
								});
							});
							// </create stripe "payment" element>
						});

						// get currency symbol
						Assets.Currencies.getSymbol(options.currency, function (symbol) {
							pipeDialog.fill("currencySymbol")(symbol);
						});

						// get payment intent
						Q.req("Assets/payment", "intent", function (err, response) {
							var msg = Q.firstErrorMessage(err, response && response.errors);
							if (msg) {
								Q.Dialogs.pop();
								return Q.alert(msg);
							}

							var paymentIntent = Q.getObject(["slots", "intent"], response);
							var clientSecret = paymentIntent.client_secret;
							if (!clientSecret) {
								Q.handle(callback, null, [true]);
								Q.Dialogs.pop();
								throw new Q.Exception('clientSecret empty');
							}
							var token = paymentIntent.token;
							if (!token) {
								Q.handle(callback, null, [true]);
								Q.Dialogs.pop();
								throw new Q.Exception('token empty');
							}

							// listen Assets/user/credits stream for message
							Streams.Stream.onMessage(Users.loggedInUser.id, 'Assets/user/credits', 'Assets/credits/bought').set(function(stream, message) {
								if (token !== message.getInstruction('token')) {
									return;
								}

								Q.handle(callback, null, [null]);
							}, token);

							pipeDialog.fill("paymentIntent")(clientSecret);
						}, {
							fields: {
								amount: options.amount,
								currency: options.currency,
								metadata: options.metadata
							}
						});
					},
					onClose: function () {
						paymentRequestButton && paymentRequestButton.destroy();
						paymentElement && paymentElement.destroy();
						Q.handle(callback, null, [true]);
					}
				});
			},
			/**
			 * Show message with payment status
			 * @method stripePaymentResult
			 * @static
			 *  @param {Object} paymentIntent - stripe payment intent object
			 */
			stripePaymentResult: function (paymentIntent) {
				var message = "";
				switch (paymentIntent.status) {
					case "succeeded":
						message = Assets.texts.payment.PaymentSucceeded;
						break;
					case "processing":
						message = Assets.texts.payment.PaymentProcessing;
						break;
					case "requires_payment_method":
						message = Assets.texts.payment.FailTryAgain;
						break;
					default:
						message = Assets.texts.payment.SomethingWrong;
						break;
				}

				Q.Dialogs.push({
					title: Assets.texts.payment.PaymentStatus,
					className: "Assets_Payment_status",
					content: message,
					onActivate: function ($dialog) {
						$dialog.attr('data-status', paymentIntent.status);
					}
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

					Q.handle(callback, Assets.Currencies, [null, Assets.Currencies.symbols, Assets.Currencies.names]);
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
				Assets.Currencies.load(function (err, symbols, names) {
					if (err) {
						return;
					}
					Q.handle(callback, null, [Q.getObject(currency, symbols) || currency]);
				});
			}
		},

		/**
		 * Create batcher
		 * @method batchFunction
		 */
		batchFunctions: {},
		batchFunction: function Assets_batchFunction() {
			return Q.batcher.factory(this.batchFunctions, Q.info.baseUrl,"/action.php/Assets/batch", "batch", "batch");
		},

		NFT: {
			/**
			 * For dealing with NFTs on web3 (EVM-compatible) blockchains
			 * @class Assets.NFT.Web3
			 */
			Web3: {
				onTokenRemovedFromSale: new Q.Event(),
				onTokenPutOnSale: new Q.Event(),
				onTransfer: new Q.Event(),
				onInstanceCreated: new Q.Event(),
				onInstanceOwnershipTransferred: new Q.Event(),
				onSeriesPutOnSale: new Q.Event(),
				onSeriesRemovedFromSale: new Q.Event(),

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

					// if chain is a chainId, convert to chain
					if (Q.typeOf(chain) === "string") {
						chain = Assets.NFT.chains[chain];
					}

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
							Q.Users.Web3.switchChain(chain, function () {
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
					return Q.Users.Web3.getContract('Assets/templates/NFT', contractAddress)
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
				 * @param {Object} chain
				 * @param {function} callback
				 * @param {object} [options]
				 * @param {boolean} [options.checkWeb3=false] If true, check wallet before create factory
				 */
				getFactory: function (chain, callback, options) {
					Q.Users.Web3.getContract(
						'Assets/templates/NFTFactory', 
						chain.contract,
						function (err, contract) {
							var events = {
								InstanceCreated: "onInstanceCreated",
								OwnershipTransferred: "onInstanceOwnershipTransferred"
							};
							Q.each(contract.ABI, function (index, obj) {
								Q.each(events, function (event1, event2) {
									if (obj.type === "event" && obj.name === event1) {
										contract.on(event1, function () {
											Q.handle(Assets.NFT.Web3[event2], null, Array.from(arguments))
										});
									}
								});
							});
							Q.handle(callback, null, [err, contract]);
						}
					);
				},
				/**
				 * Create contract for user
				 * @method getContract
				 * @param {Object} chain
				 * @param {function} callback
				 */
				getContract: function (chain, callback) {
					Q.Users.Web3.getContract(
						'Assets/templates/NFT', 
						chain.contract,
						function (err, contract) {
							var events = {
								TokenRemovedFromSale: "onTokenRemovedFromSale",
								TokenPutOnSale: "onTokenAddedToSale",
								Transfer: "onTransfer",
								OwnershipTransferred: "onTransferOwnership",
								TokenBought: "onTokenBought",
								SeriesPutOnSale: "onSeriesPutOnSale",
								SeriesRemovedFromSale: "onSeriesRemovedFromSale"
							};
							Q.each(contract.ABI, function (index, obj) {
								Q.each(events, function (event1, event2) {
									if (obj.type === "event" && obj.name === event1) {
										contract.on(event1, function () {
											Q.handle(Assets.NFT.Web3[event2], null, Array.from(arguments))
										});
									}
								});
							});
							Q.handle(callback, null, [err, contract]);
						}
					);
				},
				/**
				 * Get metadata
				 * @method metadata
				 * @param {String} tokenId - NFT tokenId
				 * @param {String} chainId
				 * @param {String} contractAddress
				 * @param {function} callback
				 */
				metadata: function (tokenId, chainId, contractAddress, callback) {
					Q.handle(Assets.batchFunction(), null, ["NFT", "fetchMetadata", tokenId, chainId, contractAddress, function (err) {
						if (err) {
							return Q.handle(callback, null, [err]);
						}

						Q.handle(callback, null, [null, this]);
					}]);
				},
				/**
				 * Get amount of tokens by wallet and chain
				 * @method balanceOf
				 * @param {String} address
				 * @param {Object} chain
				 * @param {function} callback
				 */
				balanceOf: function (address, chain, callback) {
					Assets.NFT.Web3.getContract(chain, function (err, contract) {
						if (err) {
							Q.handle(callback, null, [err]);
						}

						contract.balanceOf(address).then(function (tokensAmount) {
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
				 * @param {String} tokenId NFT tokenId
				 * @param {Object} chain
				 * @param {function} callback
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
				 * @param {String} tokenId NFT tokenId
				 * @param {Object} chain
				 * @param {function} callback
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
				 * @param {String} tokenId NFT tokenId
				 * @param {Object} chain
				 * @param {function} callback
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
				 * @param {String} tokenId NFT tokenId
				 * @param {Object} chain
				 * @param {function} callback
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
				 * Transfer NFT from one address to another.
				 * @method transferFrom
				 * @param {String} tokenId NFT tokenId
				 * @param {Object} chain
				 * @param {String} recipient address to transfer to
				 * @param {function} callback
				 */
				transferFrom: function (tokenId, chain, recipient, callback) {
					Q.handle(Assets.NFT.Web3.getOwner, this, [tokenId, chain, function (err, owner, contract) {
						if (err) {
							return Q.alert(err);
						}

						contract.transferFrom(owner, recipient, tokenId).then(function (info) {
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
				 * @param {String} tokenId NFT tokenId
				 * @param {Object} chain Blockchain chain where the tokenId was created
				 * @param {String} currency currency of NFT
				 * @param {function} callback
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
		name: Users.communityName,
		email: Q.getObject("loggedInUser.email", Users),
		currency: 'USD'
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
		"Assets/NFT/series": "{{Assets}}/js/tools/NFT/series.js",
		"Assets/NFT/series/preview": "{{Assets}}/js/tools/NFT/seriesPreview.js",
		"Assets/NFT/contract": "{{Assets}}/js/tools/NFT/contract.js",
		"Assets/NFT/owned": "{{Assets}}/js/tools/NFT/owned.js",
		"Assets/NFT/list": "{{Assets}}/js/tools/NFT/list.js",
		"Assets/plan/preview": "{{Assets}}/js/tools/planPreview.js",
		"Assets/plan": "{{Assets}}/js/tools/plan.js"
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
					var messageId = message.getInstruction('messageId') || message.getInstruction('token');
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

					var timeout = message.getInstruction('timeout') || 5;

					var options = {
						content: content,
						timeout: timeout,
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
				this.onMessage('Assets/credits/alert').set(_createNotice, 'Assets');
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
			currency: options.currency,
			description: options.description,
			metadata: options.metadata
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
				Assets.Payments.stripe(paymentOptions, function () {
					if (scheme) {
						location.href = scheme;
					} else {
						window.close();
					}
				});
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

	var co = {
		scrollbarsAutoHide: false,
		handlers: {
			NFTprofile: "{{Assets}}/js/columns/NFTprofile.js",
			NFTowned: "{{Assets}}/js/columns/NFTowned.js",
			NFT: "{{Assets}}/js/columns/NFT.js",
			billing: "{{Assets}}/js/columns/billing.js",
			subscription: "{{Assets}}/js/columns/subscription.js"
		}
	};
	if (Q.info.isMobile) {
		co.back = {src: "Q/plugins/Q/img/x.png"};
	}
	Q.Tool.define.options('Q/columns', co);
})(Q, Q.plugins.Assets, Q.plugins.Streams, jQuery);
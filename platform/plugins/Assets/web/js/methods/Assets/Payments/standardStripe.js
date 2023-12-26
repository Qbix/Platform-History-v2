Q.exports(function(priv){
    /**
    * This method use to pay with standard stripe payment
    * @method standardStripe
    * @static
    *  @param {Object} [options] Any additional options to pass to the stripe checkout config, and also:
    *  @param {Float} options.amount the amount to pay.
    *  @param {String} options.description Payment description.
    *  @param {Object} options.metadata Data to pass to payment gateway to get them back and save to message instructions
    *  @param {String} [options.currency="usd"] the currency to pay in.
    *  @param {String} [options.assetsPaymentsDialogClass] to add to dialog classes list
    *  @param {Function} [callback]
    */
    return function standardStripe(options, callback) {
        Q.Assets.Payments.checkLoaded();

        Q.Template.set('Assets/stripe/payment',
            `<div class="Assets_Stripe_requestButton"></div>
            <div class="Assets_Stripe_elements"></div>
            <button class="Q_button" name="pay"></button>`
        );

        var paymentRequestButton, paymentElement;
        var customClassName = Q.getObject("assetsPaymentsDialogClass", options);
        Q.Dialogs.push({
            title: options.description,
            className: "Assets_stripe_payment Assets_stripe_payment_loading " + customClassName,
            mask: customClassName || true,
            template: {
                name: 'Assets/stripe/payment',
                fields: {
                    text: Q.Assets.texts
                }
            },
            onActivate: function (dialog) {
                var pipeDialog = new Q.Pipe(["currencySymbol", "paymentIntent"], function (params) {
                    var currencySymbol = params.currencySymbol[0];
                    var clientSecret = params.paymentIntent[0];
                    var amount = parseInt(options.amount);
                    var $payButton = $("button[name=pay]", dialog);

                    $payButton.text(Q.Assets.texts.payment.Pay + ' ' + currencySymbol + amount.toFixed(2));

                    var pipeElements = new Q.Pipe(['paymentRequest', 'payment'], function (params) {
                        dialog.removeClass("Assets_stripe_payment_loading");
                    });

                    // <create payment request button>
                    var paymentRequest = Q.Assets.Payments.stripeObject.paymentRequest({
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
                        Q.Assets.Payments.stripeObject.confirmCardPayment(
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
                                Q.Assets.Payments.stripeObject.confirmCardPayment(clientSecret).then(function(result) {
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
                    paymentRequestButton = Q.Assets.Payments.stripeObject.elements().create('paymentRequestButton', {
                        paymentRequest: paymentRequest,
                    });
                    paymentRequestButton.on('ready', pipeElements.fill('paymentRequest'));

                    // Check the availability of the Payment Request API first.
                    paymentRequest.canMakePayment().then(function(result) {
                        var $paymentRequestButton = $(".Assets_Stripe_requestButton", dialog);

                        if (result) {
                            paymentRequestButton.mount($paymentRequestButton[0]);
                        } else {
                            $paymentRequestButton.hide();
                            pipeElements.fill('paymentRequest')();
                        }
                    });
                    // </create payment request button>

                    // <create stripe "payment" element>
                    var elements = Q.Assets.Payments.stripeObject.elements({
                        clientSecret,
                        appearance: Q.Assets.Payments.stripe.appearance || {}
                    });
                    paymentElement = elements.create('payment', {
                        wallets: {
                            applePay: 'never',
                            googlePay: 'never'
                        }
                    });
                    paymentElement.on('ready', pipeElements.fill('payment'));
                    paymentElement.mount($(".Assets_Stripe_elements", dialog)[0]);

                    $payButton.on(Q.Pointer.fastclick, function () {
                        var $this = $(this);
                        $this.addClass("Q_working");
                        Q.Assets.Payments.stripeObject.confirmPayment({
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
                Q.Assets.Currencies.getSymbol(options.currency, function (symbol) {
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
                    Q.Streams.Stream.onMessage(Q.Users.loggedInUser.id, 'Assets/user/credits', 'Assets/credits/bought')
                    .set(function(message) {
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
    }
})
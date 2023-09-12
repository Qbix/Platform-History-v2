Q.exports(function(){
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
    function stripe(options, callback) {
        // load payment lib and set required params
        Q.Assets.Payments.load(function () {
            Q.Streams.get(options.planPublisherId, options.planStreamName, function (err) {
                if (err) {
                    return callback && callback(err);
                }

                options = Q.extend(Q.Assets.Subscriptions.stripe.options, options);

                var plan = this;
                var amount = parseInt(plan.getAttribute('amount'));
                var _payment = function () {
                    Q.Assets.Payments.stripe({
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
                        title: Q.Assets.texts.subscriptions.ImmediatePayment,
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
    }

	stripe.options = {
		name: Q.Users.communityName,
		email: Q.getObject("loggedInUser.email", Users),
		currency: 'USD'
	};
    
    return stripe;
})
Q.exports(function(){
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
    return function subscribe(payments, options, callback) {
        var fields = {
            payments: payments,
            planPublisherId: options.planPublisherId,
            planStreamName: options.planStreamName,
            immediatePayment: options.immediatePayment,
            token: options.token
        };

        // just dummy dialog with throbber to show user that payment processing
        Q.Dialogs.push({
            title: Q.Assets.texts.subscriptions.ProcessingPayment,
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

                Q.Assets.Credits.buy({
                    missing: true,
                    amount: details.needCredits,
                    onSuccess: function () {
                        Q.Assets.Subscriptions.subscribe(payments, options, callback);
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
})
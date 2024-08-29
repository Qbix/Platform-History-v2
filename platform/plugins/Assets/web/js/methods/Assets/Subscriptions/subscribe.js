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
        var metadata = {
            publisherId: options.planPublisherId,
            streamName: options.planStreamName
        };

        if (!Q.Users.loggedInUserId()) {
            return Q.Users.login({
                onSuccess: {'Users': function () {
                    Q.handle(Q.Assets.preSubscribeLogin, this, [function () {
                        options.skipAlreadySubscribed = true;
                        Q.Assets.Subscriptions.subscribe(payments, options, callback);
                    }]);
                }},
                onCancel: function () {
                    Q.handle(callback, this, [true]);
                }
            });
        }

        var fields = {
            payments: payments,
            planPublisherId: options.planPublisherId,
            planStreamName: options.planStreamName,
            immediatePayment: options.immediatePayment,
            token: options.token,
            skipAlreadySubscribed: options.skipAlreadySubscribed || false
        };
        Q.req('Assets/subscription', ['status', 'details', 'subscriptionStream'], function (err, response) {
            var msg = Q.firstErrorMessage(err, response && response.errors);
            if (msg) {
                return callback(msg, null);
            }

            // payment fail for some reason
            if (!response.slots.status) {
                var details = response.slots.details;

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

            var args = [null, response.slots.status, response.slots.subscriptionStream];
            Q.handle(callback, this, args);
            Q.handle(Q.Assets.Subscriptions.onSubscribe, this, args);
        }, {
            method: 'post',
            fields: fields
        });
    }
})
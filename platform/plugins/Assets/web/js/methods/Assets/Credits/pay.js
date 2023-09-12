Q.exports(function(){
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
    function pay(options) {
        var stream = options.toStream;
        if (Q.Streams.isStream(stream)) {
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

                Q.Assets.Credits.buy({
                    missing: true,
                    amount: details.needCredits,
                    onSuccess: function () {
                        Q.Assets.Credits.pay(options);
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
    }
    
    return pay;
})
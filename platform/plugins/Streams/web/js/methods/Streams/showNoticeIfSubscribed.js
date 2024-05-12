Q.exports(function(priv){
    /**
     * Use this to check whether user subscribed to stream
     * and also whether subscribed to message type (from streams_subscription_rule)
     * @static
     * @method showNoticeIfSubscribed
     * @param {object} options
     * @param {string} options.publisherId
     * @param {string} options.streamName
     * @param {string} options.messageType
     * @param {string} [options.evenIfNotSubscribed=false] - If yes, show notice even if user not subscribed to stream.
     * @param {function} options.callback Function which called to show notice if all fine.
     */
    return function Streams_showNoticeIfSubscribed(options) {
        var publisherId = options.publisherId;
        var streamName = options.streamName;
        var messageType = options.messageType;
        var callback = options.callback;
        var evenIfNotSubscribed = options.evenIfNotSubscribed;

        Q.Streams.get.force(publisherId, streamName, function () {
            // return if user doesn't subscribed to stream
            if (!evenIfNotSubscribed && Q.getObject("participant.subscribed", this) !== 'yes') {
                return;
            }

            var streamsSubscribeRulesFilter = JSON.parse(this.subscriptionRules.filter || null);
            if ((Q.getObject("types", streamsSubscribeRulesFilter) || []).includes(messageType)) {
                return;
            }

            // if stream retained - don't show notice
            var ps = Q.Streams.key(publisherId, streamName);
            if (priv._retainedStreams[ps]) {
                return;
            }

            Q.handle(callback, this);
        }, {
            withParticipant: true,
            withSubscriptionRules: true
        });
    };
})
Q.exports(function(priv){
    /**
     * Post a message to a stream, so it can be broadcast to all participants, sent to all subscribers, etc.
     * May call Message.post.onError if an error occurs.
     * @static
     * @method post
     * @param {Object} msg A Streams.Message object or a hash of fields to post. Must include publisherId and streamName.
     * @param {Function} callback Receives (err, message, messages, extras) as parameters, where messages is an object of {ordina; Streams.Message} pairs
     * @param {Function} callbackAfterHandled Same parameters as callback, but is called after all new messages were handled
     */
    return function _Streams_Message_post (msg, callback, callbackAfterHandled) {
        var baseUrl = Q.baseUrl({
            publisherId: msg.publisherId,
            streamName: msg.streamName
        });
        var fields = Q.copy(msg);
        fields["Q.clientId"] = Q.clientId();
        fields["min"] = Q.Streams.Message.latestOrdinal(msg.publisherId, msg.streamName) || 0;
        Q.req('Streams/message', ['messages', 'extras'], function (err, data) {
            var fem = Q.firstErrorMessage(err, data);
            if (!fem) {
                if (!data.slots || !data.slots.messages) {
                    fem = "Message.post: messages slot is missing";
                }
            }
            if (fem) {
                var args = [err, data];
                Q.Streams.onError.handle.call(this, fem, args);
                Q.Streams.Message.post.onError.handle.call(this, fem, args);
                return callback && callback.call(this, fem, args);
            }
            var messages = {};
            var latest = 0;
            var message = null;
            Q.each(data.slots.messages, function (ordinal) {
                var ordi = parseInt(ordinal);
                if (ordi > latest) {
                    latest = ordi;
                    message = this;
                }
                messages[ordinal] = Q.Streams.Message.construct(this, false);
            }, {ascending: true, numeric: true});

            var extras = data.slots.extras;
            Q.handle(callback, Q.Streams.Message, [err, message, messages, extras]);
            priv._simulatePosting(messages, extras);
            Q.handle(callbackAfterHandled, Q.Streams.Message, [err, message, messages, extras]);

        }, { method: 'post', fields: fields, baseUrl: baseUrl });
    };


})
Q.exports(function(priv){
    /**
    * Join a stream as a participant, so messages start arriving in real time via sockets.
    * May call Streams.join.onError if an error occurs.
    *
    * @static
    * @method join
    * @param {String} publisherId id of publisher which is publishing the stream
    * @param {String} streamName name of stream to join
    * @param {Function} [callback] receives (err, participant) as parameters
    */
    return function _Stream_join (publisherId, streamName, callback) {
        if (!Q.plugins.Users.loggedInUser) {
            throw new Q.Error("Streams.Stream.join: Not logged in.");
        }
        var slotName = "participant";
        var fields = {"publisherId": publisherId, "name": streamName};
        var baseUrl = Q.baseUrl({
            "publisherId": publisherId,
            "streamName": streamName,
            "Q.clientId": Q.clientId()
        });
        Q.req('Streams/join', [slotName], function (err, data) {
            var msg = Q.firstErrorMessage(err, data);
            if (msg) {
                var args = [err, data];
                Q.Streams.onError.handle.call(this, msg, args);
                Q.Streams.Stream.join.onError.handle.call(this, msg, args);
                return callback && callback.call(this, msg, args);
            }
            var participant = new Q.Streams.Participant(data.slots.participant);
            Q.Streams.Participant.get.cache.set(
                [participant.publisherId, participant.streamName, participant.userId],
                0, participant, [err, participant]
            );
            callback && callback.call(participant, err, participant || null);
            priv._refreshUnlessSocket(publisherId, streamName);
        }, { method: 'post', fields: fields, baseUrl: baseUrl });
    };
})
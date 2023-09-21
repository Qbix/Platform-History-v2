Q.exports(function(priv){
    /**
     * Leave a stream that you previously joined,
     * so that you don't get realtime socket messages for that stream anymore.
     * May call Stream.leave.onError if an error occurs.
     *
     * @static
     * @method leave
     * @param {String} publisherId
     * @param {String} streamName
     * @param {Function} callback Receives (err, participant) as parameters
     */
    return function _Stream_leave (publisherId, streamName, callback) {
        if (!Q.plugins.Users.loggedInUser) {
            throw new Q.Error("Streams.Stream.leave: Not logged in.");
        }
        var slotName = "participant";
        var fields = {
            "publisherId": publisherId,
            "name": streamName,
            "Q.clientId": Q.clientId()
        };
        var baseUrl = Q.baseUrl({
            publisherId: publisherId,
            streamName: streamName
        });
        Q.req('Streams/leave', [slotName], function (err, data) {
            var msg = Q.firstErrorMessage(err, data);
            if (msg) {
                var args = [err, data];
                Q.Streams.onError.handle.call(this, msg, args);
                Q.Streams.Stream.leave.onError.handle.call(this, msg, args);
                return callback && callback.call(this, msg, args);
            }
            var participant = new Q.Streams.Participant(data.slots.participant);
            Q.Streams.Participant.get.cache.set(
                [participant.publisherId, participant.streamName, participant.userId],
                0, participant, [err, participant]
            );
            callback && callback.call(this, err, participant || null);
            priv._refreshUnlessSocket(publisherId, streamName);
        }, { method: 'post', fields: fields, baseUrl: baseUrl });
    };

})
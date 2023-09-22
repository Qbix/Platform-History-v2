Q.exports(function(priv){
    /**
     * Closes a stream in the database, and marks it for removal unless it is required.
     *
     * @static
     * @method close
     * @param {String} publisherId
     * @param {String} streamName
     * @param {Function} callback Receives (err, result) as parameters
     */
    return function _Stream_remove (publisherId, streamName, callback) {
        var slotName = "result,stream";
        var fields = {"publisherId": publisherId, "name": streamName};
        var baseUrl = Q.baseUrl({
            publisherId: publisherId,
            streamName: streamName
        });
        Q.req('Streams/stream', [slotName], function (err, data) {
            var msg = Q.firstErrorMessage(err, data);
            if (msg) {
                var args = [err, data];
                Q.Streams.onError.handle.call(this, msg, args);
                Q.Streams.Stream.close.onError.handle.call(this, msg, args);
                return callback && callback.call(this, msg, args);
            }
            var stream = data.slots.stream;
            if (stream) {
                // process the Streams/closed message, if stream was retained
                priv._refreshUnlessSocket(stream.publisherId, stream.name);
                priv._refreshUnlessSocket(Q.Users.loggedInUserId(), 'Streams/participating');
            }
            callback && callback.call(this, err, data.slots.result || null);
        }, { method: 'delete', fields: fields, baseUrl: baseUrl });
    };

})
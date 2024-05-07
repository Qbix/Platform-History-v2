Q.exports(function(priv, Streams, Stream){
    /**
    * Start observing a stream, to get realtime messages through socket events.
    * You can do this either as a logged-in user or as an anonymous observer.
    *
    * @static
    * @method observe
    * @param {String} publisherId id of publisher which is publishing the stream
    * @param {String} streamName name of stream to observe
    * @param {Function} [callback] receives (err, result) as parameters
    */
    return function _Stream_observe (publisherId, streamName, callback) {
        var nodeUrl = Q.nodeUrl({
            publisherId: publisherId,
            streamName: streamName
        });

        // it will be called every time the socket reconnects,
        // but neglect() will remove it by the key
        var key = ['Streams.Stream.observe: ', publisherId, streamName].join("\t");
        Q.Socket.onConnect('/Q', nodeUrl)
        .add(function _observeSocketRequest () {
            Q.Streams.socketRequest('Streams/observe', publisherId, streamName, function () {
                var ps = Streams.key(publisherId, streamName);
                priv._observedByStream[ps] = true;
                Q.handle(callback);
            });
        }, key);
    };
})
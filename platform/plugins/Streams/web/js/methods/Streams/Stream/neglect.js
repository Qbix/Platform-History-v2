Q.exports(function(priv, Streams, Stream){
    /**
    * Stop observing a stream which you previously started observing,
    * so that you don't get realtime messages anymore.
    *
    * @static
    * @method neglect
    * @param {String} publisherId id of publisher which is publishing the stream
    * @param {String} streamName name of stream to stop observing
    * @param {Function} [callback] receives (err, result) as parameters
    */
    return function _Stream_neglect (publisherId, streamName, callback) {
        Q.Streams.socketRequest('Streams/neglect', publisherId, streamName, function () {
        	var ps = Streams.key(publisherId, streamName);
			priv._observedByStream[ps] = false;
			Q.handle(callback);
        });
    };
})
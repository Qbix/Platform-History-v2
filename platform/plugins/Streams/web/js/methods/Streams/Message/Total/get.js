Q.exports(function(priv, Streams, Stream, Total){
	/**
     * Streams plugin's front end code
     *
     * @module Streams
     * @class Streams
     */
    /**
	 * Get one or more messageTotals, which may result in batch requests to the server.
	 * May call Streams.Message.Total.get.onError if an error occurs.
	 *
	 * @static
	 * @method get
	 * @param {String} publisherId
	 * @param {String} streamName
	 * @param {String|Array} messageType can be the message type, or an array of them
	 * @param {Function} callback This receives two parameters. The first is the error.
	 *   If messageType was a String, then the second parameter is the messageTotal.
	 *   If messageType was an Array, then the second parameter is a hash of {messageType: messageTotal} pairs
	 */
	return Q.getter(function _Streams_Message_Total_get (publisherId, streamName, messageType, callback) {
		var func = Q.Streams.batchFunction(Q.baseUrl({
			publisherId: publisherId,
			streamName: streamName
		}));
		func.call(this, 'messageTotal', 'messageTotals', publisherId, streamName, messageType,
			function (err, data) {
				var msg = Q.firstErrorMessage(err, data);
				if (msg) {
					var args = [err, data];
					Q.Streams.onError.handle.call(this, msg, args);
					Q.Streams.Message.Total.get.onError.handle.call(this, msg, args);
					return callback && callback.call(this, msg, args);
				}

				var messageTotals = 0;
				if (data.messageTotals) {
					messageTotals = Q.isArrayLike(messageType)
						? Q.copy(data.messageTotals)
						: data.messageTotals[messageType];
				}
				callback && callback.call(Q.Streams.Message.Total, err, messageTotals || 0);
			});
	}, {
		throttle: 'Streams.Message.Total.get'
	});
})
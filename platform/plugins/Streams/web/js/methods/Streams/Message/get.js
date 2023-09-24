Q.exports(function(priv, Streams, Stream, Message){

    var where = Streams.cache.where || 'document';

    /**
     * Streams plugin's front end code
     *
     * @module Streams
     * @class Streams
     */
    /**
     * Get one or more messages, which may result in batch requests to the server.
     * May call Message.get.onError if an error occurs.
     *
     * @static
     * @method get
     * @param {String} publisherId
     * @param {String} streamName
     * @param {Number|Object} ordinal Can be the ordinal, or an object containing one or more of:
     * @param {Array} [ordinal.withMessageTotals] Highly encouraged if ordinal is an object. All the possible message types to automatically update messageTotals for.
     * @param {Number} [ordinal.min] The minimum ordinal in the range. If omitted, uses limit.
     * @param {Number} [ordinal.max] The maximum ordinal in the range. If omitted, gets the latest messages.
     * @param {Number} [ordinal.limit] Change the max number of messages to retrieve. If only max and limit are specified, messages are sorted by decreasing ordinal.
     * @param {String} [ordinal.type] the type of the messages, if you only need a specific type
     * @param {Boolean} [ordinal.ascending=false] whether to sort by ascending weight, otherwise sorts by descrending weight.
     * @param {Function} callback This receives three parameters. The first is the error.
     *   If ordinal was a Number, then the second parameter is the Streams.Message, as well as the "this" object.
     *   If ordinal was an Object, then the second parameter is a hash of { ordinal: Streams.Message } pairs
     *   The third parameter is an object that contains publisherId, streamName, streamType, messageCount
     */
    return Q.getter(function _Streams_Message_get (publisherId, streamName, ordinal, callback) {
        var slotName, criteria = {};
        if (Q.typeOf(ordinal) === 'object') {
            slotName = ordinal.withMessageTotals
                ? ['messages', 'messageTotals', 'extras']
                : ['messages', 'extras'];
            if (ordinal.min) {
                criteria.min = parseInt(ordinal.min);
            }
            criteria.max = parseInt(ordinal.max);
            criteria.limit = parseInt(ordinal.limit);
            if (ordinal.withMessageTotals) {
                criteria.withMessageTotals = ordinal.withMessageTotals;
            }
            if ('type' in ordinal) criteria.type = ordinal.type;
            if ('ascending' in ordinal) criteria.ascending = ordinal.ascending;
        } else {
            slotName = ['message', 'extras'];
            criteria = parseInt(ordinal);
        }

        var func = Q.Streams.batchFunction(Q.baseUrl({
            publisherId: publisherId,
            streamName: streamName
        }));
        func.call(this, 'message', slotName, publisherId, streamName, criteria,
            function (err, data) {
                var msg = Q.firstErrorMessage(err, data);
                if (msg) {
                    var args = [err, data];
                    Q.Streams.onError.handle.call(this, msg, args);
                    Q.Streams.Message.get.onError.handle.call(this, msg, args);
                    return callback && callback.call(this, msg, args);
                }
                var messages = {};
                if ('messages' in data) {
                    messages = data.messages;
                    if (data.messageTotals) {
                        priv.updateMessageTotalsCache(publisherId, streamName, data.messageTotals);
                    }
                } else if ('message' in data) {
                    messages[ordinal] = data.message;
                }
                Q.each(messages, function (ordinal, message) {
                    if (!(message instanceof Q.Streams.Message)) {
                        message = Q.Streams.Message.construct(message, true);
                    }
                    messages[ordinal] = message;
                });
                if (Q.isPlainObject(ordinal)) {
                    callback && callback.call(this, err, messages, data.extras);
                } else {
                    var message = Q.first(messages);
                    callback && callback.call(message, err, message || null, data.extras);
                }
            });
        return true;
    }, {
		cache: Q.Cache[where]("Streams.Message.get", 100),
		throttle: 'Streams.Message.get',
		prepare: function (subject, params, callback, args) {
			if (params[0]) {
				return callback(this, params);
			}
			if (Q.isPlainObject(args[2])) {
				var p1 = params[1];
				Q.each(p1, function (ordinal, message) {
					message = message && Message.construct(message, true);
					p1[ordinal] = message;
				});
			} else {
				params[1] = message && Message.construct(message, true);
			}
			callback(params[1], params);
		}
	});

})
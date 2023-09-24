Q.exports(function(priv, Streams, Stream) {

    var where = Streams.cache.where || 'document';

    /**
    * Streams batch getter.
    * @static
    * @method get
    * @param {String} publisherId Publisher's user id
    * @param {String} streamName Name of the stream published by this publisher
    * @param {Function} callback
    *	If there were errors, first parameter is an array of errors.
    *  Otherwise, first parameter is null and second parameter is a Streams.Stream object.
    *  The third parameter can contain more retrieved objects, under keys like "messages" and "participants"
    * @param {object} [extra] Optional object which can include the following keys:
    *   @param {Number|Object} [extra.participants=0] Optionally fetch up to that many participants
    *   @param {Number|Object} [extra.messages=0] Optionally fetch up to that many latest messages
    *   @param {String} [extra.messageType] optional String specifying the type of messages to fetch
    *   @param {Array} [extra.withMessageTotals] an array of message types to get messageTotals for in the returned stream object
    *   @param {Array} [extra.withRelatedToTotals] an array of relation types to get relatedToTotals for in the returned stream object
    *   @param {Array} [extra.withRelatedFromTotals] an array of relation types to get relatedFromTotals for in the returned stream object
    *   @param {Boolean} [extra.cacheIfMissing] defaults to false. If true, caches the "missing stream" result.
    *   @param {Array} [extra.fields] the stream is obtained again from the server
    *	if any fields named in this array are == null
    *   @param {Mixed} [extra."$Module_$fieldname"] any other fields you would like can be added, to be passed to your hooks on the back end
    */
    Streams.get = Q.getter(function _Streams_get(publisherId, streamName, callback, extra) {
        var args = arguments;
        var f;
        var url = Q.action('Streams/stream?') +
            Q.queryString({"publisherId": publisherId, "name": streamName});
        var slotNames = ['stream'];
        if (!publisherId) {
            throw new Q.Error("Streams.get: publisherId is empty");
        }
        if (!streamName) {
            throw new Q.Error("Streams.get: streamName is empty");
        }
        if (Q.getObject([publisherId, streamName], priv._publicStreams)) {
            extra = extra || {};
            extra.public = 1;
        }
        if (extra) {
            if (extra.participants) {
                url += '&'+$.param({"participants": extra.participants});
                slotNames.push('participants');
            }
            if (extra.messages) {
                url += '&'+$.param({messages: extra.messages});
                slotNames.push('messages');
            }
            if (f = extra.fields) {
                for (var i=0, l=f.length; i<l; ++i) {
                    var cached = Q.Streams.get.cache.get([publisherId, streamName]);
                    if (cached && cached.subject.fields[f[i]] == null) {
                        Q.Streams.get.forget(publisherId, streamName, null, extra);
                        break;
                    }
                }
            }
        }
        var func = Q.Streams.batchFunction(Q.baseUrl({
            publisherId: publisherId,
            streamName: streamName
        }));
        func.call(this, 'stream', slotNames, publisherId, streamName,
            function Streams_get_response_handler (err, data) {
                var msg = Q.firstErrorMessage(err, data);
                if (!msg && (!data || !data.stream)) {
                    msg = "Streams.get: data.stream is missing";
                }
                if (msg) {
                    var forget = false;
                    if (err && err[0] && err[0].classname === "Q_Exception_MissingRow") {
                        if (!extra || !extra.cacheIfMissing) {
                            forget = true;
                        }
                    } else {
                        forget = true;
                    }
                    if (forget && Q.Streams.get.forget) {
                        Q.Streams.get.forget.apply(this, args);
                        setTimeout(function () {
                            Q.Streams.get.forget.apply(this, args);
                        }, 0);
                    }
                    Q.Streams.onError.handle.call(this, err, data);
                    Q.Streams.get.onError.handle.call(this, err, data);
                    return callback && callback.call(this, err, data);
                }
                if (Q.isEmpty(data.stream)) {
                    var msg = "Stream " + publisherId + " " + streamName + " is not available";
                    var err = msg;
                    Q.Streams.onError.handle(err, [err, data, null]);
                    return callback && callback.call(null, err, null, extra);
                }
                Q.Streams.Stream.construct(
                    data.stream,
                    {
                        messages: data.messages,
                        participants: data.participants
                    },
                    function Streams_get_construct_handler(err, stream, extra) {
                        var msg;
                        if (msg = Q.firstErrorMessage(err)) {
                            Q.Streams.onError.handle(msg, [err, data, stream]);
                        }
                        var ret = callback && callback.call(stream, err, stream, extra);
                        if (ret === false) {
                            return false;
                        }
                        if (msg) return;

                        // The onRefresh handlers occur after the other callbacks
                        var f = stream.fields;
                        var handler = Q.getObject([f.type], priv._refreshHandlers);
                        Q.handle(handler, stream, []);
                        handler = Q.getObject(
                            [f.publisherId, f.name],
                            priv._streamRefreshHandlers
                        );
                        Q.handle(handler, stream, []);
                        Q.Streams.get.onStream.handle.call(stream);
                        return ret;
                    },
                    true // so the callback will already have the cache set
                );
            }, extra);
        priv._retain = undefined;
    }, {
		cache: Q.Cache[where]("Streams.get", 100, {
			beforeEvict: {
				Streams: function (item) {
					var publisherId = Q.getObject('subject.fields.publisherId', item);
					var streamName = Q.getObject('subject.fields.name', item);
					if (publisherId && streamName) {
						var ps = Streams.key(publisherId, streamName);
						if (priv._retainedByStream[ps]) {
							return false; // don't evict retained streams from cache
						}
					}
				}
			}
		}),
		throttle: 'Streams.get',
		prepare: function (subject, params, callback) {
			if (Streams.isStream(subject)) {
				return callback(subject, params);
			}
			if (params[0]) {
				return callback(subject, params);
			}
			Stream.construct(subject, {}, function () {
				params[1] = this;
				callback(this, params);
			});
		}
	});

    Q.Streams.get.onCalled.set(priv.onCalledHandler, 'Streams');
    Q.Streams.get.onResult.set(priv.onResultHandler, 'Streams');
});
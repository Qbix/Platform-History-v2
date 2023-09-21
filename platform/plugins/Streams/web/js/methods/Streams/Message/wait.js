Q.exports(function(priv){
    /**
    * Wait until a particular message is posted.
    * Used by Streams plugin to make sure messages arrive in order.
    * Call this with ordinal = -1 to load the latest messages.
    *
    * @static
    * @method wait
    * @param {String} publisherId
    * @param {String} streamName
    * @param {Number} ordinal The ordinal of the message to wait for, or -1 to load latest messages
    * @param {Function} callback Called whenever all the previous messages have been processed.
    *   The first parameter is [arrayOfOrdinals] that were processed,
    *   where latest < ordinals <= ordinal.
    * @param {Object} [options] A hash of options which can include:
    *   @param {Number} [options.max=5] The maximum number of messages to wait and hope they will arrive via sockets. Any more and we just request them again.
    *   @param {Number} [options.timeout=1000] The maximum amount of time to wait and hope the messages will arrive via sockets. After this we just request them again.
    *   @param {Number} [options.unlessSocket=true] Whether to avoid doing any requests when a socket is attached and user is a participant in the stream
    *   @param {Boolean} [options.evenIfNotRetained] Set this to true to wait for messages posted to the stream, in the event that it wasn't cached or retained.
    *   @param {Boolean} [options.checkMessageCache] Set this to true to also the message cache 
    * @return {Boolean|null|Q.Pipe}
    *   Returns false if the cached stream already got this message.
    *   Returns true if we decided to send a request for the messages.
    *   Returns new Q.Promise if we decided to wait for messages to arrive via socket.
    *   Returns null if no attempt was made because ordinal=-1 and stream wasn't cached.
    *   In this last case, the callback is not called.
    */
    return function _Streams_Message_wait (publisherId, streamName, ordinal, callback, options) {
        var o = Q.extend({}, Q.Streams.Message.wait.options, options);
        var alreadyCalled = false, handlerKey;
        var latest = Q.Streams.Message.latestOrdinal(publisherId, streamName, o.checkMessageCache);
        var ps = Q.Streams.key(publisherId, streamName);
        var wasRetained = priv._retainedStreams[ps];
        if (!latest && !wasRetained && !o.evenIfNotRetained) {
            // There is no cache for this stream, so we won't wait for previous messages.
            return null;
        }
        if (ordinal >= 0 &&  ordinal <= latest && latest > 0) {
            // The cached stream already got this message, or the message arrived on the client
            Q.handle(callback, this, [[]]);
            return false;
        }
        var waiting = {};
        var nodeUrl = Q.nodeUrl({
            publisherId: publisherId,
            streamName: streamName
        });
        var socket = Q.Users.Socket.get(nodeUrl);
        if (!socket || ordinal - o.max > latest) {
            return _tryLoading();
        }
        // If we are here, then socket is available
        if (ordinal < 0) {
            // Requested to wait for the latest messages
            var participant;
            if (o.unlessSocket) {
                Q.Streams.get.cache.each([publisherId, streamName], function (key, info) {
                    var p = Q.getObject("subject.participant", info);
                    if (p && p.state === 'participating'
                    && info.subject.readLevel >= 40) {
                        participant = p;
                        return false;
                    }
                });
            }
            if (!participant) {
                return _tryLoading();
            }
        }
        // Wait for messages to arrive via the socket,
        // and if they don't all arrive, try loading them via an http request.
        var t = setTimeout(_tryLoading, o.timeout);
        var ordinals = [];
        var p = new Q.Pipe();
        Q.each(latest+1, ordinal, 1, function (ord) {
            ordinals.push(ord);
            var event = Q.Streams.Stream.onMessage(publisherId, streamName, ord);
            handlerKey = event.addOnce(function () {
                p.fill(ord)();
                event.remove(handlerKey);
                handlerKey = null;
            });
            waiting[ord] = [event, handlerKey];
        });
        if (latest < ordinal) {
            p.add(ordinals, 1, function () {
                if (!alreadyCalled) {
                    Q.handle(callback, this, [ordinals]);
                }
                clearTimeout(t);
                alreadyCalled = true;
                return true;
            }).run();
        }
        return p;

        function _tryLoading() {
            // forget waiting, we'll request them again

            // We could have requested just the remaining ones, like this:
            // var filled = Q.Object(pipe.subjects),
            //	 remaining = Q.diff(ordinals, filled);
            // but we are going to request the entire range.

            if (ordinal < 0) {
                Q.Streams.Message.get.forget(publisherId, streamName, {min: latest+1, max: ordinal});
            }

            // Check if stream cached and if not then retrieve it for next time.
            // The batching mechanism will ensure it's constructed before any returned messages are processed.
            // if (!Streams.get.cache.get([publisherId, streamName])) {
            // 	Streams.get(publisherId, streamName);
            // }

            return Q.Streams.Message.get(publisherId, streamName, {min: latest+1, max: ordinal},
            function (err, messages, extras) {
                if (err) {
                    return Q.handle(callback, this, [null, err]);
                }
                priv._simulatePosting(messages, extras);
                ordinal = parseInt(ordinal);

                // if any new messages were encountered, updateMessageCache removed all the cached
                // results where max < 0, so future calls to Streams.Message.get with max < 0 will
                // make a request to the server

                // Do we have this message now?
                if (ordinal < 0 || Q.Streams.Message.get.cache.get([publisherId, streamName, ordinal])) {
                    // remove any event handlers still waiting for the event to be posted
                    Q.each(waiting, function (i, w) {
                        w[0].remove(w[1]);
                    });
                    if (!alreadyCalled) {
                        Q.handle(callback, this, [Object.keys(messages)]);
                    }
                    alreadyCalled = true;
                }
            });
        }
    };
})
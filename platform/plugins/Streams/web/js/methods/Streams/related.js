Q.exports(function(priv, Streams, Stream){
    /**
     * Get streams related to a given stream.
     * @static
     * @method related
     * @param {String} publisherId
     *  Publisher's user id
     * @param {String} streamName
     *	Name of the stream to/from which the others are related
    * @param {String|Array|null} relationType the type of the relation
    * @param {boolean|String} [isCategory=true]
    *  If false, returns the categories that this stream is related to.
    *  If true, returns all the streams this related to this category.
    *  If a string, returns all the streams related to this category with names prefixed by this string.
    * @param {Object} [options] optional object that can include:
    *   @param {Number} [options.limit] the maximum number of results to return
    *   @param {Number} [options.offset] the page offset that goes with the limit
    *   @param {Boolean} [options.ascending=false] whether to sort by ascending weight.
    *   @param {Number} [options.min] the minimum weight (inclusive) to filter by, if any
    *   @param {Number} [options.max] the maximum weight (inclusive) to filter by, if any
    *   @param {String} [options.prefix] optional prefix to filter the streams by
    *   @param {Array} [options.fields] if set, limits the "extended" fields exported to only these
    *   @param {Boolean} [options.stream] pass true here to fetch the latest version of the stream and ignore the cache.
    *   @param {Mixed} [options.participants]  Pass a limit here to fetch that many participants and ignore cache.
    *   @param {Boolean} [options.relationsOnly=false] Return only the relations, not the streams
    *   @param {Boolean} [options.messages] Pass a limit here to fetch that many recent messages and ignore cache.
    *   @param {Boolean} [options.withParticipant=true] Pass false here to return related streams without extra info about whether the logged-in user (if any) is a participant.
    *   @param {String} [options.messageType] optional String specifying the type of messages to fetch. Only honored if streamName is a string.
    *   @param {Object} [options."$Module/$fieldname"] any other fields you would like can be added, to be passed to your hooks on the back end
    * @param{function} callback
    *	if there were errors, first parameter is an array of errors
    *  otherwise, first parameter is null and the "this" object is the data containing "stream", "relations" and "streams"
    */
    Q.Streams.related = Q.getter(function Streams_related(publisherId, streamName, relationType, isCategory, options, callback) {
        if (!publisherId || !streamName) {
            throw new Q.Error("Streams.related is expecting publisherId and streamName to be non-empty");
        }
        if (typeof publisherId !== 'string') {
            throw new Q.Error("Streams.related is expecting publisherId as a string");
        }
        if ((relationType && typeof relationType !== 'string' && !Q.isArrayLike(relationType))) {
            throw new Q.Error("Streams.related is expecting relationType as string or array");
        }
        if (typeof isCategory !== 'boolean') {
            callback = options;
            options = isCategory;
            isCategory = undefined;
        }
        if (isCategory === undefined) {
            isCategory = true;
        }
        if (Q.typeOf(options) === 'function') {
            callback = options;
            options = {};
        }
        options = Q.extend({}, Q.Streams.related.options, options);
        var near = isCategory ? 'to' : 'from',
            far = isCategory ? 'from' : 'to',
            farPublisherId = far+'PublisherId',
            farStreamName = far+'StreamName',
            slotNames = [],
            fields = {"publisherId": publisherId, "streamName": streamName};
        if (!options.relationsOnly && !options.nodeUrlsOnly) {
            slotNames.push('relatedStreams');
        }
        if (!options.nodeUrlsOnly) {
            slotNames.push('relations');
        }
        slotNames.push('nodeUrls');
        if (options.messages) {
            slotNames.push('messages');
        }
        if (options.participants) {
            slotNames.push('participants');
        }
        if (options.withParticipant) {
            fields.withParticipant = true;
        }
        if (relationType != null) {
            fields.type = relationType;
        }
        Q.extend(fields, options);
        fields.omitRedundantInfo = true;
        if (isCategory) {
            fields.isCategory = isCategory;
        }
        if (Q.isArrayLike(fields.fields)) {
            fields.fields = fields.join(',');
        }

        var cached = Q.Streams.get.cache.get([publisherId, streamName]);
        if (!cached || options.stream) {
            if (typeof streamName === 'string'
                && streamName[streamName.length-1] !== '/') {
                slotNames.push('stream');
            } else {
                slotNames.push('streams');
            }
        }

        var baseUrl = Q.baseUrl({
            publisherId: publisherId,
            streamName: streamName
        });
        Q.req('Streams/related', slotNames, function (err, data) {
            var msg = Q.firstErrorMessage(err, data);
            if (msg) {
                var args = [err, data];
                Q.Streams.onError.handle.call(this, msg, args);
                Q.Streams.related.onError.handle.call(this, msg, args);
                return callback && callback.call(this, msg, args);
            }
            if (cached && cached.subject) {
                _processResults(null, cached.subject);
            } else {
                var extra = {};
                if (options.messages) {
                    extra.messages = data.slots.messages;
                }
                if (options.participants) {
                    extra.participants = data.slots.participants;
                }
                if (!data.slots.stream) {
                    msg = "Streams/related missing stream "+streamName+' published by '+publisherId;
                    callback && callback.call(this, msg);
                } else {
                    Q.Streams.Stream.construct(data.slots.stream, extra, _processResults, true);
                }
            }

            function _processResults(err, stream) {
                var msg = Q.firstErrorMessage(err);
                if (msg) {
                    var args = [err, stream];
                    return callback && callback.call(this, msg, args);
                }

                // Construct related streams from data that has been returned
                var p = new Q.Pipe(), keys = [], keys2 = {}, streams = {};
                Q.each(data.slots.relatedStreams, function (k, fields) {
                    if (!Q.isPlainObject(fields)) return;
                    var key = Q.Streams.key(fields.publisherId, fields.name);
                    keys.push(key);
                    keys2[key] = true;
                    Q.Streams.Stream.construct(fields, {}, function () {
                        streams[key] = this;
                        p.fill(key)();
                    }, true);
                });

                // Now process all the relations
                Q.each(data.slots.relations, function (j, relation) {
                    relation[near] = stream;
                    if (options.relationsOnly) {
                        return; // no need to get the related streams
                    }
                    var key = Q.Streams.key(relation[farPublisherId], relation[farStreamName]);
                    if (!keys2[key] && relation[farPublisherId] != publisherId) {
                        // Fetch all the related streams from other publishers
                        keys.push(key);
                        Q.Streams.get(relation[farPublisherId], relation[farStreamName], function (err, data) {
                            var msg = Q.firstErrorMessage(err, data);
                            if (msg) {
                                p.fill(key)(msg);
                                return;
                            }
                            relation[far] = this;
                            streams[key] = this;
                            p.fill(key)();
                            return;
                        });
                    } else {
                        relation[far] = streams[key];
                    }
                });

                // Finish setting up the pipe
                if (keys.length) {
                    p.add(keys, _callback);
                    p.run();
                } else {
                    _callback();
                }
                function _callback(params) {
                    // all the streams have been constructed
                    for (var k in params) {
                        if (params[k]) {
                            if (params[k][0] === undefined) {
                                delete params[k];
                            } else {
                                params[k] = params[k][0];
                            }
                        }
                    }
                    callback && callback.call({
                        relatedStreams: streams,
                        relations: data.slots.relations,
                        stream: stream,
                        nodeUrls: data.slots.nodeUrls,
                        errors: params
                    }, null);
                }
            }
        }, { fields: fields, baseUrl: baseUrl });
        priv._retain = undefined;
        var nodeUrl = Q.nodeUrl({
            publisherId: publisherId,
            streamName: streamName
        })
        var socket = Q.Socket.get('Q', nodeUrl);
        if (!socket) {
            // do not cache relations to/from this stream
            // since they may come to be out of date
            return false;
        }
    }, {
		throttle: 'Streams.related',
		prepare: function (subject, params, callback) {
			if (params[0] || !Q.isEmpty(subject.errors)) { // some error
				return callback(subject, params);
			}
			var keys = Object.keys(subject.relatedStreams).concat(['stream', 'nodeUrls']);
			var pipe = Q.pipe(keys, function () {
				callback(subject, params);
			});
			Stream.construct(subject.stream, {}, function () {
				subject.stream = this;
				pipe.fill('stream')();
			});
			Q.each(subject.relatedStreams, function (i) {
				Stream.construct(this, function () {
					subject.relatedStreams[i] = this;
					pipe.fill(i)();
				});
			});
			pipe.fill('nodeUrls')(subject.nodeUrls);
		}
	});

    Q.Streams.related.onCalled.set(priv.onCalledHandler, 'Streams');  
    Q.Streams.related.onResult.set(priv.onResultHandler, 'Streams');  
})
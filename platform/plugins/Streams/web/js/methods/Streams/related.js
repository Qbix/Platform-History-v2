Q.exports(function(priv){
    return function Streams_related(publisherId, streamName, relationType, isCategory, options, callback) {
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
        var socket = Q.Users.Socket.get(nodeUrl);
        if (!socket) {
            // do not cache relations to/from this stream
            // since they may come to be out of date
            return false;
        }
    }
    
})
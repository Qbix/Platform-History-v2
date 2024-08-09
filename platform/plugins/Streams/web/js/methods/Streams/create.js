Q.exports(function(priv){
    /**
    * Create a new stream
    * @static
    * @method create
    * @param {Object} fields
    *  Should contain at least the publisherId and type of the stream.
    *  Fields are passed to the Streams/stream POST handler.
    *  See documentation for that handler for what fields can be passed,
    *  including things like "private": ["invite"] "notices": true or "accessProfileName": "public"
    *  The attributes field can be an object.
    * @param {Function} callback
    *	if there were errors, first parameter is the error message
    *  otherwise, first parameter is null and second parameter is a Streams.Stream object
    * @param {Object} [related] Optional information to add a relation from the newly created stream to another one. Can include:
    *   @param {String} [related.publisherId] the id of whoever is publishing the related stream
    *   @param {String} [related.streamName] the name of the related stream
    *   @param {Mixed} [related.type] the type of the relation
    *   @param {Mixed} [related.weight=1] the weight of the relation, if user has at least testWriteLevel('relations')
    *   @param {Object} [related.inheritAccess] pass true to inherit access from the stream being related to
    * @param {Object} [options] Any extra options involved in creating the stream
    *   @param {Object} [options.fields] Used to override any other fields passed in the request
    *   @param {Object} [options.streamName] Overrides fields.name . You can set a specific stream name from Streams/possibleUserStreams config
    *   @param {String} [options.filename] Overrides the default filename for file uploads
    *   @param {HTMLElement} [options.form] If you want to upload a file or an icon, pass
    *	a form element here which includes input elements of type "file", named "file" or "icon".
    *	If they have files selected in them, they will be passed along with the rest of the
    *	fields. Setting this option will cause a call to Q.formPost which will load the result
    *	in an iframe. That resulting webpage must contain javascript to call the resultFunction.
    * @param {String} [options.resultFunction=null] The path to the function to handle inside the
    *	contentWindow of the resulting iframe, e.g. "Foo.result".
    *	Your document is supposed to define this function if it wants to return results to the
    *	callback's second parameter, otherwise it will be undefined
    */
    return function _Streams_create(fields, callback, related, options) {
        var slotNames = ['stream'];
        options = options || {};
        fields = Q.copy(fields);
        if (options.fields) {
            Q.extend(fields, 10, options.fields);
        }
        if (options.streamName) {
            fields.name = options.streamName;
        }
        if (fields.icon) {
            slotNames.push('icon');
        }
        if (fields.attributes && typeof fields.attributes === 'object') {
            fields.attributes = JSON.stringify(fields.attributes);
        }
        if (related) {
            if (!related.publisherId || !related.streamName) {
                throw new Q.Error("Streams.create related needs publisherId and streamName");
            }
            fields['Q.Streams.related.publisherId'] = related.publisherId;
            fields['Q.Streams.related.streamName'] = related.streamName || related.name;
            fields['Q.Streams.related.type'] = related.type;
            fields['Q.Streams.related.weight'] = related.weight;
            fields['Q.Streams.related.inheritAccess'] = related.inheritAccess;
            slotNames.push('messageTo');
        }
        var baseUrl = Q.baseUrl({
            publisherId: fields.publisherId,
            streamName: "" // NOTE: the request is routed to wherever the "" stream would have been hosted
        });
        fields["Q.clientId"] = Q.clientId();
        if (options.form) {
            fields["file"] = {
                path: 'Q/uploads/Streams'
            }
        }
        var _r = priv._retain;
        Q.req('Streams/stream', slotNames, function Stream_create_response_handler(err, data) {
            var msg = Q.firstErrorMessage(err, data);
            if (msg) {
                var args = [err, data];
                Q.Streams.onError.handle.call(this, msg, args);
                Q.Streams.create.onError.handle.call(this, msg, args);
                return callback && callback.call(this, msg, args);
            }
            if (related) {
                Q.Streams.related.cache.removeEach([related.publisherId, related.streamName]);
            }
            Q.Streams.Stream.construct(data.slots.stream, {},
                function Stream_create_construct_handler (err, stream) {
                    var msg = Q.firstErrorMessage(err);
                    if (msg) {
                        return callback && callback.call(stream, msg, stream, data.slots.icon);
                    }
                    if (_r) {
                        stream.retain(_r);
                    }
                    var extra = {};
                    extra.icon = data.slots.icon;
                    if (related && data.slots.messageTo) {
                        var m = extra.messageTo = Q.Streams.Message.construct(data.slots.messageTo, true);
                        extra.related = {
                            publisherId: related.publisherId,
                            streamName: related.streamName,
                            type: related.type,
                            weight: m.getInstruction('weight')
                        };
                    }
                    callback && callback.call(stream, null, stream, extra, data.slots);
                    // process various messages posted to Streams/participating
                    priv._refreshUnlessSocket(Q.Users.loggedInUserId(), 'Streams/participating');
                    if (related) {
                        // process possible relatedTo messages posted
                        priv._refreshUnlessSocket(related.publisherId, related.streamName);
                    }
                    return;
                }, true);
        }, {
            method: 'post',
            fields: fields,
            baseUrl: baseUrl,
            form: options.form,
            resultFunction: options.resultFunction
        });
        priv._retain = undefined;
    };
})
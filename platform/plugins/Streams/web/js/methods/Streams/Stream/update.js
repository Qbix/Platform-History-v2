Q.exports(function(priv){
    return function _Streams_Stream_update(stream, fields, onlyChangedFields) {
        if (!stream || !fields) {
            return false;
        }
        var publisherId = stream.fields.publisherId;
        var streamName = stream.fields.name;
        var updated = {}, cleared = [], k;

        // events about updated fields
        for (k in fields) {
            if (onlyChangedFields
            && fields[k] === stream.fields[k]
            && !Q.has(onlyChangedFields, k)) {
                continue;
            }
            Q.handle(
                Q.getObject([publisherId, streamName, k], priv._streamFieldChangedHandlers),
                stream,
                [fields, k, onlyChangedFields]
            );
            Q.handle(
                Q.getObject([publisherId, '', k], priv._streamFieldChangedHandlers),
                stream,
                [fields, k, onlyChangedFields]
            );
            Q.handle(
                Q.getObject(['', streamName, k], priv._streamFieldChangedHandlers),
                stream,
                [fields, k, onlyChangedFields]
            );
            updated[k] = fields[k];
        }
        if (!onlyChangedFields || !Q.isEmpty(updated)) {
            Q.handle(
                Q.getObject([publisherId, streamName, ''], priv._streamFieldChangedHandlers),
                stream,
                [fields, updated, onlyChangedFields]
            );
            Q.handle(
                Q.getObject([publisherId, '', ''], priv._streamFieldChangedHandlers),
                stream,
                [fields, updated, onlyChangedFields]
            );
            Q.handle(
                Q.getObject(['', streamName, ''], priv._streamFieldChangedHandlers),
                stream,
                [fields, updated, onlyChangedFields]
            );
        }
        if (('attributes' in fields)
        && (!onlyChangedFields || fields.attributes != stream.fields.attributes)) {
            var attributes = JSON.parse(fields.attributes || "{}");
            var obj;
            updated = {};
            cleared = [];

            // events about cleared attributes
            var streamAttributes = stream.getAllAttributes();
            for (k in streamAttributes) {
                if (k in attributes) {
                    continue;
                }
                obj = {};
                obj[k] = undefined;
                Q.handle(
                    Q.getObject([publisherId, streamName, k], priv._streamAttributeHandlers),
                    stream,
                    [fields, obj, [k], onlyChangedFields]
                );
                updated[k] = undefined;
                cleared.push(k);
            }

            // events about updated attributes
            var currentAttributes = JSON.parse(stream.fields.attributes || "{}");
            for (k in attributes) {
                if (JSON.stringify(attributes[k]) === JSON.stringify(currentAttributes[k])) {
                    continue;
                }
                obj = {};
                obj[k] = attributes[k];
                Q.handle(
                    Q.getObject([publisherId, streamName, k], priv._streamAttributeHandlers),
                    stream,
                    [attributes, k, onlyChangedFields]
                );
                updated[k] = attributes[k];
            }
            Q.handle(
                Q.getObject([publisherId, streamName, ''], priv._streamAttributeHandlers),
                stream,
                [attributes, updated, cleared, onlyChangedFields]
            );
            Q.handle(
                Q.getObject([publisherId, '', ''], priv._streamAttributeHandlers),
                stream,
                [attributes, updated, cleared, onlyChangedFields]
            );
        }
        // Now time to replace the fields in the stream with the incoming fields
        Q.extend(stream.fields, fields);
        priv.prepareStream(stream);
        priv.updateMessageTotalsCache(publisherId, streamName, stream.messageTotals);
        priv.updateStreamCache(stream);
        priv.updateAvatarCache(stream);
    }
});
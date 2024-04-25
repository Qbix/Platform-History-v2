Q.exports(function(priv){
    /**
    * Relates streams to one another
    * @method relate
    * @param {String} publisherId the publisher id of the stream to relate to
    * @param {String} streamName the name of the stream to relate to
    * @param {String} relationType the type of the relation, such as "parent" or "photo"
    * @param {String} fromPublisherId the publisher id of the stream to relate from
    * @param {String} fromStreamName the name of the stream to relate from
    * @param {Function} [callback] callback to call with the results
    * @param {Object} [options]
    * @param {Object} options.inheritAccess whether to inherit access as well as relate
    *  First parameter is the error, the second will be relations data
    */
    return function Streams_relate (publisherId, streamName, relationType, fromPublisherId, fromStreamName, callback, options) {
        if (!Q.plugins.Users.loggedInUser) {
            throw new Q.Error("Streams.relate: Not logged in.");
        }
        var slotName = "result";
        var fields = {
            "toPublisherId": publisherId,
            "toStreamName": streamName,
            "type": relationType,
            "fromPublisherId": fromPublisherId,
            "fromStreamName": fromStreamName,
            "inheritAccess": Q.getObject("inheritAccess", options),
            "Q.clientId": Q.clientId()
        };
        // TODO: When we refactor Streams to support multiple hosts,
        // the client will have to post this request to both hosts if they are different
        // or servers will have tell each other on their own
        var baseUrl = Q.baseUrl({publisherId, streamName});
        Q.req('Streams/related', [slotName], function (err, data) {
            callback && callback.call(this, err, Q.getObject('slots.result', data) || null);
            priv._refreshUnlessSocket(publisherId, streamName);
            priv._refreshUnlessSocket(fromPublisherId, fromStreamName);
        }, { method: 'post', fields, baseUrl });
        priv._retain = undefined;
    };
});
Q.exports(function(priv){
    /**
     * Later we will probably make Streams.Relation objects which will provide easier access to this functionality.
     * For now, use this to update weights of relations, etc.
     *
     * @method updateRelation
     * @param {String} toPublisherId
     * @param {String} toStreamName
     * @param {String} relationType
     * @param {String} fromPublisherId
     * @param {String} fromStreamName
     * @param {Number} weight
     * @param {Boolean} adjustWeights
     * @param {Function} callback
     */
    return function Streams_updateRelation (
        toPublisherId,
        toStreamName,
        relationType,
        fromPublisherId,
        fromStreamName,
        weight,
        adjustWeights,
        callback
    ) {
        if (!Q.plugins.Users.loggedInUser) {
            throw new Q.Error("Streams.relate: Not logged in.");
        }
        // We will send a request to wherever (toPublisherId, toStreamName) is hosted
        var slotName = "result";
        var fields = {
            "toPublisherId": toPublisherId,
            "toStreamName": toStreamName,
            "type": relationType,
            "fromPublisherId": fromPublisherId,
            "fromStreamName": fromStreamName,
            "weight": weight,
            "adjustWeights": adjustWeights,
            "Q.clientId": Q.clientId()
        };
        var baseUrl = Q.baseUrl({
            publisherId: toPublisherId,
            streamName: toStreamName
        });
        Q.req('Streams/related', [slotName], function (err, data) {
            var message = Q.getObject('slots.result.message', data);
            callback && callback.call(this, err, Q.getObject('slots.result', data) || null);
        }, { method: 'put', fields: fields, baseUrl: baseUrl });
        priv._retain = undefined;
    };

})
Q.exports(function(priv){
    /**
    * Removes relations from streams to one another
    * @static
    * @method unrelate
    * @param {String} publisherId the publisher id of the stream to relate to
    * @param {String} streamName the name of the stream to relate to
    * @param {String} relationType the type of the relation, such as "parent" or "photo"
    * @param {String} fromPublisherId the publisher id of the stream to relate from
    * @param {String} fromStreamName the name of the stream to relate from
    * @param {Function} [callback] callback to call with the results
    *  First parameter is the error, the second will be relations data
    */
   return function _Stream_unrelate (publisherId, streamName, relationType, fromPublisherId, fromStreamName, callback) {
       if (!Q.plugins.Users.loggedInUser) {
           throw new Q.Error("Streams.unrelate: Not logged in.");
       }
       var slotName = "result";
       var fields = {
           "toPublisherId": publisherId,
           "toStreamName": streamName,
           "type": relationType,
           "fromPublisherId": fromPublisherId,
           "fromStreamName": fromStreamName,
           "Q.clientId": Q.clientId()
       };
       // TODO: When we refactor Streams to support multiple hosts,
       // the client will have to post this request to both hosts if they are different
       // or servers will have tell each other on their own
       var baseUrl = Q.baseUrl({
           publisherId: publisherId,
           streamName: streamName
       });
       Q.req('Streams/related', [slotName], function (err, data) {
           callback && callback.call(this, err, Q.getObject('slots.result', data) || null);
       }, { method: 'delete', fields: fields, baseUrl: baseUrl });
       priv._retain = undefined;
   };
})
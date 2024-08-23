Q.exports(function(){
    /**
    * Get subscription plans the stream related to
    * @method getPlansRelated
    * @static
    *  @param {Streams_Stream|Object} stream - can be object {publisherId:..., streamName:...}
    *  @param {Function} [callback] - The function to call, receives (err, streams, relations)
    */
    return function getPlansRelated (stream, callback) {
        Q.Streams.related(
            stream.publisherId || stream.fields.publisherId,
            stream.streamName || stream.fields.name,
            Q.Assets.Subscriptions.plan.relationType,
            false,
            function (err) {
                if (err) {
                    return callback(err);
                }

                Q.handle(callback, this, [null, this.relatedStreams, this.relations]);
            }
        );
    }
})
Q.exports(function(priv){
    /**
    * Send some payload which is not saved as a message in the stream's history,
    * but is broadcast to everyone curently connected by a socket and participating
    * or observing the stream.
    * This can be used for read receipts, "typing..." indicators, cursor movements and more.
    * Ephemerals payloads are generated on clients, and clients can lie.
    * Ephemeral payloads can reference stream state hashes, to prove that the client
    * saw a certain state of the stream (i.e. messages up to a certain ordinal)
    * and the server also adds "Streams.messageCount" to the ephemeral payload when sending it out,
    * so others know what the messageCount was on the server when it was sent out.
    * These two things can help localize the ephemeral message in time.
    * @static
    * @method ephemeral
    * @param {String} publisherId id of publisher which is publishing the stream
    * @param {String} streamName name of stream to observe
    * @param {Object} payload the payload to send. It must have "type" set at least.
    * @param {Boolean} [dontNotifyObservers] whether to skip notifying observers who aren't registered users
    * @param {Function} [callback] receives (err, result) as parameters
    */
    return function _Stream_ephemeral (
        publisherId, streamName, payload, dontNotifyObservers, callback
    ) {
        Q.Streams.socketRequest('Streams/ephemeral', publisherId, streamName, payload, dontNotifyObservers, callback);
    };
})
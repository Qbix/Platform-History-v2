Q.exports(function(priv){
    /**
    * Issues a request via a socket, if one is open.
    * The request is sent to the node responsible for the stream,
    * whose url is calculated by calling Q.nodeUrl().
    * The first three parameters are documented, but you can pass more,
    * and they will be sent to the node.
    * @param {String} event the name of the socket.io event, such as "Streams/observe"
    * @param {String} publisherId the id of the stream's publisher
    * @param {String} streamName the name of the stream. Put any additional parameters after this.
    * @param {Function} [callback] Comes at the end. Any socket.io acknowledgement callback
    * @return {Q.Socket} returns null if request wasn't sent, otherwise returns the socket
    */
    return function Streams_socketRequest(event, publisherId, streamName, callback) {
        // if (!Q.sessionId()) {
        // 	throw new Q.Error("Stream.observe: a valid session is required");
        // }
        var nodeUrl = Q.nodeUrl({
            publisherId: publisherId,
            streamName: streamName
        });
        var socket = Q.Users.Socket.get(nodeUrl);
        if (!socket) {
            return null;
        }
        var args = Array.prototype.slice.call(arguments, 0);
        args.splice(1, 0, Q.clientId(), Q.getObject('Q.Users.capability'));
        socket.socket.emit.apply(socket.socket, args);
        return socket;
    };
})
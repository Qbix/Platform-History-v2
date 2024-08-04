Q.exports(function(){
    /**
    * Get the Assets/user/credits stream published by the logged-in user, if any
    * @method userStream
    * @static
    * @param {Function} [callback] The function to call, receives (err, stream)
    * @param {Object} [options]
    * @param {String|true} [options.retainWith] key to retain the stream with, if any
    */
    return function getStream(callback, options) {
        var liu = Q.Users.loggedInUser;
        if (!liu) {
            callback(new Q.Error("Credits/userStream: not logged in"), null);
            return false;
        }
        var S = Q.Streams;
        if (options && options.retainWith) {
            S = S.retainWith(options.retainWith);
        }
        S.get(Q.Users.communityId, 'Assets/credits/' + liu.id, callback);
    }
})
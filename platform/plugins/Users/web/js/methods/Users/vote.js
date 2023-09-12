Q.exports(function (Users, priv) {

    /**
     * Users plugin's front end code
     *
     * @module Users
     * @class Users
     */
    /**
	 * Votes for something
	 * @static
	 * @method vote
	 * @param {String} forType The type of thing to vote for
	 * @param {String} forId The id of thing to vote for
	 * @param {Number} [value=1] the value the user has voted for, such as a rating etc.
	 * @param {Function} [callback] receives err, result
	 */
    return function Users_vote(forType, forId, value, callback) {
        var fields = {
            forType: forType,
            forId: forId
        };
        if (value !== undefined) {
            fields.value = value;
        }
        Q.req('Users/vote', ['vote'], function (err, result) {
            var msg = Q.firstErrorMessage(err, result && result.errors);
            if (msg) {
                return console.warn(msg);
            }
            Q.handle(callback, Users, [err, result]);
        }, {method: 'POST', fields: fields});
    };

});
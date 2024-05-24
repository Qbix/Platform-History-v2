Q.exports(function (Q) {
    /**
     * Q plugin's front end code
     *
     * @module Q
     * @class Q.Data
     */

    /**
     * Generate a digest
     * @static
     * @method digest
     * @param {String} algorithm 
     * @param {String} payload 
     * @param {Function} callback receives (err, result)
     * @return {Q.Promise}
     */
    return function Q_Data_digest(algorithm, payload, callback) {
        var encoded = new TextEncoder().encode(payload);
        return crypto.subtle.digest(algorithm, encoded)
        .then(function (buffer) {
            var result = Array.from(new Uint8Array(buffer))
            .map(function (b) {
                return b.toString(16).padStart(2, '0');
            }).join('');
            callback && callback(null, result);
            return result;
        });
    };

});
Q.exports(function (Q) {
    /**
     * Q plugin's front end code
     *
     * @module Q
     * @class Q.Data
     */

    /**
     * Encodes text data with TextEncoder, then signs it with
     * each of the private keys. Returns a promise that is rejected
     * if any of the keys fail to be imported.
     * @static
     * @method sign
     * @param {String} data the data to sign
     * @param {Array} privateKeyPKCS8Strings array of strings containing
     *   PKCS8 encodings of private keys
     * @param {Object} [algo] youc an specify a different algorithm
     * @param {String} [algo.name="ECDSA"]
     * @param {String} [algo.namedCurve="P-256"]
     * @param {String} [algo.hash="SHA-256"]
     * @param {Function} callback receives (err, result)
     * @return {Q.Promise} Resolves an array of ArrayBuffers containing
     *   data signed with each of the corresponding public keys.
     *   (You can use Q.Data.toBase64 to convert them into strings).
     *   Or rejects if any of the keys fail to be imported.
     */
    return function Q_Data_sign(data, privateKeyPKCS8Strings, algo) {
        algo = Q.extend({
            name: 'ECDSA',
            namedCurve: 'P-256',
            hash: { name: "SHA-256" }
        }, algo);
        return Q.Promise.all(
            privateKeyPKCS8Strings.map(pks => 
                crypto.subtle.importKey('pkcs8', Q.Data.fromBase64(pks), algo, false, ['sign'])
                .then(privateKey => crypto.subtle.sign(algo, privateKey, new TextEncoder().encode(data)))
            )
        );
    };

});
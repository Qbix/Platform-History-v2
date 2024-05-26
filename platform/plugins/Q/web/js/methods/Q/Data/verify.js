Q.exports(function (Q) {
    /**
     * Q plugin's front end code
     *
     * @module Q
     * @class Q.Data
     */

    /**
     * Encodes text data with TextEncoder, then verifies it with
     * each of the public keys.
     * @static
     * @method sign
     * @param {String} data the signed payload to verify
     * @param {Array} publicKeyRawStrings array of exported public keys
     * @param {Array} signatures array of ArrayBuffer signatures
     *   previously generated with the corresponding public keys.
     *   Use Q.Data.fromBase64() if the strings are in String format.
     * @param {Object} [algo] you can specify a different algorithm
     * @param {String} [algo.name="ECDSA"]
     * @param {String} [algo.namedCurve="P-256"]
     * @param {String} [algo.hash="SHA-256"]
     * @param {Function} callback receives (err, result)
     * @return {Q.Promise} Resolves with array of booleans corresponding
     *   to each public key, indicating whether the verifications succeeded.
     *   Or rejects if any of the keys fail to be imported.
     */
    return function Q_Data_verify(data, publicKeyRawStrings, signatures, algo) {
        algo = Q.extend({
            name: 'ECDSA',
            namedCurve: 'P-256',
            hash: { name: "SHA-256" }
        }, algo);
        return Q.Promise.all(
            publicKeyRawStrings.map((pks, i) => 
                crypto.subtle.importKey('raw', Q.Data.fromBase64(pks), algo, false, ['verify']
            ).then(publicKey => crypto.subtle.verify(algo, publicKey, signatures[i], new TextEncoder().encode(data)))
        )
    );
  };

});
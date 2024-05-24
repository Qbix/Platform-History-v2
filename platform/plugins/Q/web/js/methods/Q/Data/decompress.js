Q.exports(function (Q) {
    /**
     * Q plugin's front end code
     *
     * @module Q
     * @class Q.Data
     */

    /**
     * Uncompress a blob that was compressed with an algorithm.
     * @static
     * @method decompress
     * @param {ArrayBuffer} buffer
     * @param {Function} callback
     * @param {Object} options
     * @param {String} [options.algorithm='gzip']
     * @return {Q.Promise}
     */
    return function Q_Data_decompress(buffer, callback, options) {
        var algorithm = (options && options.algorithm) || 'gzip';
        return new Q.Promise(function (res) {
            var ds = new DecompressionStream(algorithm);
            var blob = new Blob([buffer]);
            var decompressedStream = blob.stream().pipeThrough(ds);
            var decompressedResponse = new Response(decompressedStream);
            decompressedResponse.blob().then(function (blob) {
                return blob.text();
            }).then(function (text) {
                callback && callback(text);
                res(text);
            });
        });
    };

});
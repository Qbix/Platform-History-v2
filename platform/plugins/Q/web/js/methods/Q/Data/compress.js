Q.exports(function (Q) {
    /**
     * Q plugin's front end code
     *
     * @module Q
     * @class Q.Data
     */

    /**
     * Compress data with an algorithm.
     * If the data is not a string, then it's stringified as JSON
     * and mimeType is set as application/json.
     * Use it like this: Q.Data.compress(data).then(Q.Data.toBase64);
     * @static
     * @method compress
     * @param {String} data
     * @param {Function} callback
     * @param {Object} options
     * @param {String} [options.algorithm='gzip']
     * @param {String} [options.mimeType] If data was not a string, then it's encoded with
     * @return {Q.Promise} that resolves to an ArrayBuffer
     */
    return function Q_Data_compress(data, callback, options) {
        var algorithm = (options && options.algorithm) || 'gzip';
        var mimeType = (options && options.mimeType);	
        return new Q.Promise(function (res) {
            if (typeof data !== 'string') {
                data = JSON.stringify(data);
                mimeType = 'application/json';
            }
            var stream = new Blob([data], {type: mimeType}).stream();
            var compressedReadableStream = stream.pipeThrough(
                new CompressionStream(algorithm)
            );
            var compressedResponse = new Response(compressedReadableStream);
            compressedResponse.blob().then(function (blob) {
                return blob.arrayBuffer();
            }).then(function (buffer) {
                callback && callback(buffer);
                res(buffer);
            });
        });
    };

});
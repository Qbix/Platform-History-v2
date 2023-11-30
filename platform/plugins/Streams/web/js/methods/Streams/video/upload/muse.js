Q.exports(function (params, callback) {

    if (params.streamName) {
        return Q.req('Streams/stream', 'data', callback, {
            fields: params,
            method: "put"
        });
    }

    params.fileReader(function () {
        delete params.fileReader;
        Q.handle(callback, null, [null, params]);
    });
});
Q.exports(function (params, callback) {

    Q.req('Streams/stream', 'data', callback, {
        fields: params,
        method: "put"
    });

});
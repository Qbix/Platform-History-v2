Q.exports(function (params, callback) {

    Q.req('Streams/stream', 'data', callback, {
        fields: Q.extend({video: true}, params),
        method: "put"
    });

});
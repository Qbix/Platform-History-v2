Q.exports(function (params, callback) {

    // TODO: please implement it with a call to
    // Streams/video POST and document Streams/video/post.php handler properly
    // Right now, Streams/video/post takes existing videos from youtube/vimeo
    // but please call Q::handle("Streams/video/create/$provider") with $_REQUEST params
    // if $_REQUEST['create'] is set, otherwise call
    // Q::handle("Streams/video/import/$provider") and put handlers in files


    // the below code is to get you started
    // see https://developer.vimeo.com/api/upload/videos
    // and please extend Q.request() to handle "headers" option
    var p = Q.extend({
        approach: 'tus',
        size: size
    }, params);
    Q.req('Streams/video', 'data', function (result) {
        var fem = Q.firstErrorMessage(result);
        if (fem) {
            // wasn't able to create it
            return;
        }
        var data = result.slots.data;
        // then do Q.request({ url: data.upload_url, method: 'PATCH' })
        Q.request(data.upload_link, {
            extend: false,
            method: 'PATCH',
            headers: {
                'Tus-Resumable': '1.0.0',
                'Upload-Offset': 0,
                'Content-Type': 'application/offset+octet-stream'
            }
        }, function () {
            Q.request(data.upload_link, {
                extend: false,
                method: 'HEAD',
                accept: 'application/vnd.vimeo.*+json;version=3.4'
            }, function () {
                // if not verified successfully, then callback(err)
            });
        });
    }, {
        fields: p,
        method: "post"
    });

});
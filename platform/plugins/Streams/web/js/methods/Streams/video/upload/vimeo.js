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

    Q.req("Streams/vimeo", ["intent"], function (err, response) {
        if (err) {
            return;
        }

        var intent = response.slots.intent;
        var uploadLink = intent.upload.upload_link;

        fetch(uploadLink, {
            method: 'PATCH',
            headers: {
                'Tus-Resumable': '1.0.0',
                'Upload-Offset': 0,
                'Content-Type': 'application/offset+octet-stream'
            },
            body: params.file
        }).then(function( response ){
            var videoId = intent.uri.split('/').pop();
            var videoUrl = 'https://vimeo.com/' + videoId;
            params.attributes['Q.file.url'] = videoUrl;
            params.attributes['Streams.videoUrl'] = videoUrl;
            params.attributes['provider'] = 'vimeo';
            params.attributes['videoId'] = videoId;
            params.attributes['Q.file.size'] = params.file.size;

            if (params.streamName) {
                Q.req('Streams/stream', 'data', callback, {
                    fields: params,
                    method: "put"
                });
            } else {
                Q.handle(callback, null, [null, params]);
            }
        }).catch(function (err) {
            Q.handle(callback, null, [err]);
        });

        var timerId = setInterval(function () {
            fetch(uploadLink, {
                method: 'HEAD',
                cache: "no-cache",
                headers: {
                    'Tus-Resumable': '1.0.0',
                    'Accept': 'application/vnd.vimeo.*+json;version=3.4'
                }
            }).then(function (response) {
                var length = parseInt(response.headers.get('Upload-Length'));
                var offset = parseInt(response.headers.get('Upload-Offset'));
                console.log(response.headers.get('Upload-Offset') + " : " + response.headers.get('Upload-Length'));
                if (offset < length) {
                    console.log(Math.round(offset/length*100) + "%");
                    return;
                }

                clearInterval(timerId);
            });
        }, 2000);

    }, {
        method: "post",
        fields: {
            size: params.file.size,
            name: params.file.name
        }
    });
});
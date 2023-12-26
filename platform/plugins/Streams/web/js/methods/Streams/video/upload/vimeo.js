Q.exports(function (params, callback) {
    class VimeoUploader {
        constructor() {
            var that = this;
            Q.Dialogs.push({
                className: "Vimeo_uploader",
                content: "<div class='Vimeo_uploader_content'><div></div></div><div class='Vimeo_uploader_info'></div>",
                onActivate: function (dialog) {
                    that.$dialog = $(dialog);
                },
                onClose: function () {
                    that.close();
                }
            });
        };
        update(bytesUploaded, bytesTotal) {
            if (this.closed()) {
                return;
            }

            var percentage = (bytesUploaded / bytesTotal * 100).toFixed(2) + "%";
            $(".Vimeo_uploader_content > div", this.$dialog).css("width", percentage);
            $(".Vimeo_uploader_info", this.$dialog).html("Uploaded {{offset}} of {{length}} ({{percents}})".interpolate({
                offset: Q.humanReadable(bytesUploaded, { bytes:true }),
                length: Q.humanReadable(bytesTotal, { bytes:true }),
                percents: percentage
            }));

            if (bytesUploaded >= bytesTotal) {
                this.$dialog.plugin('Q/dialog', 'close');
                this.close();
            }
        };
        getInfo(videoId, callback) {
            var i = 1;
            var timerId = setInterval(function () {
                //console.log("Vimeo get info attempt " + i++);
                Q.req("Streams/vimeo", ["info"], function (err, response) {
                    if (err) {
                        return;
                    }

                    var duration = Q.getObject("slots.info.duration", response);
                    if (duration) {
                        clearInterval(timerId);
                        Q.handle(callback, null, [response.slots.info]);
                    }
                }, {
                    fields: {videoId}
                });
            }, 3000);
        };
        close () {
            this.$dialog = false;
        };
        closed () {
            return this.$dialog === false;
        };
    }

    Q.addStylesheet("{{Streams}}/css/tools/vimeo.css", {slotName: 'Streams'});
    Q.req("Streams/vimeo", ["intent"], function (err, response) {
        if (err) {
            return;
        }

        var intent = response.slots.intent;
        var uploadLink = intent.upload.upload_link;
        var videoId = intent.uri.split('/').pop();
        var videoUrl = 'https://vimeo.com/' + videoId;

        Q.addScript("{{Q}}/js/tus.min.js", function () {
            var preloader = new VimeoUploader();
            var upload = new tus.Upload(params.file, {
                uploadUrl: uploadLink,
                onError: function(err) {
                    Q.handle(callback, null, [err]);
                },
                onProgress: function(bytesUploaded, bytesTotal) {
                    preloader.update(bytesUploaded, bytesTotal);
                },
                onSuccess: function() {
                    params.attributes['Q.file.url'] = videoUrl;
                    params.attributes['Streams.videoUrl'] = videoUrl;
                    params.attributes['provider'] = 'vimeo';
                    params.attributes['videoId'] = videoId;
                    params.attributes['Q.file.size'] = params.file.size;

                    preloader.getInfo(videoId, function (info) {
                        params.attributes['duration'] = info.duration;

                        if (params.streamName) {
                            Q.req('Streams/stream', 'data', callback, {
                                fields: params,
                                method: "put"
                            });
                        } else {
                            Q.handle(callback, null, [null, params]);
                        }
                    });
                }
            });

            // Start the upload
            upload.start()
        });
    }, {
        method: "post",
        fields: {
            size: params.file.size,
            name: params.file.name
        }
    });
});
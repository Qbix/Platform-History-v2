(function ($, window, undefined) {
    

    var ua = navigator.userAgent;
    var _isiOS = false;
    var _isAndroid = false;
    var _isiOSCordova = false;
    var _isAndroidCordova = false;
    if (ua.indexOf('iPad') != -1 || ua.indexOf('iPhone') != -1 || ua.indexOf('iPod') != -1) _isiOS = true;
    if (ua.indexOf('Android') != -1) _isAndroid = true;
    if (typeof cordova != 'undefined' && _isiOS) _isiOSCordova = true;
    if (typeof cordova != 'undefined' && _isAndroid) _isAndroidCordova = true;

    /**
     * Streams/webrtc/callCenter/client tool.
     * 
     * @module Streams
     * @constructor
     * @param {Object} options
     */
    Q.Tool.define("Streams/webrtc/callCenter/client", function (options) {
        var tool = this;
        
    },

        {
            publisherId: null,
            streamName: null,
            onRefresh: new Q.Event()
        },

        {
            refresh: function () {
                var tool = this;
            },
            declareStreamEventHandlers: function() {
                var tool = this;
                tool.livestreamStream.onMessage("Streams/livestream/start").set(function (stream, message) {
                    tool.syncLivestreamsList([message]);
                    tool.videoTabsTool.syncVideoTabsList.apply(tool);
                }, tool);
                tool.livestreamStream.onMessage("Streams/livestream/stop").set(function (stream, message) {
                    tool.syncLivestreamsList([message]);
                    tool.videoTabsTool.syncVideoTabsList.apply(tool);
                }, tool);
            },
            requestCall: function () {
                var tool = this;
                Q.prompt(null, function(topic) {
                    tool.currentWebRTCRoom = Q.Streams.WebRTC({
                        roomPublisherId: Q.Users.loggedInUserId(),
                        element: document.body,
                        relate: {
                            publisherId: tool.state.publisherId,
                            streamName: tool.state.streamName,
                            relationType: 'Streams/webrtc/callCenter/call'
                        },
                        startWith: { video: false, audio: true },
                        onWebRTCRoomCreated: function () {
                            let webrtcStream = tool.currentWebRTCRoom.roomStream();
                            webrtcStream.pendingFields.content = topic;
                            webrtcStream.save();
                        }
                    });

                    tool.currentWebRTCRoom.start();
                }, {
                    title: 'Enter call topic'
                })
                
            }         
        }

    );

})(window.jQuery, window);
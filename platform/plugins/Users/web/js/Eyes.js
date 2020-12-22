(function (Q, $) {

    var Users = Q.plugins.Users;
    var _debug = null;
    var WITHIN_VIEWPORT = 1;
    var OUTSIDE_VIEWPORT = 2;
	
    /**
     * Analyses what user is watching on screen
     * @class Users.Eyes
     * @constructor
     */
    Users.Eyes =  function Users_Eyes() {
        var that = this;

        /**
         * Active MediaStream
         * @class Users.mediaStream
         * @constructor
         */
        this.mediaStream = null

        /**
         * Whether user looking on screen or not
         * @class Users.state
         * @constructor
         */
        this.state = null;

        /**
         * Event is triggered eye moving detected
         * @param {Q.Event} anotherEvent
         * @return {Q.Event} A new Q.Event object
         */
        that.onMove = new Q.Event();

        /**
         * Event is triggered when user looked at screen at the first time
         * @param {Q.Event} anotherEvent
         * @return {Q.Event} A new Q.Event object
         */
        that.onEnter = new Q.Event();

        /**
         * Event is triggered when user looked outside of the screen
         * @param {Q.Event} anotherEvent
         * @return {Q.Event} A new Q.Event object
         */
        that.onLeave = new Q.Event();

        /**
         * Instance of webgazer (only one instance is possible)
         * @class Users.webgazerInstance
         * @constructor
         */
        that.webgazerInstance = null;

        this.start = function (callback, mediaStream) {
            that.stop();

            if(mediaStream != null){
                that.mediaStream = mediaStream;p
            }

            Q.addScript('{{Users}}/js/webgazer.js', function () {
                init();
            });


            function init() {
                if(that.mediaStream != null) {
                    startTracking(that.mediaStream, callback)
                } else {
                    navigator.mediaDevices.getUserMedia ({
                        'audio': false,
                        'video': true
                    }).then(function (stream) {
                        startTracking(stream, callback);
                    }).catch(function(err) {
                        console.error('EYES TRACKING ERROR' + err.name + ": " + err.message);
                    });
                }
            }

            async function startTracking(stream, callback) {
                that.mediaStream = stream;
                // Kalman Filter defaults to on. Can be toggled by user.
                window.applyKalmanFilter = true;
                // Set to true if you want to save the data even if you reload the page.
                window.saveDataAcrossSessions = true;

                //start the webgazer tracker
                that.webgazerInstance = await webgazer.setRegression('ridge') /* currently must set regression and tracker */
                //.setTracker('clmtrackr')
                    .setStaticVideo(stream)
                    .setGazeListener(function(data, clock) {
                        if(data) {
                            that.onMove.handle.call(null, data);
                            if (Math.sign(data.x) === -1 || Math.sign(data.y) === -1) {

                                if(Q.that.state === WITHIN_VIEWPORT || Q.that.state === null) {
                                    Q.handle(that.onLeave, data);
                                    that.state = OUTSIDE_VIEWPORT;
                                }
                            } else if(Math.sign(data.x) === 1 && Math.sign(data.y) === 1) {

                                if(that.state === OUTSIDE_VIEWPORT || that.state === null) {
                                    Q.handle(that.onEnter, data);
                                    that.state = WITHIN_VIEWPORT;
                                }

                            }
                        }

                    }).begin(function(e){
                        console.error(e)
                    });



                window.onbeforeunload = function() {
                    that.webgazerInstance.end();
                }

                that.webgazerInstance.showVideo(false);
                that.webgazerInstance.showFaceOverlay(false);
                that.webgazerInstance.showFaceFeedbackBox(false);
                that.webgazerInstance.showPredictionPoints(false); /* shows a square every 100 milliseconds where current prediction is */
                //Set up the webgazer video feedback.
                var setup = function() {
                    //Set up the main canvas. The main canvas is used to calibrate the webgazer.
                    var canvas = document.getElementById("plotting_canvas");
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                    canvas.style.position = 'fixed';
                };
                setup();

                Q.handle(callback);
            }

        }


        this.stop = function () {
            if(that.webgazerInstance != null) {
                that.webgazerInstance.end();
                that.webgazerInstance = null;
            }

            if(that.mediaStream != null) {
                that.mediaStream.getTracks().map(function (track) {
                    track.stop()
                })
            }
            that.state = null;
        }
    }


})(Q, jQuery);

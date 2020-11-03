(function (Q, $) {

    var Users = Q.plugins.Users;
    var _debug = null;
    const WITHIN_VIEWPORT = 1;
    const OUTSIDE_VIEWPORT = 2;
    /**
     * Analyses what user is watching on screen
     * @class Users.Eyes
     * @constructor
     */
    Users.Eyes =  function Users_Eyes() {}

    /**
     * Instance of webgazer (only one instance is possible)
     * @class Users.webgazerInstance
     * @constructor
     */
    Users.Eyes.webgazerInstance

    /**
     * Active MediaStream
     * @class Users.mediaStream
     * @constructor
     */
    Users.Eyes.mediaStream = null

    /**
     * Whether user looking on screen or not
     * @class Users.state
     * @constructor
     */
    Users.Eyes.state = null;

    /**
     * Event is triggered eye moving detected
     * @param {Q.Event} anotherEvent
     * @return {Q.Event} A new Q.Event object
     */
    Users.Eyes.onMove = new Q.Event();

    /**
     * Event is triggered when user looked at screen at the first time
     * @param {Q.Event} anotherEvent
     * @return {Q.Event} A new Q.Event object
     */
    Users.Eyes.onEnter = new Q.Event();

    /**
     * Event is triggered when user looked outside of the screen
     * @param {Q.Event} anotherEvent
     * @return {Q.Event} A new Q.Event object
     */
    Users.Eyes.onLeave = new Q.Event();

    /**
     * Start webcam eye tracking on the browser.
     * @method Eyes.start
     * @param {Object} options options for the method
     */
    Users.Eyes.start = function (callback) {
        Users.Eyes.stop();
        var webgazerInstance = null;


        if(Users.Eyes.webgazerInstance == null) {
            if(findScript('{{Users}}/js/webgazer.js')) {
                webgazerInstance = Users.Eyes.webgazerInstance;
                init();

            } else {
                Q.addScript('{{Users}}/js/webgazer.js', function () {
                    Users.Eyes.webgazerInstance = webgazerInstance = webgazer;
                    init();
                });
            }
        } else {
            webgazerInstance = Users.Eyes.webgazerInstance
            webgazerInstance.clearData();
        }

        function init() {
            if(Users.Eyes.mediaStream != null) {
                startTracking(Users.Eyes.mediaStream, callback)
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
            Users.Eyes.mediaStream = stream;
            // Kalman Filter defaults to on. Can be toggled by user.
            window.applyKalmanFilter = true;
            // Set to true if you want to save the data even if you reload the page.
            window.saveDataAcrossSessions = true;

            //start the webgazer tracker
            webgazerInstance = await webgazer.setRegression('ridge') /* currently must set regression and tracker */
            //.setTracker('clmtrackr')
                .setStaticVideo(stream)
                .setGazeListener(function(data, clock) {
                    if(data) {
                        Users.Eyes.onMove.handle.call(null, data);
                        if (Math.sign(data.x) === -1 || Math.sign(data.y) === -1) {

                            if(Q.Users.Eyes.state === WITHIN_VIEWPORT || Q.Users.Eyes.state === null) {
                                Users.Eyes.onLeave.handle.call(this, data);
                                Q.Users.Eyes.state = OUTSIDE_VIEWPORT;
                            }
                        } else if(Math.sign(data.x) === 1 && Math.sign(data.y) === 1) {

                            if(Q.Users.Eyes.state === OUTSIDE_VIEWPORT || Q.Users.Eyes.state === null) {
                                Users.Eyes.onEnter.handle.call(this, data);
                                Q.Users.Eyes.state = WITHIN_VIEWPORT;
                            }

                        }
                    }

                }).begin(function(e){
                    console.error(e)
                });



            window.onbeforeunload = function() {
                webgazerInstance.end();
            }

            webgazerInstance.showVideo(false);
            webgazerInstance.showFaceOverlay(false);
            webgazerInstance.showFaceFeedbackBox(false);
            webgazerInstance.showPredictionPoints(false); /* shows a square every 100 milliseconds where current prediction is */
            //Set up the webgazer video feedback.
            var setup = function() {
                //Set up the main canvas. The main canvas is used to calibrate the webgazer.
                var canvas = document.getElementById("plotting_canvas");
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                canvas.style.position = 'fixed';
            };
            setup();

            if(callback != null) callback();

        }

    }

    Users.Eyes.stop = function () {
        if(Users.Eyes.webgazerInstance != null) {
            Users.Eyes.webgazerInstance.end();
            Users.Eyes.webgazerInstance = null;
        }

        if(Users.Eyes.mediaStream != null) {
            Users.Eyes.mediaStream.getTracks().map(function (track) {
                track.stop()
            })
        }
        Users.Faces.state = null;
    }

    var findScript = function (src) {
        var scripts = document.getElementsByTagName('script');
        var src = Q.url(src);
        for (var i=0; i<scripts.length; ++i) {
            var srcTag = scripts[i].getAttribute('src');
            if (srcTag && srcTag.indexOf(src) != -1) {
                return true;
            }
        }
        return null;
    };
})(Q, jQuery);

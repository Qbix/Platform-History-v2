(function (Q, $) {

    var Users = Q.plugins.Users;
    var _debug = null;
    const WITHIN_CAMERA = 1;
    const OUTSIDE_CAMERA = 2;
    /**
     * Analyses whether user seen on camera
     * @class Users.Faces
     * @constructor
     */
    Users.Faces =  function Users_Faces() {}

    /**
     *
     * @class Users.faceLandmarksDetection
     * @constructor
     */
    Users.Faces.faceLandmarksDetection = null
    /**
     *
     * @class Users.faceDetection
     * @constructor
     */
    Users.Faces.faceDetection = {}
    /**
     *
     * @class Users.faceDetection
     * @constructor
     */
    Users.Faces.videoElement = null

    /**
     * Whether user looking on screen or not
     * @class Users.state
     * @constructor
     */
    Users.Faces.state = null;

    /**
     * Start webcam eye tracking on the browser.
     * @method Eyes.start
     * @param {Object} options options for the method
     * @param {Function} [options.stream] Video stream which are processed
     * @param {Function} [options.onEnter] Callback called when eyes points are within the viewport
     * @param {Function} [options.onLeave] Callback called when eyes points leaves viewport
     */
    Users.Faces.landmarksDetection = function (options) {
        var tfCore = null;
        var tfConverter = null;
        var tfBackendWebgl = null;
        var faceLandmarksDetection = null;
        options = Q.extend({
            element: null,
            landmarksDetection: false,
            onEnter: new Q.Event(),
            onLeave: new Q.Event()
        }, options);



        if(!findScript('{{Users}}/js/tf-core.js')) {
            Q.addScript('{{Users}}/js/tf-core.js', function () {
                Users.Faces.tfCore = window.tf;

            });
        }

        if(!findScript('{{Users}}/js/tf-converter.js')) {
            Q.addScript('{{Users}}/js/tf-converter.js');
        }

        if(!findScript('{{Users}}/js/tf-backend-webgl.js')) {
            Q.addScript('{{Users}}/js/tf-backend-webgl.js');
        }

        if(!findScript('{{Users}}/js/face-landmarks-detection.js')) {
            Q.addScript('{{Users}}/js/face-landmarks-detection.js', function () {
                faceLandmarksDetection = Users.Faces.faceLandmarksDetection = window.faceLandmarksDetection;
                init()
            });
        } else {
            faceLandmarksDetection = Users.Faces.faceLandmarksDetection
            init()
        }

        function init() {
            if(options.element != null) {
                startTracking(options.element)
            } else {
                navigator.mediaDevices.getUserMedia ({
                    'audio': false,
                    'video': true
                }).then(function (stream) {
                    let videoEl = document.createElement('VIDEO');
                    videoEl.srcObject = stream;
                    startTracking(videoEl);
                }).catch(function(err) {
                    console.error('FACE TRACKING ERROR' + err.name + ": " + err.message);
                });
            }
        }


        async function startTracking(element) {
            const model = await faceLandmarksDetection.load(
                faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, {
                    maxFaces: 1
                });

            Users.Faces.landmarksDetection.detectionInterval = window.setInterval(async function(){
                // Pass in a video stream (or an image, canvas, or 3D tensor) to obtain an
                // array of detected faces from the MediaPipe graph. If passing in a video
                // stream, a single prediction per frame will be returned.
                const predictions = await model.estimateFaces({
                    input: element,
                    returnTensors: false,
                    flipHorizontal: false,
                    predictIrises: false
                });

                if (predictions.length > 0) {
                    if(Q.Users.Faces.state === OUTSIDE_CAMERA) {
                        Users.Faces.onEnter.handle.call();
                        Q.Users.Faces.state = WITHIN_CAMERA;
                    }
                } else {
                    if(Q.Users.Faces.state === WITHIN_CAMERA) {
                        Users.Faces.onLeave.handle.call();
                        Q.Users.Faces.state = OUTSIDE_CAMERA;
                    }
                }
            }, 100)
        }
    }

    Users.Faces.landmarksDetection.stop = function () {
        if(Users.Faces.landmarksDetection.detectionInterval != null) {
            clearInterval(Users.Faces.landmarksDetection.detectionInterval);
            Users.Faces.landmarksDetection.detectionInterval = null;
        }
    }

    /**
     * Event is triggered when face is detected
     * @param {Q.Event} anotherEvent
     * @return {Q.Event} A new Q.Event object
     */
    Users.Faces.onEnter = new Q.Event();

    /**
     * Event is triggered when face is outside of camera view
     * @param {Q.Event} anotherEvent
     * @return {Q.Event} A new Q.Event object
     */
    Users.Faces.onLeave = new Q.Event();

    /**
     * Start webcam eye tracking on the browser.
     * @method Eyes.start
     * @param {Object} options options for the method
     * @param {Function} [options.stream] Video stream which are processed
     */
    Users.Faces.start = function (callback) {
        Users.Faces.stop();

        if (!findScript('{{Users}}/js/tfjs.js')) {
            Q.addScript('{{Users}}/js/tfjs.js', function () {

            });
        } else {

        }

        if (!findScript('{{Users}}/js/blazeface.js')) {
            Q.addScript('{{Users}}/js/blazeface.js', function () {
                Users.Faces.faceDetection.blazeface = blazeface = window.blazeface;
                init()
            });
        } else {
            init()
        }

        function init() {
            if (Users.Faces.videoElement != null) {
                startTracking(Users.Faces.videoElement, callback)
            } else {
                navigator.mediaDevices.getUserMedia({
                    'audio': false,
                    'video': true
                }).then(function (stream) {
                    let videoEl = Users.Faces.videoElement = document.createElement('VIDEO');
                    videoEl.srcObject = stream;

                    videoEl.addEventListener('loadeddata', function(e) {
                        startTracking(videoEl, callback);
                    });
                    videoEl.addEventListener('canplay', (e) => {
                        if(videoEl.paused) videoEl.play()
                    });

                }).catch(function (err) {
                    console.error('FACE TRACKING ERROR' + err.name + ": " + err.message);
                });
            }
        }


        async function startTracking(element, callback) {
            // Load the model.
            const model = await blazeface.load();

            // Pass in an image or video to the model. The model returns an array of
            // bounding boxes, probabilities, and landmarks, one for each detected face.


            Users.Faces.faceDetection.detectionInterval = window.setInterval(async function () {
                // Pass in a video stream (or an image, canvas, or 3D tensor) to obtain an
                // array of detected faces from the MediaPipe graph. If passing in a video
                let returnTensors = false; // Pass in `true` to get tensors back, rather than values.
                let predictions = await model.estimateFaces(element, returnTensors);
                // stream, a single prediction per frame will be returned.

                if (predictions.length > 0) {
                    if (Q.Users.Faces.state === OUTSIDE_CAMERA || Q.Users.Faces.state === null) {
                        Users.Faces.onEnter.handle.call();
                        Q.Users.Faces.state = WITHIN_CAMERA;
                    }
                } else {
                    if (Q.Users.Faces.state === WITHIN_CAMERA || Q.Users.Faces.state === null) {
                        Users.Faces.onLeave.handle.call();
                        Q.Users.Faces.state = OUTSIDE_CAMERA;
                    }
                }
            }, 100)

            if(callback != null) callback();

        }


    }

    Users.Faces.stop = Users.Faces.faceDetection.stop = function () {
        if (Users.Faces.faceDetection.detectionInterval != null) {
            clearInterval(Users.Faces.faceDetection.detectionInterval);
            Users.Faces.faceDetection.detectionInterval = null;
        }
        if(Users.Faces.videoElement != null) {
            if(Users.Faces.videoElement.srcObject != null) Users.Faces.videoElement.srcObject.getTracks().map(function (track) {
                track.stop()
            });
            Users.Faces.videoElement = null;
        }
        Users.Faces.state = null;
    }

    function findScript(src) {
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

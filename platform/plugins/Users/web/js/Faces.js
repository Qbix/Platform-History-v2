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
    Users.Faces =  function Users_Faces() {
        var that = this;

        this.faceDetection = {}

        this.videoElement = null

        /**
         * Whether user looking on screen or not
         * @class Users.state
         * @constructor
         */
        this.state = null;

        /**
         * Start webcam eye tracking on the browser.
         * @method Eyes.start
         * @param {Object} options options for the method
         * @param {Function} [options.stream] Video stream which are processed
         * @param {Function} [options.onEnter] Callback called when eyes points are within the viewport
         * @param {Function} [options.onLeave] Callback called when eyes points leaves viewport
         */
        this.landmarksDetection = function (options) {
            options = Q.extend({
                element: null,
                landmarksDetection: false,
                onEnter: new Q.Event(),
                onLeave: new Q.Event()
            }, options);

            var landmarksDetection = this;

            /**
             *
             * @class Users.faceLandmarksDetection
             * @constructor
             */
            this.faceLandmarksDetection = null


            Q.addScript([
                '{{Users}}/js/tf-core.js',
                '{{Users}}/js/tf-converter.js',
                '{{Users}}/js/tf-backend-webgl.js',
                '{{Users}}/js/face-landmarks-detection.js'
            ], function () {
                landmarksDetection.faceLandmarksDetection = window.faceLandmarksDetection;

                // init face-landmarks-detection
                if(options.element != null) {
                    landmarksDetection.startTracking(options.element)
                } else {
                    navigator.mediaDevices.getUserMedia ({
                        'audio': false,
                        'video': true
                    }).then(function (stream) {
                        let videoEl = document.createElement('VIDEO');
                        videoEl.srcObject = stream;
                        landmarksDetection.startTracking(videoEl);
                    }).catch(function(err) {
                        console.error('FACE TRACKING ERROR' + err.name + ": " + err.message);
                    });
                }
            });

            this.startTracking = async function (element) {
                const model = await landmarksDetection.faceLandmarksDetection.load(
                    landmarksDetection.faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, {
                        maxFaces: 1
                    });

                landmarksDetection.detectionInterval = window.setInterval(async function(){
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
                        if(that.state === OUTSIDE_CAMERA) {
                            Q.handle(that.onEnter);
                            that.state = WITHIN_CAMERA;
                        }
                    } else {
                        if(that.state === WITHIN_CAMERA) {
                            Q.handle(that.onLeave);
                            that.state = OUTSIDE_CAMERA;
                        }
                    }
                }, 100)
            }

            this.stop = function () {
                if(landmarksDetection.detectionInterval != null) {
                    clearInterval(landmarksDetection.detectionInterval);
                    landmarksDetection.detectionInterval = null;
                }
            }
        }

        /**
         * Event is triggered when face is detected
         * @param {Q.Event} anotherEvent
         * @return {Q.Event} A new Q.Event object
         */
        that.onEnter = new Q.Event();

        /**
         * Event is triggered when face is outside of camera view
         * @param {Q.Event} anotherEvent
         * @return {Q.Event} A new Q.Event object
         */
        that.onLeave = new Q.Event();

        /**
         * Start webcam eye tracking on the browser.
         * @method Eyes.start
         * @param {Object} options options for the method
         * @param {Function} [options.stream] Video stream which are processed
         */
        this.start = function (callback) {
            that.stop();

            Q.addScript(['{{Users}}/js/tfjs.js', '{{Users}}/js/blazeface.js'], function () {
                // init blazeface
                if (that.videoElement != null) {
                    startTracking(that.videoElement, callback)
                } else {
                    navigator.mediaDevices.getUserMedia({
                        'audio': false,
                        'video': true
                    }).then(function (stream) {
                        let videoEl = that.videoElement = document.createElement('VIDEO');
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
            });

            async function startTracking(element, callback) {
                // Load the model.
                const model = await blazeface.load();

                // Pass in an image or video to the model. The model returns an array of
                // bounding boxes, probabilities, and landmarks, one for each detected face.


                that.faceDetection.detectionInterval = window.setInterval(async function () {
                    // Pass in a video stream (or an image, canvas, or 3D tensor) to obtain an
                    // array of detected faces from the MediaPipe graph. If passing in a video
                    let returnTensors = false; // Pass in `true` to get tensors back, rather than values.
                    let predictions = await model.estimateFaces(element, returnTensors);
                    // stream, a single prediction per frame will be returned.

                    if (predictions.length > 0) {
                        if (that.state === OUTSIDE_CAMERA || that.state === null) {
                            Q.handle(that.onEnter);
                            that.state = WITHIN_CAMERA;
                        }
                    } else {
                        if (that.state === WITHIN_CAMERA || that.state === null) {
                            Q.handle(that.onLeave);
                            that.state = OUTSIDE_CAMERA;
                        }
                    }
                }, 100)

                Q.handle(callback);

            }


        }

        this.stop = this.faceDetection.stop = function () {
            if (that.faceDetection.detectionInterval != null) {
                clearInterval(that.faceDetection.detectionInterval);
                that.faceDetection.detectionInterval = null;
            }
            if(that.videoElement != null) {
                if(that.videoElement.srcObject != null) {
                    that.videoElement.srcObject.getTracks().map(function (track) {
                        track.stop()
                    });
                }

                that.videoElement = null;
            }
            that.state = null;
        }
    }
})(Q, jQuery);

(function (Q, $) {

    var Users = Q.plugins.Users;
    const WITHIN_CAMERA = 1;
    const OUTSIDE_CAMERA = 2;

    /**
     * Analyses whether user seen on camera
     * @class Users.Faces
     * @param {object} params JSON object with necessary params
     * @param {integer} params.debounce Seconds to debounce setting face off. If face off and during this time no face, than call onLeave event.
     * But when face on, call onEnter immediately.
     * @constructor
     */
    Users.Faces =  function Users_Faces (params) {
        var that = this;

        this.faceDetection = {}

        this.videoElement = null

        this.debounce = (Q.getObject("debounce", params) || 0) * 1000;

        /**
         * Current state of users face (WITHIN_CAMERA or OUTSIDE_CAMERA)
         */
        this.state = null;

        /**
         *
         * @method Faces.landmarksDetection
         */
        this.landmarksDetection = function () {
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
                if(landmarksDetection.element != null) {
                    landmarksDetection.startTracking(landmarksDetection.element)
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
                        that.faceOn();
                    } else {
                        that.faceOff();
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
         * Start webcam face tracking on the browser.
         * @method Faces.start
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
                        that.faceOn();
                    } else {
                        that.faceOff();
                    }
                }, 100)

                Q.handle(callback);

            }
        };

        /**
         * Make needed actions when face appear with camera
         * @method faceOn
         */
        this.faceOn = function () {
            // if debounce time id defined, clear to avoid call onLeave
            that.clearDebounceTimer();

            if (that.state === OUTSIDE_CAMERA || that.state === null) {
                Q.handle(that.onEnter);
                that.state = WITHIN_CAMERA;
            }
        };

        /**
         * Make needed actions when face hide with camera
         * @method faceOff
         */
        this.faceOff = function () {
            if (that.state === null) {
                Q.handle(that.onLeave);
                that.state = OUTSIDE_CAMERA;
            } else if (that.state === WITHIN_CAMERA && !that.debounceTimerId) {
                that.debounceTimerId = setTimeout(function () {
                    Q.handle(that.onLeave);
                    that.state = OUTSIDE_CAMERA;
                }, that.debounce);
            }
        };

        /**
         * Clear debounce timeOut timer id
         * @method clearDebounceTimer
         */
        this.clearDebounceTimer = function () {
            if (!that.debounceTimerId) {
                return;
            }

            clearTimeout(that.debounceTimerId);
            that.debounceTimerId = null;
        };

        /**
         * Stop watching for face
         * @method stop
         */
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

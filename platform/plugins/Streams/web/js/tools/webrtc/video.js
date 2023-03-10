(function ($, window, undefined) {
    var _controlsToolIcons = []; 

    var ButtonInstance = function (data) {
        this.buttonEl = data.buttonEl;
        this.textEl = data.textEl;
        this.type = data.type;
        this.isActive = false;
        this.deviceId = data.deviceId;
        this.handler = data.handler.bind(this);
        this.makeActive = function () {
            if (!this.buttonEl.classList.contains('webrtc-video-settings_popup_active')) this.buttonEl.classList.add('webrtc-video-settings_popup_active');
            if (!this.buttonEl.classList.contains('webrtc-video-disabled-radio')) this.buttonEl.classList.add('webrtc-video-disabled-radio');
            this.isActive = true;
        };
        this.switchToRegularState = function () {
            if (this.buttonEl.classList.contains('webrtc-video-settings_popup_active')) this.buttonEl.classList.remove('webrtc-video-settings_popup_active');
            if (this.buttonEl.classList.contains('webrtc-video-disabled-radio')) this.buttonEl.classList.remove('webrtc-video-disabled-radio');
            this.isActive = false;
        };
        this.show = function () {
            if (this.buttonEl.classList.contains('webrtc-video-hidden')) this.buttonEl.classList.remove('webrtc-video-hidden');
            this.switchToRegularState();
        };
        this.hide = function () {
            if (!this.buttonEl.classList.contains('webrtc-video-hidden')) this.buttonEl.classList.add('webrtc-video-hidden');
        };
        this.remove = function () {
            if (this.buttonEl.parentNode != null) this.buttonEl.parentNode.removeChild(this.buttonEl);
        };
    }

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
     * Streams/webrtc/control tool.
     * Users can chat with each other via WebRTC using Twilio or raw streams
     * @module Streams
     * @class Streams webrtc
     * @constructor
     * @param {Object} options
     *  Hash of possible options
     */
    Q.Tool.define("Streams/webrtc/video", function (options) {
        var tool = this;
        _controlsToolIcons = tool.state.controlsTool.getIcons();

        tool.videoinputListEl = null;
        tool.cameraListButtons = [];
        tool.turnOnCameraBtn = null;
        tool.startScreenSharingBtn = null;
        tool.startAnotherScreenSharingBtn = null;
        tool.startMobileScreenSharingBtn = null;
        tool.stopScreenSharingBtn = null;
        tool.turnOffCameraBtn = null;

        Q.addStylesheet('{{Streams}}/css/tools/video.css?ts=' + performance.now(), function () {
          
        });

        tool.createList();
        tool.declareEventsHandlers();
        
    },

        {
            onRefresh: new Q.Event(),
            controlsTool: null,
            webrtcSignalingLib: null,
            webrtcUserInterface: null
        },

        {
            declareEventsHandlers: function () {
                var tool = this;
                var webrtcSignalingLib = tool.state.webrtcSignalingLib;
                
                webrtcSignalingLib.event.on('cameraDisabled', function () {
                    console.log('declareEventsHandlers', tool)
                    tool.updateCamerasList();
                });
                webrtcSignalingLib.event.on('currentVideoinputDeviceChanged', function () {
                    console.log('declareEventsHandlers', tool)
                    tool.updateCamerasList();
                });
                webrtcSignalingLib.event.on('deviceListUpdated', function () {
                    tool.loadCamerasList();
                });
                webrtcSignalingLib.event.on('remoteScreensharingStarting', function (e) {

                });
                webrtcSignalingLib.event.on('screensharingStarted', function (e) {
                    if(e.participant && e.participant.isLocal) {
                        tool.updateCamerasList({eventName: 'screensharingStarted'});
                    }
                });
                webrtcSignalingLib.event.on('screensharingStopped', function (e) {
                    if(e.participant && e.participant.isLocal) {
                        tool.updateCamerasList({eventName: 'screensharingStopped'});
                    }
                });
                webrtcSignalingLib.event.on('remoteScreensharingFailed', function (e) {

                });
            },
            createList: function () {
                var tool = this;

                var videoinputList = document.createElement('DIV');
                videoinputList.className = 'webrtc-video-choose-device';

                var turnOnCameraItem = document.createElement('DIV');
                turnOnCameraItem.dataset.deviceId = 'auto';
                turnOnCameraItem.className = 'webrtc-video-settings_popup_item webrtc-video-settings_popup_camera_item';
                var textLabelCon = document.createElement('SPAN');
                textLabelCon.className = 'webrtc-video-settings_popup_item_text';
                var textLabel = document.createTextNode(Q.getObject("webrtc.settingsPopup.webCamera", tool.text));
                var checkmark = document.createElement('SPAN');
                checkmark.className = 'webrtc-video-radio-checkmark';
                checkmark.innerHTML = _controlsToolIcons.screen;
                textLabelCon.appendChild(textLabel);
                turnOnCameraItem.appendChild(textLabelCon);
                turnOnCameraItem.appendChild(checkmark);

                tool.turnOnCameraBtn = new ButtonInstance({
                    buttonEl: turnOnCameraItem,
                    textEl: textLabelCon,
                    type: 'camera',
                    handler: function (e) {
                        var turnCameraOn = function () {
                            tool.toggleRadioButton(tool.turnOnCameraBtn);

                            tool.state.webrtcSignalingLib.localMediaControls.requestCamera(function () {
                                var currentCamera = tool.state.webrtcSignalingLib.localMediaControls.frontCameraDevice();
                                if (currentCamera != null) {
                                    var btnToSwitchOn = tool.cameraListButtons.filter(function (cameraBtn) {
                                        return cameraBtn.deviceId == currentCamera.deviceId;
                                    })[0];

                                    if (btnToSwitchOn != null) {
                                        toggleCameraButtons(btnToSwitchOn);
                                    } else {
                                        toggleCameraButtons(tool.turnOffCameraBtn);
                                    }

                                    tool.loadCamerasList();
                                }
                                tool.state.controlsTool.updateControlBar();
                            }, function () {
                                var participant = tool.state.webrtcSignalingLib.localParticipant();
                                var enabledVideoTracks = participant.tracks.filter(function (t) {
                                    return t.screensharing;
                                })[0];
                                if (enabledVideoTracks != null)
                                    tool.toggleRadioButton(tool.startScreenSharingBtn);
                                else tool.toggleRadioButton(tool.turnOffCameraBtn);

                                tool.state.controlsTool.updateControlBar();
                            });
                        }

                        if (tool.state.webrtcUserInterface.getOptions().limits && (tool.state.webrtcUserInterface.getOptions().limits.video || tool.state.webrtcUserInterface.getOptions().limits.audio)) {
                            tool.state.webrtcSignalingLib.localMediaControls.canITurnCameraOn().then(function (result) {
                                turnCameraOn();
                            });
                        } else {
                            turnCameraOn();
                        }
                    }
                });

                var screenSharingRadioItem = document.createElement('DIV');
                screenSharingRadioItem.dataset.deviceId = 'screen';
                screenSharingRadioItem.className = 'webrtc-video-settings_popup_item webrtc-video-settings_popup_screen_item';
                var textLabelCon = document.createElement('SPAN');
                textLabelCon.className = 'webrtc-video-settings_popup_item_text';
                var textLabel = document.createTextNode(Q.getObject("webrtc.settingsPopup.screenSharing", tool.text));
                var checkmark = document.createElement('SPAN');
                checkmark.className = 'webrtc-video-radio-checkmark';
                checkmark.innerHTML = _controlsToolIcons.screen;
                textLabelCon.appendChild(textLabel);
                screenSharingRadioItem.appendChild(textLabelCon);
                screenSharingRadioItem.appendChild(checkmark);

                tool.startScreenSharingBtn = new ButtonInstance({
                    buttonEl: screenSharingRadioItem,
                    textEl: textLabelCon,
                    type: 'screen',
                    handler: function (e) {
                        var btnInstance = this;
                        if (!screenSharingRadioItem.classList.contains('Q_working')) screenSharingRadioItem.classList.add('Q_working');

                        var turnScreensharingOn = function () {
                            tool.state.webrtcSignalingLib.screenSharing.startShareScreen(function () {
                                if (screenSharingRadioItem.classList.contains('Q_working')) screenSharingRadioItem.classList.remove('Q_working');
                                Q.Dialogs.pop();
                                tool.toggleRadioButton(btnInstance);
                                tool.state.controlsTool.closeAllDialogs();
                                tool.state.controlsTool.updateControlBar();
                            }, function () {
                                if (screenSharingRadioItem.classList.contains('Q_working')) screenSharingRadioItem.classList.remove('Q_working');

                                var currentCameraDevice = tool.state.webrtcSignalingLib.localMediaControls.currentCameraDevice();
                                if (currentCameraDevice != null) {
                                    var btnToSwitchOn = tool.cameraListButtons.filter(function (cameraBtn) {
                                        return cameraBtn.deviceId == currentCameraDevice.deviceId;
                                    })[0];
                                    if (btnToSwitchOn != null) tool.toggleRadioButton(btnToSwitchOn);
                                } else tool.toggleRadioButton(tool.turnOffCameraBtn);

                                tool.state.controlsTool.updateControlBar();
                            });
                        }

                        if (tool.state.webrtcUserInterface.getOptions().limits && (tool.state.webrtcUserInterface.getOptions().limits.video || tool.state.webrtcUserInterface.getOptions().limits.audio)) {
                            tool.state.webrtcSignalingLib.localMediaControls.canITurnCameraOn().then(function (result) {
                                turnScreensharingOn();
                            });
                        } else {
                            turnScreensharingOn();
                        }
                    }
                });

                var anotherScreenSharingRadioItem = document.createElement('DIV');
                anotherScreenSharingRadioItem.className = 'webrtc-video-hidden webrtc-video-settings_popup_item webrtc-video-settings_popup_screen_item webrtc-video-video_anotherScreen';
                anotherScreenSharingRadioItem.dataset.deviceId = 'anotherScreen';
                var textLabelCon = document.createElement('SPAN');
                textLabelCon.className = 'webrtc-video-settings_popup_item_text';
                var textLabel = document.createTextNode(Q.getObject("webrtc.settingsPopup.shareAnotherScreen", tool.text));
                var checkmark = document.createElement('SPAN');
                checkmark.className = 'webrtc-video-radio-checkmark';
                checkmark.innerHTML = _controlsToolIcons.screen;
                textLabelCon.appendChild(textLabel);
                anotherScreenSharingRadioItem.appendChild(textLabelCon);
                anotherScreenSharingRadioItem.appendChild(checkmark);
                tool.startAnotherScreenSharingBtn = new ButtonInstance({
                    buttonEl: anotherScreenSharingRadioItem,
                    textEl: textLabelCon,
                    type: 'shareAnotherScreen',
                    handler: function () {
                        var turnScreensharingOn = function () {
                            tool.state.webrtcSignalingLib.screenSharing.startShareScreen(function () {
                                Q.Dialogs.pop();
                                tool.toggleRadioButton(tool.startScreenSharingBtn);
                                tool.state.controlsTool.closeAllDialogs();
                                tool.state.controlsTool.updateControlBar();
                            }, function () {
                                var currentCameraDevice = tool.state.webrtcSignalingLib.localMediaControls.currentCameraDevice();
                                if (currentCameraDevice != null) {
                                    var btnToSwitchOn = tool.cameraListButtons.filter(function (cameraBtn) {
                                        return cameraBtn.deviceId == currentCameraDevice.deviceId;
                                    })[0];
                                    if (btnToSwitchOn != null) tool.toggleRadioButton(btnToSwitchOn);
                                } else tool.toggleRadioButton(tool.turnOffCameraBtn);

                                tool.state.controlsTool.updateControlBar();
                            })

                        }

                        if (tool.state.webrtcUserInterface.getOptions().limits && (tool.state.webrtcUserInterface.getOptions().limits.video || tool.state.webrtcUserInterface.getOptions().limits.audio)) {
                            tool.state.webrtcSignalingLib.localMediaControls.canITurnCameraOn().then(function (result) {
                                turnScreensharingOn();
                            });
                        } else {
                            turnScreensharingOn();
                        }
                    }
                });

                var turnScreenSharingOff = document.createElement('DIV');
                turnScreenSharingOff.className = 'webrtc-video-hidden webrtc-video-settings_popup_item webrtc-video-settings_popup_screen_item webrtc-video-turn_off_screensharing';
                turnScreenSharingOff.dataset.deviceId = 'turnScreenSharingOff';
                var textLabelCon = document.createElement('SPAN');
                textLabelCon.className = 'webrtc-video-settings_popup_item_text';
                var textLabel = document.createTextNode(Q.getObject("webrtc.settingsPopup.turnOffScreenSharing", tool.text));
                var checkmark = document.createElement('SPAN');
                checkmark.className = 'webrtc-video-radio-checkmark';
                checkmark.innerHTML = _controlsToolIcons.switchOffCameras;
                textLabelCon.appendChild(textLabel);
                turnScreenSharingOff.appendChild(textLabelCon);
                turnScreenSharingOff.appendChild(checkmark);
                tool.stopScreenSharingBtn = new ButtonInstance({
                    buttonEl: turnScreenSharingOff,
                    textEl: textLabelCon,
                    type: 'turnScreenSharingOff',
                    handler: function () {
                        tool.toggleRadioButton(tool.stopScreenSharingBtn);
                        tool.state.webrtcSignalingLib.screenSharing.stopShareScreen();
                    }
                });

                var mobileScreenSharingRadioItem = document.createElement('DIV');
                mobileScreenSharingRadioItem.dataset.deviceId = 'screen';
                mobileScreenSharingRadioItem.className = 'webrtc-video-settings_popup_item webrtc-video-settings_popup_screen_item';
                var textLabelCon = document.createElement('SPAN');
                textLabelCon.className = 'webrtc-video-settings_popup_item_text';
                var textLabel = document.createTextNode(Q.getObject("webrtc.settingsPopup.screenSharing", tool.text));
                var checkmark = document.createElement('SPAN');
                checkmark.className = 'webrtc-video-radio-checkmark';
                checkmark.innerHTML = _controlsToolIcons.screen;
                textLabelCon.appendChild(textLabel);
                mobileScreenSharingRadioItem.appendChild(textLabelCon);
                mobileScreenSharingRadioItem.appendChild(checkmark);

                tool.startMobileScreenSharingBtn = new ButtonInstance({
                    buttonEl: mobileScreenSharingRadioItem,
                    textEl: textLabelCon,
                    type: 'mobileScreen',
                    handler: function (e) {
                        var btnInstance = this;
                        tool.state.webrtcSignalingLib.screenSharing.startShareScreen(function () {
                            Q.Dialogs.pop();
                            tool.toggleRadioButton(btnInstance);
                            tool.state.controlsTool.closeAllDialogs();
                            tool.state.controlsTool.updateControlBar();
                        }, function () {
                            var currentCameraDevice = tool.state.webrtcSignalingLib.localMediaControls.currentCameraDevice();
                            if (currentCameraDevice != null) {
                                var btnToSwitchOn = tool.cameraListButtons.filter(function (cameraBtn) {
                                    return cameraBtn.deviceId == currentCameraDevice.deviceId;
                                })[0];
                                if (btnToSwitchOn != null) tool.toggleRadioButton(btnToSwitchOn);
                            } else tool.toggleRadioButton(tool.turnOffCameraBtn);

                            tool.state.controlsTool.updateControlBar();
                        });
                    }
                });

                if (tool.state.webrtcSignalingLib.screenSharing.isActive()) {
                    tool.toggleRadioButton(tool.startScreenSharingBtn);
                }

                var turnOffradioBtnItem = document.createElement('DIV');
                turnOffradioBtnItem.className = 'webrtc-video-settings_popup_item webrtc-video-settings_popup_camera_item webrtc-video-turn_video_off';
                turnOffradioBtnItem.dataset.deviceId = 'off';
                var textLabelCon = document.createElement('SPAN');
                textLabelCon.className = 'webrtc-video-settings_popup_item_text webrtc-video-turn_video_off_text';
                var textLabel = document.createTextNode(Q.getObject("webrtc.settingsPopup.cameraIsTurnedOff", tool.text));
                var checkmark = document.createElement('SPAN');
                checkmark.className = 'webrtc-video-radio-checkmark';
                checkmark.innerHTML = _controlsToolIcons.switchOffCameras;
                textLabelCon.appendChild(textLabel);
                turnOffradioBtnItem.appendChild(textLabelCon);
                turnOffradioBtnItem.appendChild(checkmark);

                tool.turnOffCameraBtn = new ButtonInstance({
                    buttonEl: turnOffradioBtnItem,
                    textEl: textLabelCon,
                    type: 'off',
                    handler: function (e) {
                        tool.toggleRadioButton(tool.turnOffCameraBtn);
                        tool.state.webrtcSignalingLib.localMediaControls.disableVideo();
                        Q.Dialogs.pop();
                        tool.state.controlsTool.closeAllDialogs();
                        tool.state.controlsTool.updateControlBar();
                    }
                });            

                if (!tool.state.webrtcSignalingLib.localMediaControls.currentCameraDevice()) {
                    tool.toggleRadioButton(tool.turnOffCameraBtn);
                }

                videoinputList.appendChild(turnOnCameraItem);
                if (!Q.info.useTouchEvents) videoinputList.appendChild(screenSharingRadioItem);
                if (!Q.info.useTouchEvents) videoinputList.appendChild(anotherScreenSharingRadioItem);
                if (tool.state.webrtcUserInterface.getOptions().showScreenSharingInSeparateScreen && !Q.info.useTouchEvents) videoinputList.appendChild(turnScreenSharingOff);
                if ((Q.info.useTouchEvents) && typeof cordova != 'undefined') videoinputList.appendChild(mobileScreenSharingRadioItem);
                videoinputList.appendChild(turnOffradioBtnItem);

                screenSharingRadioItem.addEventListener('mouseup', tool.startScreenSharingBtn.handler);
                anotherScreenSharingRadioItem.addEventListener('mouseup', tool.startAnotherScreenSharingBtn.handler);
                mobileScreenSharingRadioItem.addEventListener('mouseup', tool.startMobileScreenSharingBtn.handler);
                turnScreenSharingOff.addEventListener('mouseup', tool.stopScreenSharingBtn.handler);

                turnOffradioBtnItem.addEventListener('mouseup', tool.turnOffCameraBtn.handler)

                tool.videoinputListEl = videoinputList;
                return videoinputList;
            },
            loadCamerasList: function () {
                var tool = this;
                tool.log('contros: loadCamerasList')
                if (tool.state.webrtcUserInterface.getOptions().audioOnlyMode) return;
                //location.reload();
                var count = 1;

                tool.clearCameraList();

                tool.state.webrtcSignalingLib.localMediaControls.videoInputDevices().forEach(function (mediaDevice) {
                    var radioBtnItem = document.createElement('DIV');
                    radioBtnItem.className = 'webrtc-video-settings_popup_item webrtc-video-settings_popup_camera_item';
                    radioBtnItem.dataset.deviceId = mediaDevice.deviceId;

                    var textLabelCon = document.createElement('SPAN');
                    textLabelCon.className = 'webrtc-video-settings_popup_item_text';
                    var textLabel = document.createTextNode(mediaDevice.label || `Camera ${count}`);
                    var checkmark = document.createElement('SPAN');
                    checkmark.className = 'webrtc-video-radio-checkmark';
                    checkmark.innerHTML = _controlsToolIcons.cameraTransparent;
                    textLabelCon.appendChild(textLabel);
                    radioBtnItem.appendChild(textLabelCon);
                    radioBtnItem.appendChild(checkmark);
                    tool.videoinputListEl.insertBefore(radioBtnItem, tool.videoinputListEl.firstChild);

                    let cameraItem = new ButtonInstance({
                        buttonEl: radioBtnItem,
                        textEl: textLabelCon,
                        type: 'camera',
                        deviceId: mediaDevice.deviceId,
                        handler: function (e) {
                            if (!radioBtnItem.classList.contains('Q_working')) radioBtnItem.classList.add('Q_working');
                            Q.Dialogs.pop();
                            tool.state.controlsTool.closeAllDialogs();

                            var toggle = function () {
                                tool.state.webrtcSignalingLib.localMediaControls.toggleCameras({ deviceId: mediaDevice.deviceId, groupId: mediaDevice.groupId }, function () {
                                    if (radioBtnItem.classList.contains('Q_working')) radioBtnItem.classList.remove('Q_working');

                                    var localScreens = tool.state.webrtcSignalingLib.localParticipant().screens;
                                    var i, screen;
                                    for (i = 0; screen = localScreens[i]; i++) {
                                        tool.state.webrtcUserInterface.screenRendering.updateLocalScreenClasses(screen);
                                    }
                                    tool.log('controls: tool.toggleRadioButton', cameraItem)
                                    tool.toggleRadioButton(cameraItem);

                                    tool.state.controlsTool.updateControlBar();
                                }, function (e) {
                                    if (radioBtnItem.classList.contains('Q_working')) radioBtnItem.classList.remove('Q_working');
                                    if (_isiOSCordova) tool.showIosPermissionsInstructions('Camera');
                                    if (e.name == 'NotAllowedDueLimit') {
                                        tool.state.webrtcUserInterface.notice.show(tool.text.webrtc.notices.allowedVideoLimit.interpolate({ limit: e.limit }));
                                    }
                                })
                            }

                            if (tool.state.webrtcUserInterface.getOptions().limits && (tool.state.webrtcUserInterface.getOptions().limits.video || tool.state.webrtcUserInterface.getOptions().limits.audio)) {
                                tool.state.webrtcSignalingLib.localMediaControls.canITurnCameraOn().then(function () {
                                    tool.turnOnCamera();
                                });
                            } else {
                                toggle();
                            }


                        }
                    });

                    tool.cameraListButtons.push(cameraItem);

                    if (tool.state.webrtcSignalingLib.localMediaControls.currentCameraDevice() != null && tool.state.webrtcSignalingLib.localMediaControls.currentCameraDevice().deviceId == mediaDevice.deviceId) {
                        tool.toggleRadioButton(cameraItem);
                    }

                    radioBtnItem.addEventListener('mouseup', cameraItem.handler)
                    count++;
                });

                //if(turnOnCameraItem.parentNode != null) turnOnCameraItem.parentNode.removeChild(turnOnCameraItem);
                tool.turnOnCameraBtn.remove();

            },
            updateCamerasList: function (e) {
                var tool = this;
                tool.log('controls: updateCamerasList');
                let cameraIsActive = false;
                tool.cameraListButtons.forEach(function (cameraItem) {
                    let currentCameraDevice = tool.state.webrtcSignalingLib.localMediaControls.currentCameraDevice();
                    tool.log('controls: updateCamerasList: currentCameraDevice', currentCameraDevice);
                    if (currentCameraDevice != null && currentCameraDevice.deviceId == cameraItem.deviceId) {
                        tool.log('controls: updateCamerasList: tool.toggleRadioButton (active)', cameraItem);
                        tool.toggleRadioButton(cameraItem);
                        cameraIsActive = true
                    }

                });
                if (!cameraIsActive) {
                    tool.log('controls: updateCamerasList: make active tool.turnOffCameraBtn');
                    tool.toggleRadioButton(tool.turnOffCameraBtn);
                }

                if(e && (e.eventName == 'screensharingStarted' || e.eventName == 'screensharingStopped')) {
                    if (tool.state.webrtcSignalingLib.screenSharing.isActive()) {
                        tool.toggleRadioButton(tool.startScreenSharingBtn);
                    } else {
                        tool.toggleRadioButton(tool.stopScreenSharingBtn);
                    }
                }
            },
            clearCameraList: function () {
                var tool = this;
                for (var c in tool.cameraListButtons) {
                    tool.cameraListButtons[c].remove();
                }
            },
            toggleRadioButton: function (buttonObj) {
                var tool = this;
                var deselectCameraButtons = function () {
                    for (var i in tool.cameraListButtons) {
                        if (tool.cameraListButtons[i] == buttonObj) continue;
                        tool.cameraListButtons[i].switchToRegularState();
                    }
                }

                tool.log('controls: tool.toggleRadioButton', buttonObj);
               
                if (buttonObj.type == 'camera') {
                    deselectCameraButtons();
                    if (!tool.state.webrtcUserInterface.getOptions().showScreenSharingInSeparateScreen) {
                        tool.startScreenSharingBtn.switchToRegularState();
                        tool.turnOffCameraBtn.textEl.innerHTML = Q.getObject("webrtc.settingsPopup.turnOffVideo", tool.text);
                    } else {
                        tool.turnOffCameraBtn.textEl.innerHTML = Q.getObject("webrtc.settingsPopup.turnOffCameras", tool.text);
                    }
                    tool.turnOffCameraBtn.switchToRegularState();
                } else if (buttonObj.type == 'screen') {
                    if (!tool.state.webrtcUserInterface.getOptions().showScreenSharingInSeparateScreen) {
                        deselectCameraButtons();
                        tool.turnOffCameraBtn.switchToRegularState();
                    } else {
                        tool.startAnotherScreenSharingBtn.show();
                        tool.stopScreenSharingBtn.show();
                    }

                } else if (buttonObj.type == 'mobileScreen') {
                    if (!tool.state.webrtcUserInterface.getOptions().showScreenSharingInSeparateScreen) {
                        deselectCameraButtons();
                        tool.turnOffCameraBtn.switchToRegularState();
                    } else {
                        tool.stopScreenSharingBtn.show();
                    }

                } else if (buttonObj.type == 'turnScreenSharingOff') {
                    tool.startScreenSharingBtn.switchToRegularState();
                    tool.startAnotherScreenSharingBtn.hide();
                    tool.stopScreenSharingBtn.hide();
                } else if (buttonObj.type == 'off') {
                    deselectCameraButtons();
                    if (!tool.state.webrtcUserInterface.getOptions().showScreenSharingInSeparateScreen) {
                        tool.startScreenSharingBtn.switchToRegularState();
                        tool.startAnotherScreenSharingBtn.hide();
                        tool.stopScreenSharingBtn.hide();
                    }
                    tool.turnOffCameraBtn.textEl.innerHTML = Q.getObject("webrtc.settingsPopup.cameraIsTurnedOff", tool.text);
                }

                if (typeof buttonObj == "undefined") return;

                buttonObj.makeActive();
            },
            turnOnCamera: function () {
                var tool = this;
                tool.state.webrtcSignalingLib.localMediaControls.requestCamera(function () {
                    var currentCamera = tool.state.webrtcSignalingLib.localMediaControls.frontCameraDevice();
                    if (currentCamera != null) {
                        var btnToSwitchOn = tool.cameraListButtons.filter(function (cameraBtn) {
                            return cameraBtn.deviceId == currentCamera.deviceId;
                        })[0];

                        if (btnToSwitchOn != null) {
                            toggleCameraButtons(btnToSwitchOn);
                        } else {
                            toggleCameraButtons(tool.turnOffCameraBtn);
                        }

                        tool.loadCamerasList();
                    }
                    tool.state.controlsTool.updateControlBar();
                }, function (e) {
                    var participant = tool.state.webrtcSignalingLib.localParticipant();
                    var enabledVideoTracks = participant.tracks.filter(function (t) {
                        return t.screensharing;
                    })[0];
                    if (enabledVideoTracks != null)
                        tool.toggleRadioButton(tool.startScreenSharingBtn);
                    else tool.toggleRadioButton(tool.turnOffCameraBtn);

                    tool.state.controlsTool.updateControlBar();
                    if (_isiOSCordova)
                        tool.showIosPermissionsInstructions('Camera');
                    else if (e.name == 'NotAllowedError' || e.name == 'MediaStreamError') tool.showBrowserPermissionsInstructions('camera');
                });
            },
            screenSharingButton: function () {
                var tool = this;
                return tool.startScreenSharingBtn;
            },
            stopScreenSharingButton: function () {
                var tool = this;
                return tool.stopScreenSharingBtn;
            },
            refresh: function () {
                var tool = this;
            },
            log: function log(text) {
                var tool = this;
                //if (!tool.state.debug.controls) return;
                var args = Array.prototype.slice.call(arguments);
                var params = [];

                if (window.performance) {
                    var now = (window.performance.now() / 1000).toFixed(3);
                    params.push(now + ": " + args.splice(0, 1));
                    params = params.concat(args);
                    console.log.apply(console, params);
                } else {
                    params.push(text);
                    params = params.concat(args);
                    console.log.apply(console, params);
                }

                if (tool.state.webrtcSignalingLib) tool.state.webrtcSignalingLib.event.dispatch('log', params);
            }
        }

    );

})(window.jQuery, window);
(function ($, window, undefined) {

    var _icons = {
        settings: '<svg version="1.1" id="svg111" xml:space="preserve" width="682.66669" height="682.66669" viewBox="0 0 682.66669 682.66669" sodipodi:docname="settings (1).svg" inkscape:version="1.2.1 (9c6d41e, 2022-07-14)" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg"><sodipodi:namedview id="namedview72" pagecolor="#ffffff" bordercolor="#000000" borderopacity="0.25" inkscape:showpageshadow="2" inkscape:pageopacity="0.0" inkscape:pagecheckerboard="0" inkscape:deskcolor="#d1d1d1" showgrid="false" inkscape:zoom="0.90839741" inkscape:cx="117.78986" inkscape:cy="346.76453" inkscape:window-width="1920" inkscape:window-height="1029" inkscape:window-x="0" inkscape:window-y="27" inkscape:window-maximized="1" inkscape:current-layer="g117" /><defs id="defs115"><clipPath clipPathUnits="userSpaceOnUse" id="clipPath125"><path d="M 0,512 H 512 V 0 H 0 Z" id="path123" /></clipPath></defs><g id="g117" transform="matrix(1.3333333,0,0,-1.3333333,0,682.66667)"><path d="m -64.267578,-442.71875 c -25.853717,0 -47.132812,21.27966 -47.132812,47.13281 v 10.96094 c -11.11849,3.55446 -21.82534,8.00409 -32.04102,13.28906 l -7.7539,-7.75195 c -8.8401,-8.85183 -20.84682,-13.81641 -33.33789,-13.81641 -12.48681,0 -24.49375,4.96296 -33.33399,13.81641 -7.30802,7.30802 -15.40104,15.40204 -22.70898,22.70898 -8.84723,8.83905 -13.81055,20.84005 -13.81055,33.32618 0,12.49093 4.96494,24.49508 13.81055,33.33398 4.10462,4.10413 4.88381,4.88394 7.75976,7.75977 -5.28538,10.21593 -9.7363,20.9212 -13.29101,32.03906 h -10.95899 c -25.85371,0 -47.13281,21.28159 -47.13281,47.13476 v 32.13282 c 0,25.85317 21.2791,47.13281 47.13281,47.13281 h 10.95704 c 3.55486,11.11899 8.00732,21.82432 13.29296,32.041014 -2.87624,2.875997 -3.65643,3.656431 -7.76171,7.761719 -8.84474,8.83817 -13.8086,20.84253 -13.8086,33.332031 0,12.487977 4.96477,24.490664 13.81445,33.330079 7.31,7.309995 15.40581,15.4048021 22.7129,22.7128901 8.839,8.8476129 20.84096,13.8085939 33.32617,13.8085939 12.49224,0 24.49847,-4.964769 33.33789,-13.8144533 4.10133,-4.1013309 4.88019,-4.87994392 7.7539,-7.7539062 10.21597,5.285344 20.92288,9.7344764 32.04102,13.2890625 v 10.960937 c 0,25.853154 21.279659,47.132813 47.132812,47.132813 h 32.132812 C -6.2816124,69.28125 15,48.002154 15,22.148437 V 11.1875 C 26.118333,7.6328504 36.824883,3.1819523 47.041016,-2.1035156 c 2.87582,2.87631486 3.654527,3.6564808 7.759765,7.7617187 8.838794,8.8449339 20.843559,13.8085939 33.333985,13.8085939 12.487444,0 24.490074,-4.964182 33.330074,-13.8144533 7.30499,-7.3059798 15.39793,-15.3969269 22.70508,-22.7050777 l 0.008,-0.0078 c 8.84692,-8.839351 13.80664,-20.841111 13.80664,-33.324219 10e-6,-12.488328 -4.96171,-24.49318 -13.80859,-33.332031 l -0.006,-0.0078 -7.7539,-7.751953 c 5.28565,-10.216848 9.73769,-20.923258 13.29296,-32.042968 h 10.95704 c 25.85371,0 47.13476,-21.27964 47.13476,-47.13281 v -32.13282 c 0,-25.85317 -21.28105,-47.13476 -47.13476,-47.13476 h -10.95899 c -3.55494,-11.11802 -8.00597,-21.82343 -13.29101,-32.03906 2.87345,-2.87358 3.65267,-3.65317 7.7539,-7.75391 l 0.006,-0.006 c 8.84653,-8.83939 13.80859,-20.84515 13.80859,-33.33398 10e-6,-12.48353 -4.96112,-24.48479 -13.80859,-33.32422 l -0.006,-0.008 -22.70508,-22.70312 c -8.84068,-8.85242 -20.84381,-13.81641 -33.330074,-13.81641 -12.491609,0 -24.499897,4.96424 -33.339844,13.81446 -4.10133,4.10133 -4.880438,4.88019 -7.753906,7.7539 C 36.825339,-376.62091 26.118493,-381.07054 15,-384.625 v -10.96094 c 0,-25.85371 -21.2810489,-47.13281 -47.134766,-47.13281 z m 0,30 h 32.132812 c 9.638248,0 17.134766,7.49456 17.134766,17.13281 v 22.14844 a 15.0015,15.0015 0 0 0 11.2519531,14.52539 c 16.2963859,4.20475 31.6898509,10.66041 45.8320309,19.02344 a 15.0015,15.0015 0 0 0 18.242188,-2.30469 c 0,0 7.388934,-7.39089 15.6875,-15.68945 a 15.0015,15.0015 0 0 0 0.0059,-0.006 c 3.212042,-3.21577 7.55886,-5.01563 12.115235,-5.01563 4.541714,0 8.894208,1.80206 12.103514,5.01563 a 15.0015,15.0015 0 0 0 0.008,0.006 l 22.7168,22.71875 a 15.0015,15.0015 0 0 0 0.008,0.006 c 3.21416,3.20989 5.01367,7.56228 5.01368,12.10547 0,4.55637 -1.79986,8.90124 -5.01563,12.11328 a 15.0015,15.0015 0 0 0 -0.004,0.006 c -8.29979,8.29879 -15.6914,15.6914 -15.6914,15.6914 a 15.0015,15.0015 0 0 0 -2.30274,18.24024 c 8.36257,14.14048 14.81644,29.53405 19.02344,45.83203 a 15.0015,15.0015 0 0 0 14.52539,11.25 h 22.14649 c 9.63824,0 17.13476,7.49797 17.13476,17.13476 v 32.13282 c 0,9.63679 -7.49652,17.13281 -17.13476,17.13281 h -22.14649 a 15.0015,15.0015 0 0 0 -14.52539,11.25195 c -4.20697,16.29879 -10.66246,31.69002 -19.02539,45.832033 a 15.0015,15.0015 0 0 0 2.30469,18.242188 l 15.68945,15.689453 a 15.0015,15.0015 0 0 0 0.008,0.0059 c 3.21475,3.21048 5.01368,7.556907 5.01368,12.113281 0,4.543181 -1.79952,8.893622 -5.01368,12.103516 a 15.0015,15.0015 0 0 0 -0.008,0.0078 c -7.30897,7.309973 -15.40774,15.406737 -22.71875,22.718749 a 15.0015,15.0015 0 0 0 -0.006,0.0059 c -3.209986,3.213716 -7.562974,5.015625 -12.103514,5.015625 -4.555202,0 -8.902513,-1.799705 -12.115235,-5.015625 a 15.0015,15.0015 0 0 0 -0.0059,-0.0059 c -8.29814,-8.298139 -15.6875,-15.689453 -15.6875,-15.689453 a 15.0015,15.0015 0 0 0 -18.242188,-2.304687 c -14.141413,8.363499 -29.53459,14.819451 -45.8320309,19.02539 A 15.0015,15.0015 0 0 0 -15,0 v 22.148437 c 0,9.638248 -7.495954,17.132813 -17.134766,17.132813 h -32.132812 c -9.638811,0 -17.132813,-7.494001 -17.132813,-17.132813 V 0 a 15.0015,15.0015 0 0 0 -11.251953,-14.523438 c -16.297436,-4.205939 -31.688666,-10.661891 -45.830076,-19.02539 a 15.0015,15.0015 0 0 0 -18.24414,2.304687 c 0,0 -7.38894,7.390888 -15.6875,15.689453 a 15.0015,15.0015 0 0 0 -0.006,0.0059 c -3.21058,3.214303 -7.55955,5.015625 -12.11328,5.015625 -4.54201,0 -8.89705,-1.800986 -12.10547,-5.013672 a 15.0015,15.0015 0 0 0 -0.006,-0.0078 c -7.31101,-7.312012 -15.4102,-15.40824 -22.7207,-22.718749 a 15.0015,15.0015 0 0 0 -0.006,-0.0059 c -3.21431,-3.210573 -5.01563,-7.563462 -5.01563,-12.105469 0,-4.555201 1.80074,-8.902121 5.01563,-12.113281 a 15.0015,15.0015 0 0 0 0.006,-0.0059 c 8.29856,-8.298566 15.68945,-15.689453 15.68945,-15.689453 a 15.0015,15.0015 0 0 0 2.30664,-18.242188 c -8.3634,-14.141243 -14.81829,-29.532733 -19.02539,-45.832033 a 15.0015,15.0015 0 0 0 -14.52539,-11.25195 h -22.14649 c -9.63824,0 -17.13281,-7.49602 -17.13281,-17.13281 v -32.13282 c 0,-9.63679 7.49457,-17.13476 17.13281,-17.13476 h 22.14649 a 15.0015,15.0015 0 0 0 14.52539,-11.25 c 4.20713,-16.2985 10.6604,-31.69037 19.02344,-45.83008 a 15.0015,15.0015 0 0 0 -2.30274,-18.24414 c 0,0 -7.39203,-7.39108 -15.6914,-15.68945 a 15.0015,15.0015 0 0 0 -0.004,-0.004 c -3.21592,-3.21272 -5.01758,-7.56003 -5.01758,-12.11523 0,-4.54201 1.80132,-8.8949 5.01563,-12.10547 a 15.0015,15.0015 0 0 0 0.006,-0.006 c 7.31152,-7.31053 15.41071,-15.40876 22.7207,-22.71875 a 15.0015,15.0015 0 0 0 0.008,-0.008 c 3.20775,-3.21254 7.56034,-5.01368 12.10352,-5.01368 4.55491,0 8.90143,1.80147 12.11133,5.01563 a 15.0015,15.0015 0 0 0 0.008,0.006 l 15.6875,15.68945 a 15.0015,15.0015 0 0 0 18.24219,2.30469 c 14.14217,-8.36303 29.53564,-14.81869 45.832026,-19.02344 a 15.0015,15.0015 0 0 0 11.251953,-14.52539 v -22.14844 c 0,-9.63881 7.494565,-17.13281 17.132813,-17.13281 z" id="path250" transform="translate(304.2002,442.7187)" /><path d="m 0,-207.80078 c -61.323725,0 -111.40039,50.0777 -111.40039,111.400389 C -111.40039,-35.076854 -61.323537,15 0,15 61.323537,15 111.40039,-35.076854 111.40039,-96.400391 111.40039,-157.72308 61.323725,-207.80078 0,-207.80078 Z m 0,30 c 45.086169,0 81.400391,36.31518 81.400391,81.400389 C 81.400391,-51.314034 45.086357,-15 0,-15 c -45.086357,0 -81.400391,-36.314034 -81.400391,-81.400391 0,-45.085209 36.314222,-81.400389 81.400391,-81.400389 z" id="path245" transform="translate(256,352.3999)" /></g></svg>'
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
     * Streams/webrtc/livestream tool.
     * 
     * @module Streams
     * @constructor
     * @param {Object} options
     */
    Q.Tool.define("Streams/webrtc/callCenter/manager", function (options) {
        var tool = this;
        
        tool.callCenterStream = null; //stream to which all calls is related
        tool.callCenterMode = 'regular'; //regular||liveShow
        tool.iAmConnectedToCallCenterRoom = false;
        tool.endpointCallsListEl = null;
        tool.relatedStreamsTool = null;
        tool.relatedStreams = [];
        tool.callsList = [];
        tool.moderators = [];
        tool.currentActiveWebRTCRoom = null;

        tool.loadStyles().then(function() {
            return tool.getCallCenterEndpointStream();
        }).then(function(stream) {
            console.log('stream to get', stream, stream.testReadLevel('relations'), stream.testWriteLevel('relate'), stream.testAdminLevel('invite'))
            if(!stream.testReadLevel('relations') || !stream.testWriteLevel('relate') || !stream.testAdminLevel('invite')) {
                return Q.alert('You are now allowed to create call center on this stream');
            }

            tool.callCenterStream = stream;
            tool.callCenterMode = stream.fields.type == 'Streams/webrtc' ? 'liveShow' : 'regular';
            console.log('callCenterStream', tool.callCenterStream);
            tool.callCenterStream.observe();
            tool.declareStreamEventHandlers();
            tool.buildInterface();
        });
    },

        {
            publisherId: null,
            streamName: null,
            operatorSocketId: null,
            onRefresh: new Q.Event()
        },

        {
            refresh: function () {
                var tool = this;
            },
            declareStreamEventHandlers: function() {
                var tool = this;
                tool.callCenterStream.onMessage("Streams/webrtc/accepted").set(function (stream, message) {
                    console.log('Streams/webrtc/accepted', message)
                    var instructions = JSON.parse(message.instructions);
                    var callDataObject = getCallDataObject(instructions.waitingRoom.streamName);
                    if(!callDataObject) return;
                    callDataObject.statusInfo.status = 'accepted';
                    callDataObject.statusInfo.byUserId = instructions.byUserId;
                    tool.updateCallButtons(callDataObject);
                }, tool);
                tool.callCenterStream.onMessage("Streams/webrtc/callEnded").set(function (stream, message) {
                    console.log('Streams/webrtc/callEnded', message)
                    var instructions = JSON.parse(message.instructions);
                    var callDataObject = getCallDataObject(instructions.waitingRoom.streamName);
                    if(!callDataObject) return;
                    callDataObject.statusInfo.status = 'ended';
                    callDataObject.statusInfo.byUserId = instructions.byUserId;
                    tool.updateCallButtons(callDataObject);
                }, tool);
                
                tool.callCenterStream.onMessage("Streams/webrtc/callDeclined").set(function (stream, message) {
                    console.log('Streams/webrtc/callDeclined', message)
                    var instructions = JSON.parse(message.instructions);
                    var callDataObject = getCallDataObject(instructions.waitingRoom.streamName);
                    if(!callDataObject) return;
                    callDataObject.statusInfo.status = 'declined';
                    callDataObject.statusInfo.byUserId = instructions.byUserId;
                    tool.updateCallButtons(callDataObject);
                }, tool);
                
                tool.callCenterStream.onMessage("Streams/webrtc/interview").set(function (stream, message) {
                    console.log('Streams/webrtc/interview', message)
                    var instructions = JSON.parse(message.instructions);
                    var callDataObject = getCallDataObject(instructions.waitingRoom.streamName);
                    if(!callDataObject) return;
                    callDataObject.statusInfo.status = 'interview';
                    callDataObject.statusInfo.byUserId = instructions.byUserId;
                    tool.updateCallButtons(callDataObject);
                }, tool);
                
                tool.callCenterStream.onMessage("Streams/webrtc/approved").set(function (stream, message) {
                    console.log('Streams/webrtc/approved', message)
                    var instructions = JSON.parse(message.instructions);
                    var callDataObject = getCallDataObject(instructions.waitingRoom.streamName);
                    if(!callDataObject) return;
                    callDataObject.statusInfo.isApproved = instructions.isApproved;
                    console.log('Streams/webrtc/approved isApproved', callDataObject.statusInfo.isApproved)

                    callDataObject.statusInfo.isApprovedByUserId = instructions.byUserId;
                    tool.updateCallButtons(callDataObject);
                }, tool);
                
                tool.callCenterStream.onMessage("Streams/webrtc/hold").set(function (stream, message) {
                    console.log('Streams/webrtc/hold', message)
                    var instructions = JSON.parse(message.instructions);
                    var callDataObject = getCallDataObject(instructions.waitingRoom.streamName);
                    if(!callDataObject) return;
                    callDataObject.statusInfo.onHold = instructions.onHold;
                    callDataObject.statusInfo.status = 'created';
                    console.log('Streams/webrtc/hold onHold', callDataObject.statusInfo.onHold)

                    callDataObject.statusInfo.putOnHoldByUserId = instructions.byUserId;
                    tool.updateCallButtons(callDataObject);
                }, tool);

                function getCallDataObject(streamNameOfCall) {
                    for (let c in tool.callsList) {
                        if(streamNameOfCall == tool.callsList[c].webrtcStream.fields.name) {
                            return tool.callsList[c];
                        }
                    }
                    return null;
                }
            },
            loadStyles: function () {
                return new Promise(function(resolve, reject){
                    Q.addStylesheet('{{Streams}}/css/tools/callCenterManager.css?ts=' + performance.now(), function () {
                        resolve();
                    });
                });
            },
            getCallCenterEndpointStream: function () {
                var tool = this;
                return new Promise(function (resolve, reject) {
                    Q.req("Streams/callCenter", ["makeCallCenterFromStream"], function (err, response) {
                        var msg = Q.firstErrorMessage(err, response && response.errors);

                        if (msg) {
                            reject('Error while making call center from a stream');
                        }
                        Q.Streams.get(tool.state.publisherId, tool.state.streamName, function (err, stream) {
                            if (!stream) {
                                console.error('Error while getting call center stream', err);
                                reject('Error while getting call center stream');
                                return;
                            }
    
                            resolve(stream);
                        });
                    }, {
                        method: 'post',
                        fields: {
                            publisherId: tool.state.publisherId,
                            streamName: tool.state.streamName
                        }
                    });
                    
                });
            },
            initColumnsTool: function (container) {
                return new Promise(function(resolve, reject) {
                    Q.activate(
                        Q.Tool.setUpElement(
                            container,
                            "Q/columns",
                            {
                                
                            }
                        ),
                        function () {
                            resolve(this);
                        }
                    );
                });
            },
            buildInterface: function () {
                var tool = this;
                var socketConns = Q.Users.Socket.get();
                if (!socketConns || Object.keys(socketConns).length == 0 || socketConns[Object.keys(socketConns)[0]] == null || !socketConns[Object.keys(socketConns)[0]].socket.id) {
                    console.log('buildInterface no socket',socketConns)

                    Q.Socket.onConnect('Users').add(function () {
                        console.log('onSession: no socket connection yet');
                        tool.buildInterface()
                    })
                    return;
                }

                if (Object.keys(socketConns).length == 0) {
                    Q.alert('To continue you should be connected to the socket server.');
                    return;
                }  

                console.log('tool.state.operatorSocketId socketConns',socketConns)
                console.log('tool.state.operatorSocketId socketConns2',socketConns[Object.keys(socketConns)[0]])

                tool.state.operatorSocketId = socketConns[Object.keys(socketConns)[0]].socket.id;
                console.log('tool.state.operatorSocketId', tool.state.operatorSocketId)

                var toolContainer = document.createElement('DIV');
                toolContainer.className = 'streams-callcenter-m-container';

                var toolContainerInner = document.createElement('DIV');
                toolContainerInner.className = 'streams-callcenter-m-container-inner';
                toolContainer.appendChild(toolContainerInner);
                
                //var settings = tool.createSettingsDialog();
                //toolContainerInner.appendChild(settings);
                
                var controlButtonsCon = document.createElement('DIV');
                controlButtonsCon.className = 'streams-callcenter-m-controls-con';
                toolContainerInner.appendChild(controlButtonsCon);
                
                var controlButtons = document.createElement('DIV');
                controlButtons.className = 'streams-callcenter-m-controls';
                controlButtonsCon.appendChild(controlButtons);

                if(tool.callCenterMode == 'liveShow' && tool.callCenterStream.testWriteLevel('join')) {
                   

                    let openWebrtcRoomBtn = document.createElement('BUTTON');
                    openWebrtcRoomBtn.className = 'streams-callcenter-m-controls-open-webrtc';
                    openWebrtcRoomBtn.innerHTML = 'Join Teleconference';
                    controlButtons.appendChild(openWebrtcRoomBtn);

                    openWebrtcRoomBtn.addEventListener('click', function () {
                        tool.startOrJoinLiveShowTeleconference();
                    });
                }

                let settingsBtn = document.createElement('BUTTON');
                settingsBtn.className = 'streams-callcenter-m-controls-settings';
                settingsBtn.innerHTML = _icons.settings;
                controlButtons.appendChild(settingsBtn);

                /*Q.addScript("{{Q}}/js/contextual.js", function () {
                    $(settingsBtn).plugin('Q/contextual', {
                        className: "streams-callcenter-m-settings",
                        fadeTime: 300,
                        doubleBlink: false,
                        onConstruct: function (contextual, cid) {
                            tool.settingsContextual = this;
                            tool.createSettingsContextual();
                        }
                    });
                });*/

                var endpointCallsCon = document.createElement('DIV');
                endpointCallsCon.className = 'streams-callcenter-m-enpoints-calls-con';
                toolContainerInner.appendChild(endpointCallsCon);

                var endpointCallsInner = tool.endpointCallsListEl = document.createElement('DIV');
                endpointCallsInner.className = 'streams-callcenter-m-enpoints-calls';
                endpointCallsCon.appendChild(endpointCallsInner);

                tool.element.appendChild(toolContainer);

                settingsBtn.addEventListener('click', function (e) {
                    var settings = tool.createSettingsDialog();
                    Q.Dialogs.push({
                        title: 'Assign roles in call center',
                        content: settings,

                    });
                });

                Q.activate(
                    Q.Tool.setUpElement('div', 'Streams/related', {
                        publisherId: tool.callCenterStream.fields.publisherId,
                        streamName: tool.callCenterStream.fields.name,
                        relationType: 'Streams/webrtc/callCenter/call',
                        tag: 'div',
                        isCategory: true,
                        creatable: false,
                        realtime: true,
                        onUpdate: function (e) {
                            console.log('onUpdate', e, this)
                            tool.relatedStreams = e.relatedStreams;
                            tool.reloadCallsList();
                            if(!tool.callsListLoaded) {
                                tool.callsListLoaded = true;
                                tool.onCallsListFirstLoadHandler()
                            }
                        },
                        beforeRenderPreview: function (e) {
                            console.log('beforeRenderPreview', e, this)
                        }
                    }),
                    {},
                    function () {
                        _relatedStreamsTool = this;
                    }
                ); 
                
            },
            createSettingsDialog: function () {
                var tool = this;
                var settingsDialog = document.createElement('DIV');
                settingsDialog.className = 'streams-callcenter-m-settings-dialog';

                var roles = document.createElement('DIV');
                roles.className = 'streams-callcenter-m-settings-roles-chooser';
                settingsDialog.appendChild(roles);

                var userChooserInput = document.createElement('INPUT');
                userChooserInput.className = 'text Streams_userChooser_input streams-callcenter-m-query';
                userChooserInput.name = 'query';
                userChooserInput.autocomplete = 'off';
                roles.appendChild(userChooserInput)

                var selectedUsers = document.createElement("DIV");
                selectedUsers.className = 'streams-callcenter-m-settings-roles';
                settingsDialog.appendChild(selectedUsers);

                Q.activate(
                    Q.Tool.setUpElement(roles, 'Streams/userChooser', {}),
                    {},
                    function () {
                        console.log('Streams/userChooser')
                        tool.userChooserTool = this;
                        this.state.onChoose.set(function (userId, avatar) {
                            console.log('userId, avatar', userId, avatar);
                            addSelectedUser(userId)
                        }, tool);
                    }
                );

                updateRolesList(true);

                function updateRolesList(retnderList) {
                    getCurrentRoles().then(function (contacts) {
                        console.log('getCurrentRoles', contacts);
                        for(let i in contacts) {
                            let roleAlreadyExists = tool.moderators.findIndex(function (el) {
                                return el.label == contacts[i].label;
                            })
                            if(roleAlreadyExists != -1) continue;
                            contacts[i].roleInCallCenter = contacts[i].label;
                            if(retnderList) {
                                addSelectedUser(contacts[i].contactUserId, contacts[i]);
                            }
                            tool.moderators.push(contacts[i]);
                        }
                    })
                }

                function addSelectedUser(userId, contactInstance) {
                    var contactInstance = contactInstance || null;
                    console.log('addSelectedUser')
                    var labels = [
                        {
                            key: 'hosts',
                            label: 'Users/hosts',
                            displayLabelName: 'Host'
                        },
                        {
                            key: 'screeners',
                            label: 'Users/screeners',
                            displayLabelName: 'Screener'
                        }
                    ];
                    var userItem = document.createElement("DIV");
                    userItem.className = 'streams-callcenter-m-settings-roles-item';
                    var userItemAvatar = document.createElement("DIV");
                    userItemAvatar.className = 'streams-callcenter-m-settings-roles-avatar';
                    userItem.appendChild(userItemAvatar);
                    
                    var userItemRolesCon = document.createElement("DIV");
                    userItemRolesCon.className = 'streams-callcenter-m-settings-roles-con';
                    userItem.appendChild(userItemRolesCon);
                    var userItemRole = document.createElement("SELECT");
                    userItemRole.className = 'streams-callcenter-m-settings-roles-role';
                    userItem.appendChild(userItemRole);
                    var placeholder = document.createElement("OPTION");
                    placeholder.value = '';
                    placeholder.disabled = true;
                    placeholder.selected = contactInstance ? false : true;
                    placeholder.innerHTML = 'Select role';
                    userItemRole.appendChild(placeholder);

                    for(let r in labels) {
                        let role = document.createElement("OPTION");
                        role.value = labels[r].key;
                        role.selected = contactInstance && contactInstance.label == labels[r].label ? true : false;
                        role.innerHTML =  labels[r].displayLabelName;
                        userItemRole.appendChild(role);
                    }

                    var removeUser = document.createElement("DIV");
                    removeUser.className = 'streams-callcenter-m-settings-roles-item-remove';
                    userItem.appendChild(removeUser);

                    selectedUsers.appendChild(userItem)

                    Q.activate(
                        Q.Tool.setUpElement(
                            userItemAvatar, // or pass an existing element
                            "Users/avatar",
                            {
                                userId: userId,
                                icon: true,
                                contents: true
                            }
                        )
                    );

                    userItemRole.addEventListener('change', function () {
                        var newLabel = userItemRole.value;
                        console.log('change', newLabel)
                        if(contactInstance) console.log('change', contactInstance.roleInCallCenter)
                        if(contactInstance && newLabel != contactInstance.roleInCallCenter.split('/')[1]) {
                            var promises = [];
                            console.log('tool.moderators', tool.moderators)
                            for (let m in tool.moderators) {
                                if(tool.moderators[m].contactUserId == userId) {
                                    promises.push(removeRole(tool.moderators[m].label, userId));
                                    tool.moderators[m] = null;
                                    tool.moderators = tool.moderators.filter(function (el) {
                                        return el != null;
                                    });
                                }
                            }

                            Promise.all(promises).then(function (contact) {
                                console.log('Promise.all')
                                changeRole(newLabel, userId).then(function() {
                                    if(!contactInstance) {
                                        contactInstance = contact;
                                        tool.moderators.push(contactInstance);
                                    }
                                    contactInstance.roleInCallCenter = newLabel
                                    updateRolesList();
                                });
                            })
                        } else {
                            changeRole(newLabel, userId).then(function(contact) {
                                if(!contactInstance) {
                                    contactInstance = contact;
                                    tool.moderators.push(contactInstance);
                                }
                                contactInstance.roleInCallCenter = newLabel
                                updateRolesList();
                            });
                        }                        
                    });

                    removeUser.addEventListener('click', function () {
                        if(contactInstance) {
                            removeRole(contactInstance.roleInCallCenter, contactInstance.contactUserId).then(function() {
                                userItem.parentElement.removeChild(userItem);
                            });
                        } else {
                            if(userItem.parentElement != null) {
                                userItem.parentElement.removeChild(userItem);
                            }
                        }
                    });
                }

                function removeRole(label, contactUserId) {
                    console.log('removeRole', label)

                    return new Promise(function (resolve, reject) {
                        Q.req('Users/contact', '', function (err, data) {
                            var msg = Q.firstErrorMessage(err, data);
                            if (msg) {
                                return reject(msg);
                            }


                            resolve(data);
                        }, {
                            fields: {
                                userId: Q.Users.loggedInUserId(),
                                label: label,
                                contactUserId: contactUserId
                            },
                            method: 'delete'
                        });
                    });
                }

                function changeRole(newLabel, userId) {
                    return new Promise (function (resolve, reject) {
                        getMyUsersLabels().then(function (myLabels) {
                            console.log('myLabels', myLabels)
                            var existingLabels = Object.keys(myLabels)
    
                            if(existingLabels.indexOf('Users/' + newLabel) == -1) {
                                console.log('change 1')
    
                                return createUsersLabel(newLabel).then(function (labelInstance) {
                                    console.log('labelInstance', labelInstance)
                                    return assignLabelToUser('Users/' + newLabel, userId)
                                }).then(function (contactInstance) {
                                    console.log('contactInstance', contactInstance)
                                    resolve(contactInstance);
                                });
                            } else {
                                return assignLabelToUser('Users/' + newLabel, userId).then(function (contactInstance) {
                                    console.log('contactInstance', contactInstance)
                                    resolve(contactInstance);
                                });
                            }
                        })
                    });
                }


                function getCurrentRoles() {
                    return new Promise(function (resolve, reject) {
                        Q.req('Users/contact', 'contacts', function (err, data) {
                            var msg = Q.firstErrorMessage(err, data);
                            if (msg) {
                                return reject(msg)
                            }

                            Q.each(data.slots.contacts, function (i) {
                                data.slots.contacts[i] = new Q.Users.Contact(data.slots.contacts[i]);
                            });
                            resolve(data.slots.contacts);
                        }, {
                            fields: {
                                userId: Q.Users.loggedInUserId(),
                                labels: ['Users/hosts', 'Users/screeners']
                            },
                            method: 'get'
                        });
                    });
                }

                function getMyUsersLabels() {
                    return new Promise(function (resolve, reject) {
                        Q.req('Users/label', 'labels', function (err, data) {
                            var msg = Q.firstErrorMessage(err, data);
                            if (msg) {
                                return reject(msg)
                            }

                            Q.each(data.slots.labels, function (i) {
                                data.slots.labels[i] = new Q.Users.Label(data.slots.labels[i]);
                            });
                            resolve(data.slots.labels);
                        }, {
                            fields: {
                                userId: Q.Users.loggedInUserId(),
                                labels: 'Users/'
                            },
                            method: 'post'
                        });
                    });
                }

                function createUsersLabel(title) {
                    return new Promise(function (resolve, reject) {
                        Q.req('Users/label', 'label', function (err, data) {
                            var msg = Q.firstErrorMessage(err, data);
                            if (msg) {
                                return reject(msg)
                            }

                            var labelObj = new Q.Users.Label(data.slots['label']);

                            resolve(labelObj);
                        }, {
                            fields: {
                                userId: Q.Users.loggedInUserId(),
                                title: title
                            },
                            method: 'post'
                        });
                    });
                }

                function assignLabelToUser(label, contactUserId) {
                    return new Promise(function (resolve, reject) {
                        Q.req('Users/contact', 'contact', function (err, data) {
                            console.log('ata.slots.contact', data.slots.contact);
                            var msg = Q.firstErrorMessage(err, data);
                            if (msg) {
                                return reject(msg);
                            }

                            var contact = new Q.Users.Contact(data.slots.contact[0]);

                            resolve(contact);
                        }, {
                            fields: {
                                userId: Q.Users.loggedInUserId(),
                                label: label,
                                contactUserId: contactUserId
                            },
                            method: 'post'
                        });
                    });
                }

                return settingsDialog;
            },
            handleStreamEvents: function (stream, callDataObject) {
                var tool = this;
                stream.onMessage("Streams/changed").set(function (stream, message) {
                    if(callDataObject.title != stream.fields.title) {
                        callDataObject.callTitleEl.innerHTML = callDataObject.title = stream.fields.title;
                    }
                    if(callDataObject.topic != stream.fields.content) {
                        callDataObject.callTopicEl.innerHTML = callDataObject.topic = stream.fields.content;
                    }
                }, tool);
            },
            reloadCallsList: function () {
                var tool = this;
                console.log('reloadCallsList: relatedStreams', relatedStreams);
                var relatedStreams = tool.relatedStreams;
                for (let s in relatedStreams) {
                    let stream = relatedStreams[s];
                    let callExists;
                    for (let c in tool.callsList) {
                        if(stream.fields.name == tool.callsList[c].webrtcStream.fields.name) {
                            callExists = tool.callsList[c];
                            break;
                        }
                    }
                    console.log('reloadCallsList: callExists', callExists);

                    if(callExists != null) {
                        if(callExists.title != stream.fields.title) {
                            callExists.callTitleEl.innerHTML = callExists.title = stream.fields.title;
                        }
                        if(callExists.topic != stream.fields.content) {
                            callExists.callTopicEl.innerHTML = callExists.topic = stream.fields.content;
                        }
                        continue;
                    }

                    var status = stream.getAttribute('status');
                    console.log('reloadCallsList: status', status);

                    var isApproved = stream.getAttribute('isApproved');
                    var onHold = stream.getAttribute('onHold');
                    let callDataObject = {
                        title: stream.fields.title,
                        topic: stream.fields.content,
                        webrtcStream: stream,
                        timestamp: convertDateToTimestamp(stream.fields.insertedTime),
                        statusInfo: {
                            status: status ? status : 'created',
                            isApproved: isApproved == true || isApproved == 'true' ? true : false,
                            isApprovedByUserId: null,
                            onHold: onHold == true || onHold == 'true' ? true : false,
                            putOnHoldByUserId: null
                        }
                    }

                    createCallItemElement(callDataObject);
                    tool.updateCallButtons(callDataObject);

                    console.log('reloadCallsList: callDataObject', callDataObject);
                    tool.callsList.unshift(callDataObject);

                    tool.callsList.sort(function(x, y){
                        return y.timestamp - x.timestamp;
                    })

                    tool.handleStreamEvents(stream, callDataObject);
                }

                for(let c in tool.callsList) {
                    tool.endpointCallsListEl.appendChild(tool.callsList[c].callElement);
                }

                console.log('reloadCallsList: callsList', tool.callsList.length)
                for (let i = tool.callsList.length - 1; i >= 0; i--) {
                    console.log('reloadCallsList: callsList for', i)

                    let callIsClosed = true;
                    for (let n in relatedStreams) {
                        if(relatedStreams[n].fields.name == tool.callsList[i].webrtcStream.fields.name) {
                            callIsClosed = false;
                        }
                    }
                    if(callIsClosed) {
                        console.log('reloadCallsList: callsList for remove', i)
                        if(tool.callsList[i].callElement && tool.callsList[i].callElement.parentElement != null) {
                            tool.callsList[i].callElement.parentElement.removeChild(tool.callsList[i].callElement);
                        }
                        tool.callsList.splice(i, 1);
                    }
                }

                function createCallItemElement(callDataObject) {
                    if(tool.callCenterMode == 'regular') {
                        var callItemContainer = document.createElement('DIV');
                        callItemContainer.className = 'streams-callcenter-m-calls-item';
        
                        var callItemInnerCon = document.createElement('DIV');
                        callItemInnerCon.className = 'streams-callcenter-m-calls-item-inner';
                        callItemContainer.appendChild(callItemInnerCon);
        
                        var callItemAvatar = document.createElement('DIV');
                        callItemAvatar.className = 'streams-callcenter-m-calls-item-avatar';
                        callItemInnerCon.appendChild(callItemAvatar);
    
                        var callItemInfo = document.createElement('DIV');
                        callItemInfo.className = 'streams-callcenter-m-calls-item-info';
                        callItemInnerCon.appendChild(callItemInfo);
        
                        var callTitle = document.createElement('DIV');
                        callTitle.className = 'streams-callcenter-m-calls-item-title';
                        callTitle.innerHTML = callDataObject.webrtcStream.fields.title;
                        callItemInfo.appendChild(callTitle);
        
                        var callTopic = document.createElement('DIV');
                        callTopic.className = 'streams-callcenter-m-calls-item-topic';
                        callTopic.innerHTML = callDataObject.webrtcStream.fields.content;
                        callItemInfo.appendChild(callTopic);
        
                        var callButtons = document.createElement('DIV');
                        callButtons.className = 'streams-callcenter-m-calls-item-buttons';
                        callItemInfo.appendChild(callButtons);

                        var interviewButton = document.createElement('BUTTON');
                        interviewButton.className = 'streams-callcenter-m-calls-item-buttons-btn streams-callcenter-m-calls-item-buttons-interview';
                        interviewButton.innerHTML = 'Interview';
                        callButtons.appendChild(interviewButton);
        
                        var holdButton = document.createElement('BUTTON');
                        holdButton.className = 'streams-callcenter-m-calls-item-buttons-btn streams-callcenter-m-calls-item-buttons-hold';
                        holdButton.innerHTML = 'Hold';
                        callButtons.appendChild(holdButton);
        
                        var declineButton = document.createElement('BUTTON');
                        declineButton.className = 'streams-callcenter-m-calls-item-buttons-btn streams-callcenter-m-calls-item-buttons-decline';
                        declineButton.innerHTML = 'End Call';
                        callButtons.appendChild(declineButton);
    
                        interviewButton.addEventListener('click', function () {
                            tool.onInterviewHandler(callDataObject);
                            tool.updateCallButtons(callDataObject);
                        });
    
                        declineButton.addEventListener('click', function () {
                            tool.onDeclineHandler(callDataObject);
                            tool.updateCallButtons(callDataObject);
                        });
    
                        holdButton.addEventListener('click', function () {
                            tool.onHoldHandler(callDataObject);
                            tool.updateCallButtons(callDataObject);
                        });
    
                        Q.activate(
                            Q.Tool.setUpElement(
                                callItemAvatar,
                                "Users/avatar",
                                {
                                    userId: callDataObject.webrtcStream.publisherId,
                                    contents: false
                                }
                            )
                        );

                        callDataObject.callElement = callItemContainer;
                        callDataObject.callTitleEl = callTitle;
                        callDataObject.callTopicEl = callTopic;
                        callDataObject.interviewButtonEl = interviewButton;
                        callDataObject.holdButtonEl = holdButton;
                        callDataObject.declineButtonEl = declineButton;

                    } else if(tool.callCenterMode == 'liveShow') {
                        var callItemContainer = document.createElement('DIV');
                        callItemContainer.className = 'streams-callcenter-m-calls-item';
        
                        var callItemInnerCon = document.createElement('DIV');
                        callItemInnerCon.className = 'streams-callcenter-m-calls-item-inner';
                        callItemContainer.appendChild(callItemInnerCon);
        
                        var callItemAvatar = document.createElement('DIV');
                        callItemAvatar.className = 'streams-callcenter-m-calls-item-avatar';
                        callItemInnerCon.appendChild(callItemAvatar);
    
                        var callItemInfo = document.createElement('DIV');
                        callItemInfo.className = 'streams-callcenter-m-calls-item-info';
                        callItemInnerCon.appendChild(callItemInfo);
        
                        var callTitle = document.createElement('DIV');
                        callTitle.className = 'streams-callcenter-m-calls-item-title';
                        callTitle.innerHTML = callDataObject.webrtcStream.fields.title;
                        callItemInfo.appendChild(callTitle);
        
                        var callDate = document.createElement('DIV');
                        callDate.className = 'streams-callcenter-m-calls-item-date';
                        Q.activate(
                            Q.Tool.setUpElement(
                                callDate,
                                "Q/timestamp",
                                {
                                    time: callDataObject.webrtcStream.fields.insertedTime,
                                    capitalized: true,
                                    relative: false
                                }
                            )
                        );

                        callItemInfo.appendChild(callDate);
        
                        var callTopic = document.createElement('DIV');
                        callTopic.className = 'streams-callcenter-m-calls-item-topic';
                        callTopic.innerHTML = callDataObject.webrtcStream.fields.content;
                        callItemInfo.appendChild(callTopic);
        
                        var callButtons = document.createElement('DIV');
                        callButtons.className = 'streams-callcenter-m-calls-item-buttons';
                        callItemInfo.appendChild(callButtons);
        
                        var markApprovedButton = document.createElement('BUTTON');
                        markApprovedButton.className = 'streams-callcenter-m-calls-item-buttons-btn streams-callcenter-m-calls-item-buttons-approve';
                        markApprovedButton.innerHTML = 'Mark Approved';
                        callButtons.appendChild(markApprovedButton);
        
                        var acceptButton = document.createElement('BUTTON');
                        acceptButton.className = 'streams-callcenter-m-calls-item-buttons-btn streams-callcenter-m-calls-item-buttons-accept';
                        acceptButton.innerHTML = 'Accept';
                        callButtons.appendChild(acceptButton);
        
                        var interviewButton = document.createElement('BUTTON');
                        interviewButton.className = 'streams-callcenter-m-calls-item-buttons-btn streams-callcenter-m-calls-item-buttons-interview';
                        interviewButton.innerHTML = 'Interview';
                        callButtons.appendChild(interviewButton);
        
                        var holdButton = document.createElement('BUTTON');
                        holdButton.className = 'streams-callcenter-m-calls-item-buttons-btn streams-callcenter-m-calls-item-buttons-hold';
                        holdButton.innerHTML = 'Hold';
                        callButtons.appendChild(holdButton);
        
                        var declineButton = document.createElement('BUTTON');
                        declineButton.className = 'streams-callcenter-m-calls-item-buttons-btn streams-callcenter-m-calls-item-buttons-decline';
                        declineButton.innerHTML = 'End Call';
                        callButtons.appendChild(declineButton);
    
                        markApprovedButton.addEventListener('click', function () {
                            tool.onMarkApprovedHandler(callDataObject);
                            tool.updateCallButtons(callDataObject);
                        });
    
                        acceptButton.addEventListener('click', function () {
                            tool.onAcceptHandler(callDataObject);
                            tool.updateCallButtons(callDataObject);
                        });
                        
                        interviewButton.addEventListener('click', function () {
                            tool.onInterviewHandler(callDataObject);
                            tool.updateCallButtons(callDataObject);
                        });
    
                        declineButton.addEventListener('click', function () {
                            tool.onDeclineHandler(callDataObject);
                            tool.updateCallButtons(callDataObject);
                        });
    
                        holdButton.addEventListener('click', function () {
                            tool.onHoldHandler(callDataObject);
                            tool.updateCallButtons(callDataObject);
                        });
    
                        Q.activate(
                            Q.Tool.setUpElement(
                                callItemAvatar,
                                "Users/avatar",
                                {
                                    userId: callDataObject.webrtcStream.publisherId,
                                    contents: false
                                }
                            )
                        );

                        callDataObject.callElement = callItemContainer;
                        callDataObject.callTitleEl = callTitle;
                        callDataObject.callTopicEl = callTopic;
                        callDataObject.markApprovedButtonEl = markApprovedButton;
                        callDataObject.acceptButtonEl = acceptButton;
                        callDataObject.interviewButtonEl = interviewButton;
                        callDataObject.holdButtonEl = holdButton;
                        callDataObject.declineButtonEl = declineButton;
                        
                    }
                    
                }
                
                function convertDateToTimestamp(str) {
                    const [dateComponents, timeComponents] = str.split(' ');
                    console.log(dateComponents); 
                    console.log(timeComponents); 

                    const [year, month, day] = dateComponents.split('-');
                    const [hours, minutes, seconds] = timeComponents.split(':');

                    const date = new Date(+year, month - 1, +day, +hours, +minutes, +seconds);
                    console.log(date); 

                    const timestamp = date.getTime();
                    return timestamp;
                }
            },
            onCallsListFirstLoadHandler: function () {
                var tool = this;
                //check whether some calls are already inactive after callCenterManager loaded for the first time
                for(let i in tool.callsList) {
                    let callDataObject = tool.callsList[i];
                    Q.req("Streams/callCenter", ["closeIfOffline"], function (err, response) {
                        var msg = Q.firstErrorMessage(err, response && response.errors);

                        if (msg) {
                            return Q.alert(msg);
                        }
                        console.log('requestCall: closeIfOffline', response.slots.closeIfOffline);

                    }, {
                        method: 'post',
                        fields: {
                            publisherId: callDataObject.webrtcStream.fields.publisherId,
                            streamName: callDataObject.webrtcStream.fields.name,
                            socketId: callDataObject.webrtcStream.getAttribute('socketId'),
                            operatorSocketId: tool.state.operatorSocketId
                        }
                    });
                }
            },
            updateCallButtons: function (callDataObject) {
                var tool = this;
                console.log('updateCallButtons', callDataObject.statusInfo);
                if(tool.callCenterMode == 'regular') {
                    if(callDataObject.statusInfo.status == 'created') {
                        hideButton(callDataObject.holdButtonEl);
                        showButton(callDataObject.interviewButtonEl);
                        showButton(callDataObject.declineButtonEl); 
                    } else if(callDataObject.statusInfo.status == 'accepted') {
                        showButton(callDataObject.holdButtonEl);
                        showButton(callDataObject.declineButtonEl); 
                        hideButton(callDataObject.interviewButtonEl);
                    }
                } else if(tool.callCenterMode == 'liveShow') {
                    if(callDataObject.statusInfo.status == 'created') {
                        console.log('updateCallButtons 1');
                        hideButton(callDataObject.holdButtonEl);
                        showButton(callDataObject.markApprovedButtonEl);
                        showButton(callDataObject.acceptButtonEl);
                        showButton(callDataObject.interviewButtonEl);
                        showButton(callDataObject.declineButtonEl);
                        callDataObject.declineButtonEl.innerHTML = 'Decline';
                    } else if(callDataObject.statusInfo.status == 'interview' && (callDataObject.statusInfo.byUserId == Q.Users.loggedInUserId() || callDataObject.statusInfo.byUserId == null)) {
                        console.log('updateCallButtons 2');
                        hideButton(callDataObject.interviewButtonEl);
                        showButton(callDataObject.holdButtonEl);
                        showButton(callDataObject.declineButtonEl);
                        showButton(callDataObject.markApprovedButtonEl);
                        showButton(callDataObject.acceptButtonEl);
                        callDataObject.declineButtonEl.innerHTML = 'Decline';
                    } else if(callDataObject.statusInfo.status == 'accepted') {
                        console.log('updateCallButtons 3');
                        showButton(callDataObject.declineButtonEl);
                        hideButton(callDataObject.holdButtonEl);
                        hideButton(callDataObject.markApprovedButtonEl);
                        hideButton(callDataObject.acceptButtonEl);
                        hideButton(callDataObject.interviewButtonEl);
                        callDataObject.declineButtonEl.innerHTML = 'Remove From Live';
                    }
                    
                    if(callDataObject.statusInfo.isApproved) {
                        console.log('updateCallButtons 4');
                        callDataObject.markApprovedButtonEl.innerHTML = 'Approved!';
                    } else if (!callDataObject.statusInfo.isApproved) {
                        console.log('updateCallButtons 5');
                        callDataObject.markApprovedButtonEl.innerHTML = 'Mark Approved';
                    }
                }

                function showButton(buttonEl) {
                    buttonEl.classList.remove('streams-callcenter-m-button-hidden')
                }

                function hideButton(buttonEl) {
                    if(!buttonEl.classList.contains('streams-callcenter-m-button-hidden')) {
                        buttonEl.classList.add('streams-callcenter-m-button-hidden')
                    }
                }
            },
            startOrJoinLiveShowTeleconference: function () {
                var tool = this;
                if(tool.currentActiveWebRTCRoom && tool.currentActiveWebRTCRoom.isActive()) {
                    tool.switchBackToLiveShowRoom();
                } else {
                    tool.currentActiveWebRTCRoom = Q.Streams.WebRTC({
                        roomId: tool.callCenterStream.fields.name.split('/').pop(),
                        roomPublisherId: tool.callCenterStream.fields.publisherId,
                        resumeClosed: true,
                        element: document.body,
                        startWith: { video: false, audio: true }
                    });

                    tool.currentActiveWebRTCRoom.start();
                }
                tool.iAmConnectedToCallCenterRoom = true
            },
            switchBackToLiveShowRoom: function () {
                var tool = this;
                tool.currentActiveWebRTCRoom.switchTo(tool.callCenterStream.fields.publisherId, tool.callCenterStream.fields.name.split('/').pop(), {resumeClosed: true}).then(function () {
                            
                });
            },
            joinUsersWaitingRooom: function (callDataObject, onDisconnect) {
                console.log('joinUsersWaitingRooom START');
                var tool = this;
                if(tool.currentActiveWebRTCRoom && tool.currentActiveWebRTCRoom.isActive()) {
                    console.log('joinUsersWaitingRooom switchTo');
                    tool.currentActiveWebRTCRoom.switchTo(callDataObject.webrtcStream.fields.publisherId, callDataObject.webrtcStream.fields.name.split('/').pop(), {}).then(function () {
                        let signalingLibInstance = tool.currentActiveWebRTCRoom.getWebrtcSignalingLib();
                        if(onDisconnect) {
                            signalingLibInstance.event.on('disconnected', function () {
                                onDisconnect(callDataObject);
                            });
                        }
                    });
                } else {
                    console.log('joinUsersWaitingRooom webrtc.start');
                    tool.currentActiveWebRTCRoom = Q.Streams.WebRTC({
                        roomId: callDataObject.webrtcStream.fields.name,
                        roomPublisherId: callDataObject.webrtcStream.fields.publisherId,
                        element: document.body,
                        startWith: { video: false, audio: true },
                        onWebRTCRoomCreated: function () {
                            let signalingLibInstance = tool.currentActiveWebRTCRoom.getWebrtcSignalingLib();
                            if(onDisconnect) {
                                signalingLibInstance.event.on('disconnected', function () {
                                    onDisconnect(callDataObject);
                                });
                            }
                        }
                    });

                    tool.currentActiveWebRTCRoom.start();
                }
            },
            onMarkApprovedHandler: function (callDataObject) {
                var tool = this;
                if(tool.callCenterMode != 'liveShow') return;
                console.log('onMarkApprovedHandler', callDataObject.statusInfo.isApproved)
                var approveStatusToSet = callDataObject.statusInfo.isApproved ? false : true;
                Q.req("Streams/callCenter", ["markApprovedHandler"], function (err, response) {
                    var msg = Q.firstErrorMessage(err, response && response.errors);

                    if (msg) {
                        return Q.alert(msg);
                    }

                    callDataObject.statusInfo.isApproved = approveStatusToSet;
                }, {
                    method: 'post',
                    fields: {
                        isApproved: approveStatusToSet,
                        waitingRoom: {publisherId: callDataObject.webrtcStream.fields.publisherId, streamName: callDataObject.webrtcStream.fields.name},
                        liveShowRoom: {publisherId: tool.state.publisherId, streamName: tool.state.streamName},
                    }
                });
            },
            onHoldHandler: function (callDataObject) {
                var tool = this;
                if(tool.callCenterMode == 'regular') {

                } else if(tool.callCenterMode == 'liveShow') {
                    Q.req("Streams/callCenter", ["holdHandler"], function (err, response) {
                        var msg = Q.firstErrorMessage(err, response && response.errors);
    
                        if (msg) {
                            return Q.alert(msg);
                        }
    
                        if(tool.iAmConnectedToCallCenterRoom && tool.currentActiveWebRTCRoom && tool.currentActiveWebRTCRoom.isActive()) {
                            callDataObject.statusInfo.status = 'created';
                            tool.switchBackToLiveShowRoom();
                        } else if(tool.currentActiveWebRTCRoom && tool.currentActiveWebRTCRoom.isActive()) {
                            callDataObject.statusInfo.status = 'created';
                            tool.currentActiveWebRTCRoom.stop();
                        }
                    }, {
                        method: 'post',
                        fields: {
                            onHold: true,
                            callStatus: callDataObject.statusInfo.status,
                            waitingRoom: {publisherId: callDataObject.webrtcStream.fields.publisherId, streamName: callDataObject.webrtcStream.fields.name},
                            liveShowRoom: {publisherId: tool.state.publisherId, streamName: tool.state.streamName},
                        }
                    });
                }
            },
            onInterviewHandler: function (callDataObject) {
                var tool = this;
                if(tool.callCenterMode == 'regular') {
                    Q.req("Streams/callCenter", ["interviewHandler"], function (err, response) {
                        var msg = Q.firstErrorMessage(err, response && response.errors);
    
                        if (msg) {
                            return Q.alert(msg);
                        }
    
                        callDataObject.statusInfo.status = 'interview';
                        tool.joinUsersWaitingRooom(callDataObject, function(callDataObject) {
                            tool.onDeclineHandler(callDataObject);
                        });
                    }, {
                        method: 'post',
                        fields: {
                            callStatus: callDataObject.statusInfo.status,
                            waitingRoom: {publisherId: callDataObject.webrtcStream.fields.publisherId, streamName: callDataObject.webrtcStream.fields.name},
                            liveShowRoom: {publisherId: tool.state.publisherId, streamName: tool.state.streamName},
                        }
                    });
                } else if(tool.callCenterMode == 'liveShow') {
                    Q.req("Streams/callCenter", ["interviewHandler"], function (err, response) {
                        var msg = Q.firstErrorMessage(err, response && response.errors);
    
                        if (msg) {
                            return Q.alert(msg);
                        }
    
                        callDataObject.statusInfo.status = 'interview';
                        tool.joinUsersWaitingRooom(callDataObject);
                    }, {
                        method: 'post',
                        fields: {
                            callStatus: callDataObject.statusInfo.status,
                            waitingRoom: {publisherId: callDataObject.webrtcStream.fields.publisherId, streamName: callDataObject.webrtcStream.fields.name},
                            liveShowRoom: {publisherId: tool.state.publisherId, streamName: tool.state.streamName},
                        }
                    });
                }
                
            },
            onAcceptHandler: function (callDataObject) {
                var tool = this;
                if(tool.callCenterMode != 'liveShow') return;
                console.log('onAcceptHandler', callDataObject.statusInfo.status)
                //onAcceptHandler can be fired only in "liveShow", this handler moves user from his waiting room to liveShow webrtc room
                //so firstly, we need to give him max readLevel access, secondly - post message to his waiting room allowing user to join
                let prevStatus = callDataObject.statusInfo.status;
                callDataObject.statusInfo.status = 'accepted';
                Q.req("Streams/callCenter", ["acceptHandler"], function (err, response) {
                    var msg = Q.firstErrorMessage(err, response && response.errors);

                    if (msg) {
                        return Q.alert(msg);
                    }

                    console.log('onAcceptHandler', response, prevStatus, tool.iAmConnectedToCallCenterRoom);
                    if (prevStatus == 'interview' && tool.iAmConnectedToCallCenterRoom) {
                        tool.switchBackToLiveShowRoom();
                    } else if (tool.currentActiveWebRTCRoom && !tool.iAmConnectedToCallCenterRoom) {
                        tool.currentActiveWebRTCRoom.stop();
                    }    
                }, {
                    method: 'post',
                    fields: {
                        callStatus: prevStatus,
                        waitingRoom: {publisherId: callDataObject.webrtcStream.fields.publisherId, streamName: callDataObject.webrtcStream.fields.name},
                        liveShowRoom: {publisherId: tool.state.publisherId, streamName: tool.state.streamName},
                    }
                });
            },
            onDeclineHandler: function (callDataObject) {
                var tool = this;
                console.log('onDeclineHandler', callDataObject.statusInfo.status);
                var content, action;
               
                if(callDataObject.statusInfo.status == 'interview' || callDataObject.statusInfo.status == 'accepted') {
                    console.log('onDeclineHandler 1');
                    action = 'endCall';
                    content = JSON.stringify({
                        immediate: true,
                        userId: callDataObject.webrtcStream.fields.publisherId,
                        msg: 'Call ended'
                    })
                } else {
                    console.log('onDeclineHandler 2');
                    action = 'declineCall';
                    content = JSON.stringify({
                        immediate: true,
                        userId: callDataObject.webrtcStream.fields.publisherId,
                        msg: 'Your call request was declined'
                    })
                }
                var prevStatus = callDataObject.statusInfo.status;
                callDataObject.statusInfo.status = 'ended';

                Q.req("Streams/callCenter", ["endOrDeclineCallHandler"], function (err, response) {
                    var msg = Q.firstErrorMessage(err, response && response.errors);

                    if (msg) {
                        return Q.alert(msg);
                    }

                    tool.reloadCallsList();   
                }, {
                    method: 'post',
                    fields: {
                        callStatus: prevStatus,
                        action: action,
                        waitingRoom: {publisherId: callDataObject.webrtcStream.fields.publisherId, streamName: callDataObject.webrtcStream.fields.name},
                        liveShowRoom: {publisherId: tool.state.publisherId, streamName: tool.state.streamName},
                    }
                });
            }            
        }

    );

})(window.jQuery, window);
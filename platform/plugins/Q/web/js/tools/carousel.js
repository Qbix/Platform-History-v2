(function ($, window, undefined) {

    var ua = navigator.userAgent;
    var _isiOS = false;
    var _isAndroid = false;
    var _isiOSCordova = false;
    var _isAndroidCordova = false;
    if(ua.indexOf('iPad')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1) _isiOS = true;
    if(ua.indexOf('Android')!=-1) _isAndroid = true;
    if(typeof cordova != 'undefined' && _isiOS) _isiOSCordova = true;
    if(typeof cordova != 'undefined' && _isAndroid) _isAndroidCordova = true;

    /**
     * Q/carousel tool
     * Displays an interactive carousel of images with titles
     * @module Q
     * @class Q carousel
     * @constructor
     * @param {Object} [options]
     *  @param {Element} [options.element] Container with images/videos
     *  @param {float} [options.radius]
     *  @param {integer} [options.imgWidth] 
     *  @param {integer} [options.imgHeight] 
     *  @param {boolean} [options.autoRotate] 
     *  @param {integer} [options.rotateSpeed]
     *  Hash of possible options
     */
    Q.Tool.define("Q/carousel", function(options) {
            var tool = this;
            tool.state = Q.extend({}, tool.state, options);

            tool.create();
        },

        {
            radius: 340,
            imgWidth: 170,
            imgHeight: 120,
            autoRotate: true,
            rotateSpeed: -60
        },

        {
            create: function() {
                var tool = this;

                var radius = tool.state.radius;
                var autoRotate = tool.state.autoRotate;
                var rotateSpeed = tool.state.rotateSpeed;
                var imgWidth = tool.state.imgWidth;
                var imgHeight = tool.state.imgHeight;

                Q.addStylesheet('{{Q}}/css/3dcarousel.css');

                setTimeout(init, 100);

                var mediaContainer = tool.element;
                if(!mediaContainer.classList.contains('carousel-wrap')) mediaContainer.classList.add('carousel-wrap');
                var obox = document.createElement('DIV');
                obox.className = 'drag-container';
                var ospin = document.createElement('DIV');
                ospin.className = 'spin-container';
                var aImg = mediaContainer.getElementsByTagName('img');
                var aVid = mediaContainer.getElementsByTagName('video');
                var aEle = [...aImg, ...aVid];

                var childNodes = mediaContainer.childNodes;
                if(mediaContainer && childNodes.length != 0) {
                    for (var i = 0; i < childNodes.length; i++) {
                        if (childNodes[i].nodeType !== 1) continue;
                        ospin.appendChild(childNodes[i]);
                    }
                }
                obox.appendChild(ospin);
                mediaContainer.appendChild(obox);
                
                ospin.style.width = imgWidth + "px";
                ospin.style.height = imgHeight + "px";


               /* var ground = document.getElementById('ground');
                ground.style.width = radius * 3 + "px";
                ground.style.height = radius * 3 + "px";*/

                function init(delayTime) {
                    for (var i = 0; i < aEle.length; i++) {
                        aEle[i].style.transform = "rotateY(" + (i * (360 / aEle.length)) + "deg) translateZ(" + radius + "px)";
                        aEle[i].style.transition = "transform 1s";
                        aEle[i].style.transitionDelay = delayTime || (aEle.length - i) / 4 + "s";
                    }
                }

                function applyTranform(obj) {

                    if(tY > 180) tY = 180;
                    if(tY < 0) tY = 0;

                    obj.style.transform = "rotateX(" + (-tY) + "deg) rotateY(" + (tX) + "deg)";
                }

                function playSpin(yes) {
                    ospin.style.animationPlayState = (yes?'running':'paused');
                }

                var sX, sY, nX, nY, desX = 0,
                    desY = 0,
                    tX = 0,
                    tY = 10;


                if (autoRotate) {
                    var animationName = (rotateSpeed > 0 ? 'spin' : 'spinRevert');
                    ospin.style.animation = `${animationName} ${Math.abs(rotateSpeed)}s infinite linear`;
                }

                obox.onpointerdown = function (e) {
                    clearInterval(obox.timer);
                    e = e || window.event;
                    var sX = e.clientX,
                        sY = e.clientY;

                    this.onpointermove  = function (e) {
                        e = e || window.event;
                        var nX = e.clientX,
                            nY = e.clientY;
                        desX = nX - sX;
                        desY = nY - sY;
                        tX += desX * 0.1;
                        tY += desY * 0.1;
                        applyTranform(obox);
                        sX = nX;
                        sY = nY;
                    };

                    this.onpointerup = function (e) {
                        obox.timer = setInterval(function () {
                            desX *= 0.95;
                            desY *= 0.95;
                            tX += desX * 0.1;
                            tY += desY * 0.1;
                            applyTranform(obox);
                            playSpin(false);
                            if (Math.abs(desX) < 0.5 && Math.abs(desY) < 0.5) {
                                clearInterval(obox.timer);
                                playSpin(true);
                            }
                        }, 17);
                        this.onpointermove = this.onpointerup = null;
                    };

                    return false;
                };

                obox.onmousewheel = function(e) {
                    e = e || window.event;
                    var d = e.wheelDelta / 20 || -e.detail;
                    radius += d;
                    init(1);
                };



            },
            refresh: function() {
                var tool = this;


            }


        }

    );

})(window.jQuery, window);

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
     *  @param {Q.Event} [options.onActivateItem] event occur when element start active
     */
    Q.Tool.define("Q/carousel", function(options) {
            var tool = this;
            tool.state = Q.extend({}, tool.state, options);

            Q.addStylesheet('{{Q}}/css/3dcarousel.css');
            tool.create();
        },

        {
            radius: 340,
            imgWidth: 170,
            imgHeight: 120,
            autoRotate: true,
            direction: 'left',
            rotateSpeed: 60000,
            debug: false,
            onActivateItem: new Q.Event()
        },

        {
            create: function() {
                var tool = this;
                var state = this.state;

                var pointerIsDragging = false;
                var rotatingIsPasused = null;
                var imgWidth = state.imgWidth;
                var imgHeight = state.imgHeight;
                var radius = state.radius;
                var autoRotate = state.autoRotate;
                var direction = state.direction;
                var rotateSpeed = state.rotateSpeed;
                var selectedIndex = 0;
                var currentOrderIndex = 0;
                var currentLapNum = 0;
                var theta;
                var negativeDeg = [];
                var positiveDeg = [];
                var roundTimer = {start:null, startIndex: null, pause:null, transitionTime:null};
                var rotateRoundTimer = null;
                var restartRotateRoundTimer = null;
                var isRotating = false;

                var autorotateStartsNum = 0;

                var sX, sY, nX, nY, desX = 0,
                    desY = 0,
                    tX = 0,
                    tY = 0;

                setTimeout(function () {
                    init(null, function () {
                        if (autoRotate) {
                            startAutoRotate();
                        }
                    });
                }, 100);


                var mediaContainer = tool.element;
                if(!mediaContainer.classList.contains('carousel-wrap')) mediaContainer.classList.add('carousel-wrap');
                var obox = document.createElement('DIV');
                obox.className = 'drag-container';
                var ospin = document.createElement('DIV');
                ospin.className = 'spin-container';
                var aImg = mediaContainer.getElementsByTagName('figure');
                var aVid = mediaContainer.getElementsByTagName('video');
                var aEle = [...aImg, ...aVid];
                theta = 360 / aEle.length;
                var childNodes = mediaContainer.childNodes;
                var prevTime = 0;

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

                function init(delayTime, callback) {
                    if(state.debug) console.log('init : radius', radius);
                    let l = aEle.length;
                    for (let i = 0; i < aEle.length; i++) {
                        if(i!==0) {
                            negativeDeg.push(i * (360 / aEle.length) * -1);

                        } else {
                            negativeDeg.push(0);

                        }
                        positiveDeg.push(360 - (i * (360 / aEle.length)));
                        aEle[i].dataset.rotateY = (360 - (i * (360 / aEle.length)));
                        aEle[i].style.transform = "rotateY(" + (i * (360 / aEle.length)) + "deg) translateZ(" + radius + "px)";
                        aEle[i].style.transition = "transform 1s";
                        aEle[i].style.transitionDelay = delayTime || (aEle.length - i) / 4 + "s";
                        l--;

                        if(i == (aEle.length - 1)) {
                            setTimeout(function (){
                                if(callback != null) callback();
                            }, 1000 + (aEle.length - i) / 4);
                        }

                    }

                    if(state.debug) console.log('init : theta', 360 / aEle.length);
                    if(state.debug) console.log('init : elements num', negativeDeg, positiveDeg, aEle.length);

                }



                function toggleActive(selectedIndex) {
                    if(aEle[selectedIndex] == null) return;
                    if(state.debug) console.log('toggleActive')


                    for (let i = 0; i < aEle.length; i++) {
                        if(i === selectedIndex) continue;
                        aEle[i].classList.remove('activeItem')
                    }

                    if(!aEle[selectedIndex].classList.contains('activeItem')) {
                        aEle[selectedIndex].classList.add('activeItem');
                        Q.handle(state.onActivateItem, tool, [selectedIndex, aEle[selectedIndex]]);
                    }
                }

                function togglePreActive(selectedIndex) {
                    if(state.debug) console.log('togglePreActive')
                    var toogleClass = function (prevIndex, nextIndex) {
                        for (let i = 0; i < aEle.length; i++) {

                            if(i === prevIndex || i === nextIndex) continue;
                            aEle[i].classList.remove('preActiveItem')
                        }

                        if(prevIndex != null && !aEle[prevIndex].classList.contains('preActiveItem')) {
                            aEle[prevIndex].classList.add('preActiveItem');
                        }
                        if(nextIndex != null && !aEle[nextIndex].classList.contains('preActiveItem')) {
                            aEle[nextIndex].classList.add('preActiveItem');
                        }
                    }

                    let nextIndex = null;

                    if(aEle[selectedIndex + 1] != null) {
                        nextIndex = selectedIndex + 1;
                    } else if(aEle[0] != null) {
                        nextIndex = 0;
                    }

                    let prevIndex = null;
                    if(aEle[selectedIndex-1] != null) {
                        prevIndex = selectedIndex - 1;
                    } else if(aEle[aEle.length - 1] != null) {
                        prevIndex = aEle.length - 1;
                    }

                    toogleClass(prevIndex, nextIndex);
                }

                function playSpin(yes) {
                    //ospin.style.animationPlayState = (yes?'running':'paused');
                    //pointerIsWithinContainer = false;
                }

                function draggingIsActive(yes) {
                    if(state.debug) console.log('draggingIsActive START', yes, rotatingIsPasused);
                    if(yes) {
                        if(rotateRoundTimer != null) {
                            clearTimeout(rotateRoundTimer);
                            rotateRoundTimer = null;
                        }

                        if(roundTimer.start != null && !rotatingIsPasused) {
                            if(state.debug) console.log('draggingIsActive YES');

                            roundTimer.pause = performance.now()
                            var timePassed = roundTimer.pause - roundTimer.start;
                            var percentTimePassed = timePassed * 100 / roundTimer.transitionTime
                            var thetaDegPassed = theta / 100 * percentTimePassed;
                            var degPassed = tX + (theta - thetaDegPassed);

                            if(state.debug) console.log('draggingIsActive : degPassed', degPassed);

                            tX = degPassed;
                            obox.style.transform = "rotateX(" + (-tY) + "deg) rotateY(" + (degPassed) + "deg)";

                        }
                        rotatingIsPasused = true;
                        if(!obox.classList.contains('draggingActive')) obox.classList.add('draggingActive');
                    } else {
                        if(state.debug) console.log('draggingIsActive : NO');

                        if(autoRotate) {
                            if(state.debug) console.log('draggingIsActive : stop : restart autorotate');

                            if(restartRotateRoundTimer != null){
                                clearTimeout(restartRotateRoundTimer);
                                restartRotateRoundTimer = null;
                            }

                            var circlesNum = Math.floor(Math.abs(tX)/360);
                            var degreeBelow360 =  Math.abs(tX) - 360 * circlesNum
                            if(state.debug) console.log('draggingIsActive : degreeBelow360', degreeBelow360);

                            let closestDegIndex;
                            let belowZero = Math.sign(tX) === -1 || Math.sign(tX) === 0;
                            if(belowZero && direction === 'left') {
                                if(state.debug) console.log('draggingIsActive : closest : cur deg is <0');
                                closestDegIndex = closest(negativeDeg, -degreeBelow360)
                                tX = -degreeBelow360;
                            } else if (!belowZero && direction === 'left') {
                                if(state.debug) console.log('draggingIsActive : closest : direction is left');
                                closestDegIndex = closest(negativeDeg, -degreeBelow360)
                                tX = degreeBelow360
                            } else {
                                if(state.debug) console.log('draggingIsActive : closest : cur deg is >0')
                                closestDegIndex = closest(positiveDeg, degreeBelow360)
                                tX = degreeBelow360;
                            }

                            currentOrderIndex = selectedIndex = closestDegIndex

                            if(state.debug) console.log('draggingIsActive : new tX', tX);

                            obox.style.transform = 'rotateX(' + (-tY) + 'deg) rotateY(' + tX + 'deg)';

                            if(state.debug) console.log('draggingIsActive : closestIndex, currentOrderIndex', closestDegIndex);
                            rotatingIsPasused = false;
                            restartRotateRoundTimer = setTimeout(function () {
                                if(rotatingIsPasused === true) return;
                                obox.classList.remove('draggingActive');
                                startAutoRotate(tX);
                            }, 500)
                        }
                    }

                }

                function stopRotating() {
                    rotatingIsPasused = true;

                    if(!obox.classList.contains('rotatingPaused')) obox.classList.add('rotatingPaused');
                }

                function applyTranform(obj) {
                    if(tY > 10) tY = 10;
                    if(tY < 0) tY = 0;

                    var circlesNum = Math.floor(Math.abs(tX)/360);
                    var degreeBelow360 =  Math.abs(tX) - 360 * circlesNum

                    let closestDegIndex;
                    if(Math.sign(tX) === -1 || Math.sign(tX) === 0) {
                        if(state.debug) console.log('applyTranform : negative tX')
                        closestDegIndex = closest(negativeDeg, -degreeBelow360)
                    } else {
                        if(state.debug) console.log('applyTranform : positive tX')
                        closestDegIndex = closest(positiveDeg, degreeBelow360)
                    }

                    currentOrderIndex = closestDegIndex

                    togglePreActive(closestDegIndex);
                    toggleActive(closestDegIndex);
                    if(state.debug) console.log('applyTranform: tX, closestDegIndex', tX, closestDegIndex);
                    obj.style.transform = "rotateX(" + (-tY) + "deg) rotateY(" + (tX) + "deg)";
                }

                function rotateCarousel(transitionTime, endCallback, manualTx, toZeroFix, startNum) {
                    if(state.debug) {
                        console.log('rotateCarousel START: starts num', startNum)
                        console.log('rotateCarousel START: tX', manualTx, tX)
                        console.log('rotateCarousel : index : next, current', selectedIndex, currentOrderIndex)
                        console.log('rotateCarousel : theta, transitionTime', theta, transitionTime)
                        console.log('rotateCarousel : rotatingIsPasused', rotatingIsPasused)
                    }
                    if(rotatingIsPasused === true) return;
                    if(manualTx != null) tX = manualTx;
                    isRotating = true;

                    let belowZero = (Math.sign(manualTx) === -1);

                    if (direction === 'left' && (manualTx === 0 || manualTx < theta) && toZeroFix) {
                        if(state.debug) console.log('rotateCarousel : toZeroFix');
                        tX = 0;
                    } else if (direction === 'left' && toZeroFix == null) {
                        if(state.debug) console.log('rotateCarousel : regular left direction');
                        tX = theta * selectedIndex * -1;
                    }  else if (direction === 'left' && !belowZero) {
                        if(state.debug) console.log('rotateCarousel : toZeroFix 2')
                        tX = tX - theta;
                    } else {
                        if(state.debug) console.log('rotateCarousel : right');
                        tX = theta * selectedIndex;
                    }

                    var circlesNum = Math.floor(tX/360);
                    if(state.debug) console.log('rotateCarousel : circlesNum', circlesNum)

                    var itemsNum = selectedIndex;
                    var itemsCounted = Math.floor(itemsNum/aEle.length);
                    currentOrderIndex = itemsNum - aEle.length*itemsCounted
                    if(state.debug) console.log('rotateCarousel : currentOrderIndex', currentOrderIndex)

                    let closestDegIndex = getCurrentActiveItem()
                    togglePreActive(closestDegIndex);
                    toggleActive(closestDegIndex);

                    if(state.debug) console.log('rotateCarousel : rotate', tX, transitionTime)
                    roundTimer.start = performance.now();
                    roundTimer.startIndex = selectedIndex;
                    roundTimer.transitionTime = transitionTime;
                    obox.style.transition = 'transform '+transitionTime+'ms linear';
                    obox.style.transform = 'rotateX(' + (-tY) + 'deg) rotateY(' + tX + 'deg)';

                    if(endCallback != null) {
                        if(state.debug) console.log('rotateCarousel : rotateRoundTimer : endCallback well run in', transitionTime);
                        if(rotateRoundTimer != null) {
                            clearTimeout(rotateRoundTimer);
                            rotateRoundTimer = null;
                        }
                        rotateRoundTimer = setTimeout(function () {
                            if(state.debug) console.log('rotateCarousel : rotateRoundTimer : run endCallback');
                            endCallback()
                        }, transitionTime);
                    }
                }

                function getCurrentActiveItem() {
                    if(state.debug) console.log('getCurrentActiveItem : tX', tX);

                    var circlesNum = Math.floor(tX/360);
                    if(state.debug) console.log('getCurrentActiveItem : circlesNum', circlesNum);

                    var degreeBelow360 =  (tX <= 360 && tX >= 0) || (tX >= -360 && tX < 0) ? tX : tX - 360*circlesNum;
                    if(state.debug) console.log('getCurrentActiveItem : degreeBelow360', degreeBelow360);

                    let closestDegIndex;
                    if((Math.sign(degreeBelow360) === -1 || Math.sign(degreeBelow360) === 0)) {
                        if(state.debug) console.log('getCurrentActiveItem : if1 (sign is -)');

                        closestDegIndex = closest(negativeDeg, degreeBelow360);
                    } else {
                        if(state.debug) console.log('getCurrentActiveItem : if2 (sign is +)')

                        closestDegIndex = closest(positiveDeg, degreeBelow360);
                    }
                    if(state.debug) console.log('getCurrentActiveItem : closestDegIndex', closestDegIndex);

                    return closestDegIndex;
                }

                function closest(array,num){
                    let i=0;
                    let minDiff=1000;
                    var ans;
                    for(i in array){
                        let m = Math.abs(num-array[i]);
                        let sign = Math.sign(num);

                        if((sign === 1 && m<minDiff) ){
                            minDiff=m;
                            ans=i;
                        } else if(((sign === -1 || sign === 0) && m<minDiff)) {
                            minDiff=m;
                            ans=i;
                        }
                    }

                    return parseInt(ans);
                }

                //var autorotateNum = 0;
                function startAutoRotate(manualTx) {
                    if(state.debug) console.log('startAutoRotate', manualTx);
                    var circleTime = rotateSpeed/aEle.length;
                    obox.classList.remove('rotatingPaused');
                    rotatingIsPasused = false;

                    function startNormally() {
                        if(state.debug) console.log('startAutoRotate : startNormally')
                        autorotateStartsNum++
                        selectedIndex++;
                        function rotateLoop() {
                            selectedIndex++;
                            rotateCarousel(circleTime, rotateLoop, null, null, autorotateStartsNum)
                        }

                        rotateCarousel(circleTime, rotateLoop, manualTx, null, autorotateStartsNum)
                    }

                    let belowZero = (Math.sign(manualTx) === -1 || Math.sign(manualTx) === 0);
                    if (manualTx != null && !belowZero) {
                        if(state.debug) console.log('startAutoRotate : tX is !belowZero')

                        let transitionTime = circleTime;
                        selectedIndex = Math.floor(manualTx/theta);
                        if(state.debug) console.log('startAutoRotate : selectedIndex', selectedIndex)

                        if(manualTx < theta) {
                            transitionTime = transitionTime * (manualTx/theta);
                        }

                        function rotateLoop(manualTx) {

                            if(selectedIndex !== 0) selectedIndex--;
                            if(state.debug) console.log('startAutoRotate: rotateLoop : (tX is !belowZero) : selectedIndex', selectedIndex)

                            if(selectedIndex == 0 || manualTx == 0) {
                                startNormally();
                                return;
                            }

                            transitionTime = (tX >= theta) ? circleTime : transitionTime * (tX/theta)

                            rotateCarousel(transitionTime, rotateLoop, tX, true)
                        }

                        rotateCarousel(transitionTime, rotateLoop, manualTx, true);
                    } else {
                        startNormally();
                    }
                }

                function onpointermove(e) {
                    e = e || window.event;
                    var nX, nY
                    if(!Q.info.isTouchscreen) {
                        nX = e.clientX;
                        nY = e.clientY;
                    } else {
                        var touch = e.touches[0];
                        if(!touch) return;
                        nX = touch.clientX;
                        nY = touch.clientY;
                    }

                    desX = nX - sX;
                    desY = nY - sY;

                    theta = 360 / aEle.length;

                    tX += desX * 0.1;
                    tY += desY * 0.1;
                    applyTranform(obox, e.target);
                    sX = nX;
                    sY = nY;
                }

                function removeEventListeners() {
                    if(!Q.info.isTouchscreen) {
                        window.removeEventListener('mousemove', onpointermove)
                        window.removeEventListener('mouseup', onpointerup)
                    } else {
                        window.removeEventListener('touchmove', onpointermove)
                        window.removeEventListener('touchend', onpointerup)
                    }
                }

                function onpointerup(e) {
                    obox.timer = setInterval(function () {
                        desX *= 0.95;
                        desY *= 0.95;

                        tX += desX * 0.1;
                        tY += desY * 0.1;
                        applyTranform(obox);
                        playSpin(false);
                        if (Math.abs(desX) < 0.5 && Math.abs(desY) < 0.5) {
                            draggingIsActive(false);
                            clearInterval(obox.timer);
                            playSpin(true);
                        }
                    }, 17);

                    removeEventListeners();
                }

                function onDocumentLeave() {
                    removeEventListeners()
                    document.removeEventListener('mouseleave', onDocumentLeave)
                }

                function onpointerdown(e) {
                    draggingIsActive(true);
                    clearInterval(obox.timer);

                    e = e || window.event;
                    if(!Q.info.isTouchscreen) {
                        sX = e.clientX;
                        sY = e.clientY;
                    } else {
                        var touch = e.touches[0];
                        if(!touch) return;
                        sX = touch.clientX;
                        sY = touch.clientY;
                    }

                    if(!Q.info.isTouchscreen) {
                        window.addEventListener('mousemove', onpointermove, {passive: true})
                        window.addEventListener('mouseup', onpointerup)

                        document.addEventListener('mouseleave', onDocumentLeave)
                    } else {
                        window.addEventListener('touchmove', onpointermove, {passive: true})
                        window.addEventListener('touchend', onpointerup)
                        window.addEventListener('mouseleave', removeEventListeners)
                    }

                    return false;
                }

                if(!Q.info.isTouchscreen) {
                    obox.addEventListener('mousedown', onpointerdown)
                } else {
                    obox.addEventListener('touchstart', onpointerdown)
                }

                function onTabSwitch() {
                    if(state.debug) console.log('visibilitychange', tX, obox.style.transform)
                }

                document.addEventListener("visibilitychange", onTabSwitch);
                //document.addEventListener("pagehide", onTabSwitch);


                /*obox.onmousewheel = function(e) {
                    e = e || window.event;
                    var d = e.wheelDelta / 20 || -e.detail;
                    radius += d;
                    init(1);
                };*/

            },
            refresh: function() {
                var tool = this;


            }


        }

    );

})(window.jQuery, window);

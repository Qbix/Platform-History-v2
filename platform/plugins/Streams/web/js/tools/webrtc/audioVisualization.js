(function ($, window, undefined) {

	var ua=navigator.userAgent;
	var _isiOS = false;
	var _isAndroid = false;
	var _isiOSCordova = false;
	var _isAndroidCordova = false;
	if(ua.indexOf('iPad')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1) _isiOS = true;
	if(ua.indexOf('Android')!=-1) _isAndroid = true;
	if(typeof cordova != 'undefined' && _isiOS) _isiOSCordova = true;
	if(typeof cordova != 'undefined' && _isAndroid) _isAndroidCordova = true;


	Q.Tool.define("Streams/audioVisualization", function(options) {

            this.state = Q.extend({}, this.state, options);
			this.create();

			},

		{
			editable: false,
			active: true,
			onCreate: new Q.Event(),
			onUpdate: new Q.Event(),
			onRefresh: new Q.Event(),
			SVGVisualization: null,
		},

        {
            create: function () {
            	var tool = this;
				var state = tool.state;
				var source = state.source;
				var constructorName = source.constructor.name;
                var context = tool.context = new AudioContext();
				if(constructorName == 'MediaStream') {
                    var src = context.createMediaStreamSource(source);
                    var analyser = context.createAnalyser();
                    tool.analyser = analyser;
                    tool.currentSource = src;

                    src.connect(analyser);
                    //analyser.connect(context.destination);
                } else if(constructorName == 'HTMLAudioElement' || constructorName == 'HTMLVideoElement' || constructorName == 'HTMLMediaElement') {

                    var src = context.createMediaElementSource(source);
                    var analyser = context.createAnalyser();
                    tool.analyser = analyser;
                    tool.currentSource = src;

                    src.connect(analyser);
                    analyser.connect(context.destination);
                } else {
				    throw 'Source should be type of MediaStream or HTMLMediaElement'
                }

                analyser.fftSize = 256;

                if(state.format == 'svg'){
                    if(state.shape == 'historyBars') {
                        tool.SVGVisualizationBuilder().historyBars();
                    } else if(state.shape == 'circular') {
                        tool.SVGVisualizationBuilder().circular();
                    }
                } else if(state.format == 'canvas'){
                    if(state.shape == 'historyBars') {
                        tool.CanvasVisualizationBuilder().historyBars();
                    } else if(state.shape == 'bars') {
                        tool.CanvasVisualizationBuilder().bars();
                    } else if(state.shape == 'circular') {
                        tool.CanvasVisualizationBuilder().circular();
                    }
                }

            },
            replaceSource: function (newSource) {
                if(!newSource) return false;
                var tool = this;
                var state = tool.state;
                var constructorName = newSource.constructor.name;
                var context = tool.context;
                tool.currentSource.disconnect(tool.analyser);

                if(constructorName == 'MediaStream') {
                    var src = context.createMediaStreamSource(newSource);
                    tool.currentSource = src;
                    src.connect(tool.analyser );
                } else if(constructorName == 'HTMLAudioElement' || constructorName == 'HTMLVideoElement' || constructorName == 'HTMLMediaElement') {
                    var src = tool.context.createMediaElementSource(newSource);
                    tool.currentSource = src;
                    src.connect(tool.analyser);
                    tool.analyser.connect(context.destination);
                } else {
                    throw 'Source should be type of MediaStream or HTMLMediaElement'
                }

                state.source = newSource;

            },
            refresh: function () {
                var tool = this;
            },
            SVGVisualizationBuilder: function () {
                var tool = this;
                var state = tool.state;

                function buildHistoryBarsVisualization() {
                    if(state.SVGVisualization != null) return;

                    state.SVGVisualization = {}
                    var visualisation = state.SVGVisualization;
                    state.SVGVisualization.soundBars = [];

                    var xmlns = 'http://www.w3.org/2000/svg';
                    var svg = document.createElementNS(xmlns, 'svg');
                    svg.setAttribute('width', state.size.width);
                    svg.setAttribute('height', state.size.height);
                    visualisation.svg = svg;

                    var clippath = document.createElementNS(xmlns, 'clipPath');
                    clippath.setAttributeNS(null, 'id', 'waveform-mask');

                    tool.element.appendChild(visualisation.svg);

                    var bucketSVGWidth = 4;
                    var bucketSVGHeight = 0;
                    var spaceBetweenRects = 1;
                    var totalBarsNum =  Math.floor(state.size.width / (bucketSVGWidth + spaceBetweenRects));
                    var i;
                    for(i = 0; i < totalBarsNum; i++) {
                        var rect = document.createElementNS(xmlns, 'rect');
                        var x = (bucketSVGWidth * i + (spaceBetweenRects * (i + 1)))
                        var y = 0;
                        var fillColor = '#95ffff';
                        rect.setAttributeNS(null, 'x', x);
                        rect.setAttributeNS(null, 'y', 0);
                        rect.setAttributeNS(null, 'width', bucketSVGWidth + 'px');
                        rect.setAttributeNS(null, 'height', bucketSVGHeight + 'px');
                        rect.setAttributeNS(null, 'fill', fillColor);
                        rect.style.strokeWidth = '1';
                        rect.style.stroke = '#1479b5';

                        var barObject = {
                            volume: 0,
                            rect: rect,
                            x: x,
                            y: y,
                            width: bucketSVGWidth,
                            height: bucketSVGHeight,
                            fill: fillColor
                        }

                        visualisation.soundBars.push(barObject);
                        svg.appendChild(rect);
                    }
                    visualisation.barsLength = visualisation.soundBars.length;


                    function getAverage(freqData) {
                        var average = 0;
                        for(let i = 0; i < freqData.length; i++) {
                            average += freqData[i]
                        }
                        average = average / freqData.length;
                        return average;
                    }
                    function renderBars(visualization) {
                        requestAnimationFrame(function () {
                            renderBars(visualisation)
                        });
                        var freqData = new Uint8Array(tool.analyser.frequencyBinCount);
                        tool.analyser.getByteFrequencyData(freqData);
                        let average = getAverage(freqData);

                        var barsLength = visualization.barsLength;
                        var i;
                        for(i = 0; i < barsLength; i++){
                            var bar = visualization.soundBars[i];
                            if(i == barsLength - 1) {
                                bar.volume = average;
                                var height = (average / 255) * 100;
                                //if(bar.volume < 0.005) height = 0.1;
                                bar.y = state.size.height - (state.size.height / 100 * height);
                                bar.height = height;
                                bar.rect.setAttributeNS(null, 'height', bar.height + '%');
                                bar.rect.setAttributeNS(null, 'y', bar.y);

                            } else {
                                var nextBar = visualization.soundBars[i + 1];
                                bar.volume = nextBar.volume;
                                bar.height = nextBar.height;
                                bar.y = nextBar.y;
                                bar.rect.setAttributeNS(null, 'height', bar.height + '%');
                                bar.rect.setAttributeNS(null, 'y', bar.y);
                            }
                        }
                    }

                    renderBars(visualisation);
                }

                function buildCircularVisualization() {
                    if(state.SVGVisualization != null) return;

                    state.SVGVisualization = {}
                    var visualisation = state.SVGVisualization;

                    visualisation.soundCircles = [];

                    var xmlns = 'http://www.w3.org/2000/svg';
                    var svg = document.createElementNS(xmlns, 'svg');
                    svg.setAttribute('width', state.size.width);
                    svg.setAttribute('height', state.size.height);
                    svg.style.overflow = 'visible'
                    visualisation.svg = svg;
                    var clippath = document.createElementNS(xmlns, 'clipPath');
                    clippath.setAttributeNS(null, 'id', 'waveform-mask');

                    tool.element.appendChild(visualisation.svg);

                    var totalCirclesNum =  10;
                    var i;
                    for(i = 0; i < totalCirclesNum; i++) {
                        var circle = document.createElementNS(xmlns, 'circle');

                        var cx = '50%'
                        var cy = '50%';
                        var fillColor = '#40fe00';
                        circle.setAttributeNS(null, 'fill', 'none');
                        circle.setAttributeNS(null, 'stroke', '#2bb7ca');
                        circle.setAttributeNS(null, 'stroke-width', '1');
                        //circle.setAttributeNS(null, 'stroke-miterlimit', '10');
                        circle.setAttributeNS(null, 'cx', cx);
                        circle.setAttributeNS(null, 'cy', cy);
                        circle.setAttributeNS(null, 'r', '0%');

                        var circleObject = {
                            volume: 0,
                            circle: circle,
                            cx: cx,
                            cy: cy,
                            radius: 0,
                            fill: fillColor
                        }

                        visualisation.soundCircles.push(circleObject);
                        svg.appendChild(circle);
                    }
                    visualisation.circlesLength = visualisation.soundCircles.length;

                    function getAverage(freqData) {
                        var average = 0;
                        for(let i = 0; i < freqData.length; i++) {
                            average += freqData[i]
                        }
                        average = average / freqData.length;
                        return average;
                    }
                    function renderCircles(visualization) {
                        requestAnimationFrame(function () {
                            renderCircles(visualisation)
                        });
                        var freqData = new Uint8Array(tool.analyser.frequencyBinCount);
                        tool.analyser.getByteFrequencyData(freqData);
                        let average = getAverage(freqData);

                        var circlesLength = visualization.circlesLength;
                        var i;
                        for(i = 0; i < circlesLength; i++){
                            var circle = visualization.soundCircles[i];
                            if(i == circlesLength - 1) {
                                circle.volume = average;
                                var radius = (average / 255) * 100;
                               // console.log('radius', radius);
                                /*if(radius > 100)
                                    radius = 100;
                                else if(circle.volume < 0.005) radius = 0.1;*/
                                //var radius = (40 * circle.volume);
                                circle.radius = 0 + radius;
                                circle.opacity = 1 -  (0.025 * radius);

                                circle.circle.setAttributeNS(null, 'r', circle.radius + '%');
                                circle.circle.setAttributeNS(null, 'opacity', circle.opacity);

                            } else {
                                var nextCircle = visualization.soundCircles[i + 1];
                                circle.volume = nextCircle.volume;
                                circle.radius = nextCircle.radius;
                                circle.cx = nextCircle.cx;
                                circle.cy = nextCircle.cy;
                                circle.circle.setAttributeNS(null, 'r', circle.radius + '%');
                                circle.circle.setAttributeNS(null, 'opacity', 1 - (0.025 * (circle.radius - 50)));
                            }
                        }
                    }

                    renderCircles(visualisation);
                }


                return {
                    historyBars: buildHistoryBarsVisualization,
                    circular: buildCircularVisualization
                }
			},
			CanvasVisualizationBuilder: function () {
                var tool = this;
                var state = tool.state;
                function buildBarsVisualization() {
                    var canvas = document.createElement("canvas");
                    canvas.width = state.size.width;
                    canvas.height = state.size.height;
                    console.log('tool.element', tool.element.offsetWidth, tool.element.offsetHeight)
                    tool.element.appendChild(canvas);
                    var ctx = canvas.getContext("2d");



                    var bufferLength = tool.analyser.frequencyBinCount;
                    console.log(bufferLength);

                    var dataArray = new Uint8Array(bufferLength);

                    var WIDTH = canvas.width;
                    var HEIGHT = canvas.height;

                    var barWidth = (WIDTH / bufferLength) * 2.5;
                    var barHeight;
                    var x = 0;

                    function renderFrame() {
                        requestAnimationFrame(renderFrame);

                        x = 0;

                        tool.analyser.getByteFrequencyData(dataArray);

                        //ctx.fillStyle = "#000";
                        ctx.clearRect(0, 0, WIDTH, HEIGHT);

                        for (var i = 0; i < bufferLength; i++) {
                            barHeight = dataArray[i];

                            var r = barHeight + (25 * (i/bufferLength));
                            var g = 250 * (i/bufferLength);
                            var b = 50;

                            ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
                            ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

                            x += barWidth + 1;
                        }
                    }

                    //audio.play();
                    renderFrame();
                }

                function buildHistoryBarsVisualization() {
                    if(state.CanvasVisualization != null) return;

                    state.CanvasVisualization = {}
                    var visualization = state.CanvasVisualization;
                    visualization.soundBars = [];

                    var bucketWidth = 4;
                    var bucketHeight = 0;
                    var spaceBetweenRects = 1;
                    var totalBarsNum =  Math.floor(state.size.width / (bucketWidth + spaceBetweenRects));
                    var i;
                    for(i = 0; i < totalBarsNum; i++) {
                        var x = (bucketWidth * i + (spaceBetweenRects * (i + 1)))
                        var y = state.size.height;
                        var fillColor = '#95ffff';

                        var barObject = {
                            volume: 0,
                            x: x,
                            y: y,
                            width: bucketWidth,
                            height: bucketHeight,
                            fill: fillColor
                        }

                        visualization.soundBars.push(barObject);
                    }
                    visualization.barsLength = visualization.soundBars.length;

                    var canvas = document.createElement("canvas");
                    canvas.width = state.size.width;
                    canvas.height = state.size.height;
                    console.log('tool.element', tool.element.offsetWidth, tool.element.offsetHeight)
                    tool.element.appendChild(canvas);
                    var ctx = canvas.getContext("2d");

                    var WIDTH = canvas.width;
                    var HEIGHT = canvas.height;

                    var barHeight;
                    var x = 0;


                    function getAverage(freqData) {
                        var average = 0;
                        for(let i = 0; i < freqData.length; i++) {
                            average += freqData[i]
                        }
                        average = average / freqData.length;
                        return average;
                    }


                    function renderFrame(visualization) {
                        requestAnimationFrame(function () {
                            renderFrame(visualization);
                        });

                        var freqData = new Uint8Array(tool.analyser.frequencyBinCount);
                        tool.analyser.getByteFrequencyData(freqData);
                        let average = getAverage(freqData);

                        var barsLength = visualization.barsLength;
                        var i;
                        for(i = 0; i < barsLength; i++){
                            var bar = visualization.soundBars[i];
                            if(i == barsLength - 1) {
                                bar.volume = average;
                                var height = HEIGHT / 100 * ((average / 255) * 100);
                                //if(bar.volume < 5) height = 1;

                                bar.y = state.size.height - height;
                                //bar.y = state.size.height / 2 - height / 2;
                                bar.height = height;
                            } else {
                                var nextBar = visualization.soundBars[i + 1];
                                bar.volume = nextBar.volume;
                                bar.height = nextBar.height;
                                bar.y = nextBar.y;
                            }
                        }


                        x = 0;


                        ctx.clearRect(0, 0, WIDTH, HEIGHT);


                        for (let b in visualization.soundBars) {
                            barHeight = visualization.soundBars[b].height;
                            x = visualization.soundBars[b].x;
                            y = visualization.soundBars[b].y;

                            //var r = barHeight + (25 * (i/bufferLength));
                            //var g = 250 * (i/bufferLength);
                            //var b = 50;

                            //ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
                            ctx.fillStyle = "#95ffff";
                            ctx.fillRect(x, y, bucketWidth, barHeight);
                            ctx.strokeStyle = "rgb(20, 121, 181)";
                            ctx.strokeRect(x, y, bucketWidth, barHeight);

                        }
                    }

                    renderFrame(visualization);
                }

                function buildCircularVisualization() {

                }
                
                return {
                    historyBars: buildHistoryBarsVisualization,
                    bars: buildBarsVisualization,
                    circular: buildCircularVisualization
                }
			},
            show: function () {
                if (this.element != null) {
                    this.element.style.display = '';
                }
            },
            hide: function () {
                if (this.element != null) {
                    this.element.style.display = 'none';
                }
            }
        }
	);

})(window.jQuery, window);
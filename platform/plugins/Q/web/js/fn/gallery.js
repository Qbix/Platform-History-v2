(function (Q, $, window, document, undefined) {

/**
 * Q Tools
 * @module Q-tools
 */

/**
 * Plugin Creates gallery of of images
 * @class Q gallery
 * @constructor
 * @param {Object} [options] options is an Object with function parameters
 * @param {Array} [options.images] images an array of objects containing object <code> { src: String , caption: String , interval: Number, transition: Object} </code>
 *   @param {String} [options.images.src] src url of the image, will be fed through Q.url(). Required.
 *   @param {String} [options.images.caption] caption for the image. Optional
 *   @param {Number} [options.images.interval] interval number overriding default interval. Optional.
 *   @param {Object} [options.images.transition] transition object overriding default transition. Optional.
 * @param {Object} [options.transition] transition object that contains properties for making transitions
 *   @param {Number} [options.transition.duration] duration the number of milliseconds the transition should take (where the intervals overlap)
 *   @param {String} [options.transition.ease] ease the type of easing function to apply from Q.Animation.ease object
 *   @default 'smooth'
 *   @param {String} [options.transition.type] type the type of transition. Can only be 'crossfade'
 *   @default 'crossfade'
 * @param {Object} [options.interval] interval object that contains properties for intervals
 *   @param {Number} [options.interval.duration] duration number of milliseconds between beginning times of consecutive transitions.
 *      It's recommended to make this at least 2x the duration of the transitions!
 *   @param {String} [options.interval.ease] ease the type of easing function to apply from Q.Animation.ease object.
 *   @default 'smooth'
 *   @param {String} [options.interval.type] type is a what to do during this interval. Can be empty or 'kenburns'.
 *   @default ''
 *   @param {Object} [options.interval.from] from is for "kenburns", an object containing "left", "top", "width" and "height"
 *     @param {Number} [options.interval.from.left] left number for "from" object
 *     @param {Number} [options.interval.from.top] top number for "from" object
 *     @param {Number} [options.interval.from.width] width number for "from" object
 *     @param {Number} [options.interval.from.height] height number for "from" object
 *   @param {Object} [options.interval.to] to is for "kenburns", an object containing "left", "top", "width" and "height"
 *     @param {Number} [options.interval.to.left] left number for "to" object
 *     @param {Number} [options.interval.to.top] top number for "to" object
 *     @param {Number} [options.interval.to.width] width number for "to" object
 *     @param {Number} [options.interval.to.height] height number for "to" object
 * @param {Boolean} [options.autoplay] autoplay for  whether to start playing the gallery when it loads.
 * @default true
 * @param {Boolean} [options.transitionToFirst] transitionToFirst for whether to use a transition to show the first image.
 * @default false
 * @param {Boolean} [options.loop] loop for whether to show first image after last image is done.
 * @default true
 * @param {Q.Event} [options.onLoad] onLoad event fires when an image loads, also passes all loaded images
 * @param {Q.Event} [options.onTransition] onTransition event fires when an image loads, also passes all loaded images
 */
Q.Tool.jQuery('Q/gallery', function _Q_gallery(o) {
	
	o = o || {};
	var $this = this, i, image, imgs=[], caps=[], current, tm, gallery;
	var animTransition, animInterval, animPreviousInterval;
	var intervals = {
		"": function (x, y, params) {

		},
		kenburns: function (x, y, params) {
			var image = o.images[params.current];
			var img = imgs[params.current];
			var interval = image.interval || {};
			var from = Q.extend({}, 2, o.interval.from, 2, interval.from);
			var to = Q.extend({}, 2, o.interval.to, 2, interval.to);
			var z = y;
			var widthFactor = from.width + z*(to.width - from.width);
			var heightFactor = from.height + z*(to.height - from.height);
			var leftFactor = (from.left + z*(to.left - from.left));
			var topFactor = (from.top + z*(to.top - from.top));
			
			// crop to fit aspect ratio of the gallery
			var iw = img[0].naturalWidth;
			var ih = img[0].naturalHeight;
			var w = iw * widthFactor;
			var h = ih * heightFactor;
			var l = iw * leftFactor;
			var t = ih * topFactor;
			var r = w/h;
			var $w = $this.width();
			var $h = $this.height();
			var $r = $w/$h;
			if ($r < r) {
				var smallerW = h * $r;
				l += (w - smallerW) / 2;
				widthFactor = smallerW / iw;
				leftFactor = l / iw;
			} else {
				var smallerH = w / $r;
				t += (h - smallerH) / 2;
				heightFactor = smallerH / ih;
				topFactor = t / ih;
			}
			
			// scale and place the image to expose the clipped area
			var width = $w / widthFactor;
			var height = $h / heightFactor;
			var left = -leftFactor * width;
			var top = -topFactor * height; 
			img.css({
				left: left+'px',
				top: top+'px',
				width: width+'px',
				height: height+'px',
				visibility: 'visible'
			});
			caps[params.current].css('visibility', 'visible');
		}
	};
	var transitions = {
		crossfade: function (x, y, params) {
			imgs[params.current]
			.add(caps[params.current])
			.css({
				display: 'block',
				visibility: 'visible',
				opacity: y
			});
			if (params.previous < 0) return;				
			if (y !== 1) {
				imgs[params.previous]
				.add(caps[params.previous])
				.css({
					opacity: 1-y
				});
			} else {
				for (var i=0; i<imgs.length; ++i) {
					if (i === params.current) continue;
					imgs[i].add(caps[i]).css({
						display: 'none'
					});
				}
			}
			if (y === 1) {
				animPreviousInterval && animPreviousInterval.pause();
			}
		}
	};
	
	if (gallery = $this.data('gallery')) {
		gallery.pause();
		$this.empty();
		if (o === null) {
			return false;
		}
	}
	
	current = -1;
	var css = {
		overflow: 'hidden'
	};
	if ($this.css('position') === 'static') {
		css.position = 'relative';
	}
	if (!parseInt($this.css('height'))) {
		$this.css('height', $this.parent().innerHeight());
	}
	$this.css(css);
	
	function loadImage(index, callback) {
		if (imgs[index]) {
			if (callback) callback(index, imgs);
			return;
		}
		var image = o.images[index];
		if (!image) {
			image = {};
		}
		if (!image.src) {
			image.src = Q.url('{{Q}}/img/throbbers/transparent.gif');
		}
		var img = $('<img />').attr({
			alt: image.caption ? image.caption : 'image ' + index,
			src: Q.url(image.src)
		}).css({
			visibility: 'hidden',
			position: 'absolute',
			top: '0px', 
			left: '0px'
		}).appendTo($this)
		.load(onLoad);
		imgs[index] = img;
		img.each(function () {
			if (this.complete) {
				$(this).unbind('load');
				onLoad();
			}
		});
		if (image.caption) {
			var css = image.style ? image.style : {};
			css['visibility'] = 'hidden';
			var cap = $('<div class="Q_gallery_caption" />')
				.css(css)
				.html(image.caption)
				.appendTo($this);
			caps[index] = cap;
		} else {
			caps[index] = $([]);
		}
		function onLoad() {
			imgs[index] = img;
			Q.handle(o.onLoad, $this, [$(this), imgs, o]);
			if (callback) callback(index, imgs);
		}
	}
	
	var gallery = {
		options: o,
		onLoad: o.onLoad,
		play: function () {
			this.next(true);
		},
		next: function (keepGoing) {
			var previous = current;
			++current;
			if (current >= o.images.length) {
				if (!o.loop) return;
				current = 0;
			}
			loadImage(current, function () {
				beginTransition();
			});
			function beginTransition() {
				var t = Q.extend({}, 2, o.transition, 2, o.images[current].transition);
				var transition = transitions[o.transition.type || ""];
				Q.handle(o.onTransition, $this, [current, imgs, o]);
				if (!o.transitionToFirst && previous === -1) {
					transition(1, 1, { current: current, previous: previous });
					beginInterval();
					return;
				}
				// animTransition && animTransition.pause();
				animTransition = Q.Animation.play(
					transition,
					t.duration,
					t.ease,
					{ current: current, previous: previous }
				);
				beginInterval();
			}
			function beginInterval() {
				var transition = Q.extend({}, 2, o.transition, 2, o.images[current].transition);
				var interval = Q.extend({}, 2, o.interval, 2, o.images[current].interval);
				animPreviousInterval = animInterval;
				animInterval = Q.Animation.play(
					intervals[interval.type || ""],
					interval.duration,
					interval.ease,
					{ current: current, previous: previous }
				);
				loadImage((current+1) % o.images.length, null); // preload next image
				if (keepGoing) {
					tm = setTimeout(function () {
						gallery.next(keepGoing);
					}, interval.duration - transition.duration);
				}
			}
		},
		pause: function () {
			animTransition && animTransition.pause();
			animInterval && animInterval.pause();
			clearTimeout(tm);
		},
		resume: function () {
			animTransition && animTransition.play();
			animInterval && animInterval.play();
		},
		rewind: function () {
			this.pause();
			current = -1;
			animTransition = null;
			animInterval = null;
		}
	};
	
	if (o.autoplay) {
		gallery.play();
	} else {
		gallery.next(false);
	}
	
	$this.data('gallery', gallery);
	
	return this;
	
},

{
	images: [],
	transition: {
		duration: 1000,
		ease: "smooth",
		type: "crossfade"
	},
	interval: {
		duration: 2000,
		ease: "smooth",
		type: "",
		from: { left: 0, top: 0, width: 1, height: 1 },
		to: { left: 0, top: 0, width: 1, height: 1 }
	},
	autoplay: true,
	transitionToFirst: false,
	loop: true,
	onLoad: null,
	onTransition: null
},

{
	remove: function () {
		$(this).data('gallery').pause();
	}
}

);

})(Q, Q.$, window, document);
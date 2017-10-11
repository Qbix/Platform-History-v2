(function (Q, $, window, document, undefined) {

var Places = Q.Places;

/**
 * Places Tools
 * @module Places-tools
 */

/**
 * Displays a globe, using planetary.js
 * @class Places globe
 * @constructor
 * @param {Object} [options] used to pass options
 * @param {String} [options.countryCode='US'] the initial country to rotate to and highlight
 * @param {Array} [options.highlight={US:true}] pairs of {countryCode: color},
 *   if color is true then state.colors.highlight is used.
 *   This is modified by the default handler for beforeRotateToCountry added by this tool.
 * @param {Number} [options.radius=0.9] The radius of the globe, as a fraction of Math.min(canvas.width, canvas.height) / 2.
 * @param {Number} [options.durations] The duration of rotation animation (it all rhymes baby)
 * @param {Object} [options.colors] colors for the planet
 * @param {String} [options.colors.oceans='#2a357d'] the color of the ocean
 * @param {String} [options.colors.land='#389631'] the color of the land
 * @param {String} [options.colors.borders='#008000'] the color of the borders
 * @param {Object} [options.pings] default options for any pings added with addPing
 * @param {Object} [options.pings.duration=2000] default duration of any ping animation
 * @param {Object} [options.pings.size=10] default size of any ping animation
 * @param {Object} [options.pings.color='white'] default color of any ping animation
 * @param {Object} [options.shadow] shadow effect configuration
 * @param {String} [options.shadow.src="{{Q}}/img/shadow3d.png"] src , path to image
 * @param {Number} [options.shadow.stretch=1.5] stretch
 * @param {Number} [options.shadow.dip=0.25] dip
 * @param {Number} [options.shadow.opacity=0.5] opacity
 * @param {Q.Event} [options.onReady] this event occurs when the globe is ready
 * @param {Q.Event} [options.onSelect] this event occurs when the user has selected a country or a place on the globe. It is passed (latitude, longitude, countryCode)
 * @param {Q.Event} [options.beforeRotate] this event occurs right before the globe is about to rotate to some location
 * @param {Q.Event} [options.beforeRotateToCountry] this event occurs right before the globe is about to rotate to some country
 */
Q.Tool.define("Places/globe", function _Places_globe(options) {
	var tool = this;
	var state = tool.state;
	var $te = $(tool.element);
	
	var p = Q.pipe(['scripts', 'countries'], function _proceed() {
		tool.$canvas = $('<canvas />').attr({
			width: $te.outerWidth(),
			height: $te.outerHeight()
		}).appendTo($te)
		.on(Q.Pointer.fastclick, tool, function(event) {
			var ll = tool.getCoordinates(event);
			tool.geocoder.geocode(
				{'location': { lat: ll.latitude, lng: ll.longitude }},
				function(results, status) {
					if (status === google.maps.GeocoderStatus.OK && results[0]) {
						var countryCode = _getComponent(results[0], 'country');
						tool.rotateToCountry(countryCode);
					} else {
						tool.rotateTo(ll.latitude, ll.longitude);
					}
					Q.handle(state.onSelect, [ll.latitude, ll.longitude, countryCode]);
				}
			);
		});
		
		if (!state.radius) {
			state.radius = 0.9;
		}
		
		var globe = tool.globe = planetaryjs.planet();
		
		globe.onInit(function () {
			Q.handle(state.onReady, tool);
		});
		
		// The `earth` plugin draws the oceans and the land; it's actually
		// a combination of several separate built-in plugins.
		//
		// Note that we're loading a special TopoJSON file
		// (world-110m-withlakes.json) so we can render lakes.
		globe.loadPlugin(planetaryjs.plugins.earth({
			topojson: { file:   Q.url('Q/plugins/Places/data/world-110m-withlakes.json') },
			oceans:   { fill:   state.colors.oceans },
			land:	 { fill:   state.colors.land },
			borders:  { stroke: state.colors.borders }
		}));
		
		// Load our custom `lakes` plugin to draw lakes
		globe.loadPlugin(_lakes({
			fill: state.colors.oceans
		}));
		
		// Load our custom `lakes` plugin to highlight countries
		globe.loadPlugin(_highlight({
			tool: tool
		}));
		
		// The zoom and drag plugins enable
		// manipulating the globe with the mouse.
		var half = Math.min(tool.$canvas.width(), tool.$canvas.height()) / 2;
		var radius = half * state.radius;
		globe.loadPlugin(planetaryjs.plugins.zoom({
			scaleExtent: [radius, 20 * state.radius]
		}));
		globe.loadPlugin(planetaryjs.plugins.drag({}));
		
		// Set up the globe's initial scale, offset, and rotation.
		globe.projection
			.scale(radius)
			.translate([half, half])
			.rotate([0, -10, 0]);
		
		globe.loadPlugin(planetaryjs.plugins.pings());
		
		if (state.shadow && state.shadow.src) {
			var shadow = $('<img />').addClass('Places_globe_shadow')
				.attr('src', Q.url(state.shadow.src));
			shadow.css('display', 'none').prependTo($te).load(function () {
				var $this = $(this);
				var w = h = radius * 2;
				var width = w * state.shadow.stretch;
				var height = Math.min($this.height() * width / $this.width(), h/2);
				var toSet = {
					'position': 'absolute',
					'left': ($te.outerWidth() - width)/2+'px',
					'top': $te.outerHeight() - height * (1-state.shadow.dip)+'px',
					'width': width+'px',
					'height': height+'px',
					'opacity': state.shadow.opacity,
					'display': '',
					'padding': '0px',
					'background': 'none',
					'border': '0px',
					'outline': '0px',
					'z-index': 1
				};
				var i, l, props = Object.keys(toSet);
				$this.css(toSet);
			});
			var $placeholder = $('<div class="Places_globe_placeholder" />').css({
				width: tool.$canvas.outerWidth(),
				height: tool.$canvas.outerHeight()
			}).insertAfter(tool.$canvas);
			tool.$canvas.css({
				'position': 'absolute',
				'z-index': 2
			});
			if ($te.css('position') === 'static') {
				$te.css('position', 'relative');
			}
		}
		
		$te.on('touchmove', function (e) {
			e.preventDefault();
		});
		
		tool.refresh();
	});
	
	Q.addScript([
		'Q/plugins/Places/js/lib/d3.js',
		'Q/plugins/Places/js/lib/topojson.js',
		'Q/plugins/Places/js/lib/planetaryjs.js'
	], p.fill('scripts'));
	
	Places.loadCountries(p.fill('countries'));
},

{ // default options here
	countryCode: 'US',
	colors: {
		oceans: '#2a357d',
		land: '#389631',
		borders: '#008000',
		highlight: '#ff0000'
	},
	highlight: {'US':true},
	radius: null,
	duration: 1000,
	pings: {
		duration: 2000,
		size: 10,
		color: 'white'
	},
	shadow: {
		src: "{{Q}}/img/shadow3d.png",
		stretch: 1.2,
		dip: 0.25,
		opacity: 0.5
	},
	onReady: new Q.Event(),
	onRefresh: new Q.Event(),
	beforeRotate: new Q.Event(),
	beforeRotateToCountry: new Q.Event(function (countryCode) {
		var h = this.state.highlight = {};
		h[countryCode] = true;
	}, "Place/globe"),
	onRotateEnded: new Q.Event()
},

{ // methods go here
	
	refresh: function _Places_globe_refresh () {
		var tool = this;
		var state = tool.state;
		var $te = $(tool.element);
		Places.loadGoogleMaps(function () {
			tool.geocoder = new google.maps.Geocoder;
			tool.globe.draw(tool.$canvas[0]);
			var waitForTopoJsonLoad = setInterval(_a, 50);
			function _a() {
				if (!Q.getObject('globe.plugins.topojson.world', tool)) return;
				tool.rotateToCountry(state.countryCode);
				clearInterval(waitForTopoJsonLoad);
				Q.handle(state.onRefresh, tool);
			}
			_a();
		});
	},
	
	/**
	 * Obtain the coordinates of a country's cener
	 * @param {String} countryCode
	 * @return {Object|null} An object with properties "latitude" and "longitude"
	 */
	countryCenter: function Places_globe_countryCenter (countryCode) {
		var feature = _getFeature(tool.globe, countryCode);
		if (!feature) {
			return false;
		}
		var p = d3.geo.centroid(feature);
		return { latitude: p[0], longitude: p[1] };
	},
	
	/**
	 * Rotate the globe to center around a location
	 * @param {Number} latitude
	 * @param {Number} longitude
	 * @param {Number} [duration=state.duration] number of milliseconds for the animation to take
	 */
	rotateTo: Q.preventRecursion('Places/globe rotateTo', 
	function Places_globe_rotateTo (latitude, longitude, duration, callback) {
		var tool = this;
		duration = duration || this.state.duration;
		Q.handle(tool.state.beforeRotate, tool, [latitude, longitude, duration]);
		d3.transition()
			.duration(duration)
			.tween('rotate', function() {
				var projection = tool.globe.projection;
				var r = d3.interpolate(projection.rotate(), [-longitude, -latitude]);
				tool.center = {
					latitude: latitude,
					longitude: longitude
				};
				return function(t) {
					projection.rotate(r(t));
					callback && callback.apply(this, arguments);
				};
			})
			.transition();
	}),
		
	/**
	 * Rotate the globe to center around a country
	 * @param {String} countryCode which is described in ISO-3166-1 alpha-2 code
	 * @param {Number} duration number of milliseconds for the animation to take
	 * @return {Boolean} whether the country was found on the globe, and the rotation started
	 */
	rotateToCountry: Q.preventRecursion('Q/globe rotateToCountry', 
	function Places_globe_rotateToCountry (countryCode, duration) {
		var tool = this;
		var feature = _getFeature(tool.globe, countryCode);
		if (!feature) {
			return false;
		}
		var c = tool.$canvas[0].getContext("2d");
		var projection = tool.globe.projection;
		var path = d3.geo.path().projection(projection).context(c);
		// var tj = tool.globe.plugins.topojson;
		// var land = topojson.feature(tj.world, tj.world.objects.land);
		// var borders = topojson.mesh(
		// 	tj.world, tj.world.objects.countries,
		// 	function(a, b) { return a !== b; }
		// );
		var p = d3.geo.centroid(feature);
		Q.handle(tool.state.beforeRotateToCountry, tool, [countryCode, p[1], p[0], duration]);
		var transition = tool.rotateTo(p[1], p[0], duration, function () {
			c.fillStyle = tool.state.colors.highlight;
			c.beginPath();
			path(feature);
			c.fill();
		});
		return true;
	}),
	
	/**
	 * Obtain latitude and longitude from a pointer event
	 * @param {Event} event some pointer event
	 * @return {Object} object with properties "latitude", "longitude"
	 */
	getCoordinates: function Places_globe_getCoordinates(event) {
		var tool = this;
		var offset = $(event.target).offset();
		var x = Q.Pointer.getX(event) - offset.left;
		var y = Q.Pointer.getY(event) - offset.top;
		var coordinates = tool.globe.projection.invert([x, y]);
		return {
			latitude: coordinates[1],
			longitude: coordinates[0]
		}
	},
	
	/**
	 * Adds a ping to start animating immediately
	 * @param {Number} latitude The latitude of the center of the ping
	 * @param {Number} longitude The longitude of the center of the ping
	 * @param {Number} [duration=state.pings.duration] Number of milliseconds for the ping growing animation
	 * @param {Number} [size=state.pings.size] Maximum angle, in degrees, for the ping circle to grow to
	 * @param {Number} [size=state.pings.color] Color of the ping circle
	 */
	addPing: function (latitude, longitude, duration, size, color) {
		var state = this.state;
		var globe = this.globe;
		if (!globe.plugins.pings) return;
		globe.plugins.pings.add(longitude, latitude, { 
			color: color || state.pings.color, 
			ttl: duration || state.pings.duration, 
			angle: size || state.pings.size
		});
	}
	
});

/**
 * Looking for a desired type in the results and getting component using typeName
 * @param {Object} results
 * @param {String} desiredType, for example 'country'
 * @param {?String} typeName, for example 'long_name'. If it doesn't set it is equal to 'short_name'
 * @returns {*}
 */
function _getComponent(result, desiredType, typeName) {
	typeName = typeName || 'short_name';
	var address_components = result.address_components;
	for (var i = 0; i < address_components.length; i++) {
		var shortname = address_components[i].short_name;
		var type = address_components[i].types;
		if (type.indexOf(desiredType) != -1) {
			var c = address_components[i][typeName];
			return (c == null || !c.trim().length) ? shortname : c;
		}
	}
}

// This plugin takes lake data from the special
// TopoJSON we're loading and draws them on the map.
function _lakes(options) {
	options = options || {};
	var lakes = null;
	return function(planet) {
		planet.onInit(function() {
			/**
			 * We can access the data loaded from the TopoJSON plugin on its namespace on `planet.plugins`.
			 * We're loading a custom TopoJSON file with an object called "ne_110m_lakes".
			 */
			var world = planet.plugins.topojson.world;
			lakes = topojson.feature(world, world.objects.ne_110m_lakes);
		});

		planet.onDraw(function() {
			planet.withSavedContext(function(context) {
				context.beginPath();
				planet.path.context(context)(lakes);
				context.fillStyle = options.fill || 'black';
				context.fill();
			});
		});
	};
};

// This plugin highlights countries
function _highlight(options) {
	options = options || {};
	var tool = options.tool;
	return function(planet) {
		planet.onDraw(function() {
			planet.withSavedContext(function(context) {
				Q.each(tool.state.highlight, function (countryCode) {
					var feature = _getFeature(tool.globe, countryCode);
					if (!feature) {
						return;
					}
					var c = tool.$canvas[0].getContext("2d");
					var projection = tool.globe.projection;
					var path = d3.geo.path().projection(projection).context(c);
					var color = tool.state.highlight[countryCode];
					color = typeof color === 'string' ? color : tool.state.colors.highlight;
					var c = tool.$canvas[0].getContext("2d");
					c.fillStyle = color;
					c.beginPath();
					path(feature);
					c.fill();
				});
			});
		});
	};
};

// Gets the country's feature, if any
function _getFeature(planet, countryCode) {
	var countryName, lookup, tj, countries, features, feature;
	var parts = Places.countriesByCode[countryCode];
	if (!parts) {
		return parts;
	}
	countryName = parts[0];
	lookup = Places.countryLookupByCode[countryCode];
	if (tj = planet.plugins.topojson) {
		if (!tj.world) {
			return null;
		}
		countries = tj.world.objects.countries;
		features = topojson.feature(tj.world, countries).features;
		feature = null;
		Q.each(features, function () {
			if (this.id == lookup) {
				feature = this;
			}
		});
	}
	return feature;
}

})(Q, jQuery, window, document);
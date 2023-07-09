/**
 * Places plugin's front end code
 *
 * @module Places
 * @class Places
 */

(function(Q, $, w) {

var Places = Q.Places = Q.plugins.Places = {
	
	// whether to display things using the metric system units
	metric: (['en-US', 'en-GB', 'my-MM', 'en-LR']
		.indexOf(Q.Text.language + '-' + Q.Text.locale) < 0),
	
	options: {
		platform: 'google'
	},
	
	Google: {},

	/**
	 * @method loadGoogleMaps
	 * @static
	 * Use this to load Google Maps before using them in the callback
	 * @param {Function} callback Once the callback is called, google.maps is accessible
	 */
	loadGoogleMaps: function (callback) {
		if (w.google && w.google.maps) {
			callback();
		} else {
			Places.loadGoogleMaps.waitingCallbacks.push(callback);
			Q.addScript(Places.loadGoogleMaps.src);
		}
	},
	
	/**
	 * @method loadCountries
	 * @static
	 * Use this to load country data into Q.Places.countries and Q.Places.countriesByCode
	 * @param {Function} callback Once the callback is called, 
	 *   Q.Places.countries and Q.Places.countries is accessible
	 */
	loadCountries: function (callback) {
		Q.addScript('{{Places}}/js/lib/countries.js', function () {
			var pc = Places.countries;
			var cbc = Places.countriesByCode = {};
			for (var i=0, l = Places.countries.length; i < l; ++i) {
				var pci = pc[i];
				cbc[ pci[1] ] = pci;
			}
			callback();
		});
	},
	
	/**
	 * @method distance
	 * @static
	 * Use this to calculate the haversine distance between two sets of lat/long coordinates on the Earth
	 * @param {Number} lat1 latitude in degrees
	 * @param {Number} long1 longitude in degrees
	 * @param {Number} lat2 latitude in degrees
	 * @param {Number} long2 longitude in degrees
	 * @return {Number} The result, in meters, of applying the haversine formula
	 */
	distance: function(lat1, long1, lat2, long2) {
		var earthRadius = 6378137; // equatorial radius in meters

		var sin_lat   = Math.sin(_deg2rad(lat2  - lat1)  / 2.0);
		var sin2_lat  = sin_lat * sin_lat;

		var sin_long  = Math.sin(_deg2rad(long2 - long1) / 2.0);
		var sin2_long = sin_long * sin_long;

		var cos_lat1 = Math.cos(_deg2rad(lat1));
		var cos_lat2 = Math.cos(_deg2rad(lat2));

		var sqrt      = Math.sqrt(sin2_lat + (cos_lat1 * cos_lat2 * sin2_long));
		var distance  = 2.0 * earthRadius * Math.asin(sqrt);

		return distance;
	},

	/**
	 * Use this method to generate a label for a radius based on a distance in meters
	 * @method distanceLabel
	 * @static
	 * @param {Number} meters
	 * @param {String} [units] optionally specify 'km', 'kilometers' or 'miles'
	 * @return {String} Returns a label that looks like "x.y km", "x miles" or "x meters"
	 */
	distanceLabel: function(meters, units) {
		if (!units) {
			var milesr = Math.abs(meters/1609.34 - Math.round(meters/1609.34));
			var kmr = Math.abs(meters/1000 - Math.round(meters/1000));
			units = milesr < kmr ? 'miles' : 'km';
		}
		var displayUnits = Places.units[units];
		switch (units) {
		case 'mi':
		case 'miles':
			var mi = Math.round(meters/1609.34*10)/10;
			if (mi === 1 && units === 'miles') {
				units = 'mile';
			}
			return mi+' '+displayUnits;
		case 'km':
		case 'kilometers':
		default:
			var km = (meters/1000);
			var m = Math.ceil(meters);
			if (km === 1 && units === 'kilometers') {
				units = 'kilometer';
			}
			return meters % 100 == 0
				? km +' '+displayUnits
				: m+' '+Places.units.meters;
		}
	},

	/**
	 * Use this method to calculate the heading from pairs of coordinates
	 * @method heading
	 * @static
	 * @param {Number} lat1 latitude in degrees
	 * @param {Number} long1 longitude in degrees
	 * @param {Number} lat2 latitude in degrees
	 * @param {Number} long2 longitude in degrees
	 * @return {Number} The heading, in degrees
	 */
	heading: function(lat1, long1, lat2, long2) {
		lat1 = lat1 * Math.PI / 180;
		lat2 = lat2 * Math.PI / 180;
		var dLong = (long2 - long1) * Math.PI / 180;
		var y = Math.sin(dLong) * Math.cos(lat2);
		var x = Math.cos(lat1) * Math.sin(lat2) -
		        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLong);
		var brng = Math.atan2(y, x);
		return (((brng * 180 / Math.PI) + 360) % 360);
	},
	
	/**
	 * Gets the heading of a car along a route given its current coordinates.
	 * The coordinates should already have "latitude" and "longitude" properties.
	 * This is good as a fallback for rotating the car icon on the map,
	 * in case the "heading" isn't already specified.
	 * @param {Object} route The route along which the car is traveling
	 * @param {Object} coordinates]
	 * @param {Object} coordinates.latitude
	 * @param {Object} coordinates.longitude
	 * @param {Object} [options]
	 * @param {String} [options.platform=Places.options.platform]
	 * @return {Number} the heading
	 */
	headingAlongRoute: function (route, coordinates, options) {
		if (!route.legs || !route.legs.length) {
			// TODO: try to get heading from Places.heading() and previous coordinates
			return 0;
		}
		var point = {
			x: coordinates.latitude,
			y: coordinates.longitude
		};
		var polyline = Places.polyline(route, options);
		var closest = Places.closest(point, polyline);
		var from = polyline[closest.index-1];
		var to = polyline[closest.index];
		return Places.heading(from.x, from.y, to.x, to.y);
	},
	
	/**
	 * Use this method to calculate the closest point on a polyline
	 * @method closest
	 * @static
	 * @param {Object} point
	 * @param {Number} point.x
	 * @param {Number} point.y 
	 * @param {Array} polyline an array of objects that contain "x" and "y" properties
	 * @return {Object} contains properties "index", "x", "y", "distance", "fraction"
	 */
	closest: function(point, polyline) {
		var x = point.x;
		var y = point.y;
		var a, b, c, d, e, f, i, l, n, n1, n2, frac, dist;
		var distance = null;
		var closest = null;

		for (i = 1, l = polyline.length; i < l; i++) {
			a = polyline[i-1].x;
			b = polyline[i-1].y;
			c = polyline[i].x;
			d = polyline[i].y;
			n = (c-a)*(c-a) + (d-b)*(d-b);
			frac = n ? ((x-a)*(c-a) + (y-b)*(d-b)) / n : 0;
			frac = Math.max(0, Math.min(1, frac));
			e = a + (c-a)*frac;
			f = b + (d-b)*frac;
			dist = Math.sqrt((x-e)*(x-e) + (y-f)*(y-f));
			if (distance === null || distance > dist) {
				distance = dist;
				closest = {
					index: i,
					x: e,
					y: f,
					distance: dist,
					fraction: frac
				};
			}
		}
	    return closest;
	},
	
	/**
	 * Calculate a route.
	 * @param {String|Object} from an address, a string with properties "latitude", "longitude", or placeId 
	 * @param {String|Object} to an address, a string with properties "latitude", "longitude", or placeId
	 * @param {Array} waypoints array of objects with properties "location" and "stopover", wher "location" is an object that can be passed to Places.Coordinates constructor
	 * @param {Function} callback
	 * @param {Object} options Can include the following:
	 *   @param {Number} [options.startTime] Time to start trip. Standard Unix time (seconds from 1970). If specified, do not also set endTime.
	 *   @param {Number} [options.endTime] Time to end trip. Standard Unix time (seconds from 1970). If specified, do not also set startTime.
	 *   @param {Number} [options.travelMode='driving'] Can be "driving", "bicycling", "transit", "walking"
	 *   @param {String} [options.platform=Places.options.platform]
	 */
	route: function (from, to, waypoints, optimize, callback, options) {
		options = options || {};
		var platform = options.platform || Places.options.platform;
		var params = {
			origin: from,
			destination: to,
			waypoints: waypoints,
			optimizeWaypoints: optimize
		};
		var googleTravelModes = {
			driving: google.maps.TravelMode.DRIVING,
			bicycling: google.maps.TravelMode.BICYCLING,
			transit: google.maps.TravelMode.TRANSIT,
			walking: google.maps.TravelMode.WALKING
		};
		params.travelMode = googleTravelModes[options.travelMode || 'driving'];
		if (options.startTime) {
			params.transitOptions = {
				arrivalTime: new Date(options.endTime*1000)
			};
		} else if (options.startTime) {
			params.transitOptions = {
				departureTime: new Date(options.startTime*1000)
			};
		}
		var d = Places.Google.directionsService;
		if (!d) {
			d = Places.Google.directionsService = new google.maps.DirectionsService();
		}
		d.route(params, function (directions, status) {
			if (status !== google.maps.DirectionsStatus.OK) {
				return Q.handle(Places.route.onError, Places, [directions, status, d, params]);
			}
			Q.handle(Places.route.onResult, Places, [directions, status, d, params]);
			Q.handle(callback, Places, [directions, status, d, params]);
		});
	},
	/**
	 * Obtain a polyline from a route
	 * @param {Object} route the route
	 * @param {Object} options
	 * @param {String} [options.platform=Places.options.platform]
	 */
	polyline: function(route, options) {
		options = options || {};
		var platform = options.platform || Places.options.platform;
		var polyline = [];
		var str = route.overview_polyline.points;
		var index = 0,
			lat = 0,
			lng = 0,
			shift = 0,
			result = 0,
			byte = null,
			latitude_change,
			longitude_change,
			precision = 5,
			factor = Math.pow(10, precision);

		// Coordinates have variable length when encoded, so just keep
		// track of whether we've hit the end of the string. In each
		// loop iteration, a single coordinate is decoded.
		while (index < str.length) {
			// Reset shift, result, and byte
			byte = null;
			shift = 0;
			result = 0;

			do {
				byte = str.charCodeAt(index++) - 63;
				result |= (byte & 0x1f) << shift;
				shift += 5;
			} while (byte >= 0x20);

			latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

			shift = result = 0;

			do {
				byte = str.charCodeAt(index++) - 63;
				result |= (byte & 0x1f) << shift;
				shift += 5;
			} while (byte >= 0x20);

			longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

			lat += latitude_change;
			lng += longitude_change;

			polyline.push({
				x: lat / factor,
				y: lng / factor
			});
		}

		return polyline;
	}
};

Places.route.onResult = new Q.Event();
Places.route.onError = new Q.Event(function (directions, status) {
	console.warn('Places.route: request failed due to ' + status);
});

/**
 * Represents geospacial coordinates with latitude, longitude, heading.
 * Similar to HTML5 Coordinates object.
 * It has an onReady event that occurs when the coordinates have been geocoded.
 * It also has an onUpdated event which you handle and trigger.
 * Use Places.Coordinates.from() to create it
 * @class Places.Coordinates
 * @constructor
 */
Places.Coordinates = function (_internal) {
	if (_internal !== true) {
		throw new Q.Error("You should use Places.Coordinates.from(data, callback)");
	}
};

/**
 * Create a Places.Coordinates object from some data
 * @class Places.Coordinates
 * @method from
 * @static
 * @param {Object|Streams.Stream\Places.Coordinates} data
 *  Can be a stream with attributes,
 *  or object with properties, which can include either
 *  ("latitude" and "longitude") together,
 *  or ("address") or ("userId" with optional "streamName").
 *  It can additionally specify "heading" and "speed".
 * @param {String} data.updatedKey If data is a stream, then set this to a string or Q.Tool
 *  to subscribe to the "Places/location/updated" message for location updates.
 * @param {Number} data.latitude Used together with latitude
 * @param {Number} data.longitude Used together with longitude
 * @param {Number} data.heading Used to set heading, in clockwise degrees from true north
 * @param {Number} data.speed Horizontal component of the velocity in meters-per-second
 * @param {String} [data.platform=Places.options.platform]
 * @param {String} [data.address] This would be geocoded by the platform
 * @param {String} [data.placeId] A google placeId, if the platform is 'google'
 * @param {String} [data.userId] Can be used to indicate a specific user
 * @param {String} [data.streamName="Places/user/location"] Name of a stream published by the user
 * @param {Function} [callback] Called after latitude and longitude are available
 *  (may do geocoding with the platform to obtain them if they're not available yet).
 *  The first parameter is an error string, if any.
 *  Next is an array of platform-specific Result objects. 
 *  The "this" object is the Coordinates object itself,
 *  containing the latitude and longitude from the main result.
 * @return {Places.Coordinates}
 */
Places.Coordinates.from = function (data, callback) {
	var c = (data instanceof Places.Coordinates)
		? Q.copy(data)
		: new Places.Coordinates(true);
	if (!data) {
		throw new Q.Error("Places.Coordinates.from: data is required");
	}
	if (Q.typeOf (data) === 'Q.Streams.Stream') {
		_stream.call(data);
	} else if (data.userId) {
		var streamName = data.streamName || 'Places/user/location';
		Q.Streams.get(data.userId, streamName, _stream);
	} else {
		for (var k in data) {
			c[k] = data[k];
		}
		_geocode(callback);
	}
	return c;
	function _stream() {
		c.stream = this;
		Q.extend(c, this.getAllAttributes());
		if (data.updatedKey) {
			this.onMessage('Places/location/updated')
			.set(function (message) {
				var instructions = message.getAllInstructions();
				Q.extend(c, instructions);
				Q.handle(c.onUpdated, c, arguments);
			}, data.updatedKey);
		}
		_geocode(callback);
	}
	function _geocode(callback) {
		c.onUpdated = new Q.Event();
		c.onReady = new Q.Event();
		if (!callback) {
			return;
		}
		c.geocode(callback, Q.extend({
			basic: true
		}, data));
	}
};


/**
 * Operates with dialogs.
 * @class Streams.Dialogs
 */

Places.Dialogs = {
	/**
	 * Show a dialog that lets the user choose a location.
	 * @static
	 * @method location
	 * @param {Function} callback First parameter is a Places.Coordinates object,
	 *   or null if dialog was closed without selecting anything.
	 * @param {Object} [dialogOptions] For Q.Dialogs.push()
	 * @param {Object} [toolOptions] For the Places/location tool
	 */
	location: function (callback, dialogOptions, toolOptions) {
		var called = true;
		var coordinates = null;
		var element = Q.Tool.setUpElement('div', 'Places/location', Q.extend({
			onChoose: function (c) {
				coordinates = c;
			}
		}, toolOptions));
		Q.Text.get('Places/content', function (err, text) {
			Q.Dialogs.push(Q.extend({
				title: text.location.dialog.title,
				content: element,
				onClose: function () {
					callback(coordinates);
				},
				apply: true,
				className: 'Places_location_dialog'
			}, dialogOptions));
		});
	}
};

Places.units = {
	meters: "meters",
	kilometers: "kiometers",
	km: "km",
	miles: "miles"
};

Q.onInit.add(function () {
	Q.Text.get('Places/content', function (err, text) {
		if (!text) {
			return;
		}
		Places.units = text.units;
	});
}, 'Q.Places');

var Cp = Places.Coordinates.prototype;
	
/**
 * Obtain geocoding definition from a geocoding service
 * @method geocode
 * @static
 * @param {Function} callback
 *  The first parameter is an error string, if any.
 *  Next is an array of platform-specific Result objects. 
 *  The "this" object is the Coordinates object itself,
 *  containing the latitude and longitude from the main result.
 * @param {Object} [options]
 * @param {String} [options.platform=Places.options.platform]
 * @param {Boolean} [options.basic=false] If true, skips requests to platform if latitude & longitude are available
 */
Cp.geocode = function (callback, options) {
	var o = Q.extend({}, Cp.geocode.options, options);
	if (o.platform !== 'google') {
		throw new Q.Error("Places.Coordinates.prototype.geocode: only works with platform=google for now");
	}	
	var c = this;
	if (options && options.basic
	&& c.latitude && c.longitude) {
		return callback && callback.call(c, null, []);
	}

	if (Q.typeOf(c.lat) === "function" && Q.typeOf(c.lng) === "function") {
		c.latitude = c.latitude || c.lat();
		c.longitude = c.longitude || c.lng();
	}

	Places.loadGoogleMaps(function () {
		var param = {};
		var p = "Places.Coordinates.geocode: ";
		if (c.placeId) {
			param.placeId = c.placeId;
		} else if (c.latitude || c.longitude) {
			if (!c.latitude) {
				callback && callback.call(c, p + "missing latitude");
			}
			if (!c.longitude) {
				callback && callback.call(c, p + "missing longitude");
			}
			param.location = {
				lat: parseFloat(c.latitude),
				lng: parseFloat(c.longitude)
			};
		} else if (c.lat && c.lng) {
			if (!c.lat) {
				callback && callback.call(c, p + "missing latitude");
			}
			if (!c.lng) {
				callback && callback.call(c, p + "missing longitude");
			}
			param.location = {
				lat: parseFloat(c.lat()),
				lng: parseFloat(c.lng())
			};
		} else if (c.address) {
			param.address = c.address;
		} else {
			return callback && callback.call(c, p + "wrong location format");
		}
		var key, cached;
		if (cached = _geocodeCache.get([param])) {
			return Q.handle(callback, cached.subject, cached.params);
		}
		if (param) {
			var geocoder = new google.maps.Geocoder;
			geocoder.geocode(param, function (results, status) {
				var json, err, d;
				if (status !== 'OK') {
					d = Q.copy(c);
					delete d.onReady;
					delete d.onUpdated;
					json = JSON.stringify(d);
					err = p + "can't geocode (" + status + ") " + json;
				} else if (!results[0]) {
					d = Q.copy(c);
					delete d.onReady;
					delete d.onUpdated;
					json = JSON.stringify(c);
					err = p + "no place matched " + json;
				} else {
					var result = results[0];
					if (result.geometry && result.geometry.location) {
						var loc = result.geometry.location;
						c.latitude = loc.lat();
						c.longitude = loc.lng();
					}
					_geocodeCache.set([param], 0, c, [err, results]);
				}
				Q.handle(callback, c, [err, results]);
			});
		}
	});
};

Cp.geocode.options = {
	platform: Places.options.platform,
	basic: false
};

Places.Location = {
	/**
	 * Get location from some stream (for back compatibility)
	 * @method getLocation
	 * @static
	 * @param {Streams_Stream} stream
	 */
	fromStream: function(stream){
		var location;

		if (!Q.Streams.isStream(stream)) {
			return;
		}

		// this new approach, location set in stream fields
		try {
			location = JSON.parse(stream.fields.location);
		} catch (ex) {}

		// this old approach, when location stored in attributes
		location = location || stream.getAttribute('location');

		// new approach
		if (Q.isPlainObject(location)) {
			return location;
		}

		// old approach
		var communityId = stream.getAttribute("communityId");
		var res = {
			publisherId: communityId,
			name: location,
			venue: stream.getAttribute("venue"),
			address: stream.getAttribute("address"),
			latitude: stream.getAttribute("latitude"),
			longitude: stream.getAttribute("longitude")
		};

		var area = stream.getAttribute("area");
		if (area) {
			res.area = {
				publisherId: communityId,
				name: area,
				title: stream.getAttribute("areaSelected")
			};
		}

		return res;
	}
};

var _geocodeCache = new Q.Cache({max: 100});

function _deg2rad(angle) {
	return angle * 0.017453292519943295; // (angle / 180) * Math.PI;
}

Q.beforeInit.set(function () {
	var plk = Places.loadGoogleMaps.key;
	Places.loadGoogleMaps.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp'
		+ '&libraries=geometry,places'
		+ (plk ? '&key='+encodeURIComponent(plk) : '')
		+ '&callback=Q.Places.loadGoogleMaps.loaded';
}, 'Places');

Places.loadGoogleMaps.waitingCallbacks = [];
Places.loadGoogleMaps.loaded = function _PLaces_loadGoogleMaps_loaded () {
	Q.handle(Places.loadGoogleMaps.waitingCallbacks);
};

Q.Streams.Message.shouldRefreshStream("Places/location/updated", true);

Q.text.Places = {

};

Q.Tool.define({
	"Places/address": "{{Places}}/js/tools/address.js",
	"Places/globe": "{{Places}}/js/tools/globe.js",
	"Places/countries": "{{Places}}/js/tools/countries.js",
	"Places/user/location": "{{Places}}/js/tools/user/location.js",
	"Places/location": "{{Places}}/js/tools/location.js",
	"Places/location/preview": "{{Places}}/js/tools/location/preview.js",
	"Places/areas": "{{Places}}/js/tools/areas.js"
});

})(Q, Q.$, window);
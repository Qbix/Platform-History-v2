/**
 * Places plugin's front end code
 *
 * @module Places
 * @class Places
 */

(function(Q, $, w) {

var Places = Q.Places = Q.plugins.Places = {
	
	metric: true, // whether to display things using the metric system units

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
		Q.addScript('plugins/Places/js/lib/countries.js', function () {
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
		switch (units) {
		case 'miles':
			return Math.round(meters/1609.34*10)/10+" miles";
		case 'km':
		case 'kilometers':
		default:
			return meters % 100 == 0 ? (meters/1000)+' '+units : Math.ceil(meters)+" meters";
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
		var closest = null;
		var distance = null;
        for (var i=1, l=polyline.length; i<l; i++) {
			var a = polyline[i-1].x;
			var b = polyline[i-1].y;
			var c = polyline[i].x;
			var d = polyline[i].y;
			var n = (c-a)*(c-a) + (d-b)*(d-b);
			var frac = n ? ((x-a)*(c-a) + (y-b)+(d-b)) / n : 0;
			frac = Math.max(0, Math.min(1, frac));
			var e = a + (c-a)*frac;
			var f = b + (d-b)*frac;
			var dist = Math.sqrt((x-e)*(x-e) + (y-f)(y-f));
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
	}
	
};

/**
 * Methods for working with location streams
 * @class Places.Location
 */
Places.Location = {
	/**
	 * Get the user's "Places/user/location" stream
	 * @method getUserStream
	 * @static
	 * @param {Function} callback receives (err, stream)
	 */
	getUserStream: function (callback) {
		var userId = Q.getObject('Users.loggedInUser.id', Q);
		if (!userId) {
			var err = new Q.Error("Places.Location.getUserStream: not logged in");
			return callback(err);
		}
		Q.Streams.get(userId, "Places/user/location", function (err) {
			var msg = Q.firstErrorMessage(err);
			if (msg) {
				return callback(err);
			}
			callback.call(this, err, this);
		});
	},
	
	/**
	 * Obtain geocoding definition from a geocoding service
	 * @method geocode
	 * @static
	 * @param {Object} loc Provide a Places/location stream, or an object with either a "placeId" property, a pair of "latitude","longitude" properties, an "address" property for reverse geocoding, or a pair of "userId" and optional "streamName" (which otherwise defaults to "Places/user/location")
	 * @param {Function} callback gets (array of results of the geolocation, and status code)
	 * @param {Object} [options]
	 * @param {Object} [options.platform='google']
	 */
	geocode: function (loc, callback, options) {
		var o = Q.extend({}, Places.Location.geocode.options, options);
		if (o.platform !== 'google') {
			return;
		}
		Places.loadGoogleMaps(function () {
			var param = {};
			var p = "Places.Location.geocode: ";
			if (Q.typeOf(loc) === 'Q.Streams.Stream') {
				if (loc.fields.type !== 'Places/location') {
					throw new Q.Error(p + "stream must have type Places/location");
				}
				loc = loc.getAllAttributes();
			}
			if (loc.placeId) {
				param.placeId = loc.placeId;
			} else if (loc.latitude || loc.longitude) {
				if (!loc.latitude) {
					throw new Q.Error(p + "missing latitude");
				}
				if (!loc.latitude) {
					throw new Q.Error(p + "missing longitude");
				}
				param.location = {
					lat: parseFloat(loc.latitude),
					lng: parseFloat(loc.longitude)
				};
			} else if (loc.address) {
				param.address = loc.address;
			} else {
				throw new Q.Error(p + "wrong location format");
			}
			var geocoder = new google.maps.Geocoder;
			geocoder.geocode(param, function (results, status) {
				if (status !== 'OK') {
					throw new Q.Error(p + "can't geocode " + loc);
				}
				if (!results[0]) {
					throw new Q.Error(p + "no place matched " + loc);
				}
				Q.handle(callback, Places.Location, [results[0], status, results]);
			});
		});
	}
};

Places.Location.geocode.options = {
	platform: 'google'
};

Places.Route = function (platform, map, polyline) {
	if (platform !== 'google') {
		throw new Q.Error('Only supports google maps for now');
	}
    this.routePoints = [];
    this._map = map;
    this._polyline = polyline;
    var proj = this._map.getProjection();
    for (var i = 0; i < this._polyline.getPath().getLength(); i++) {
		var p = this._polyline.getPath().getAt(i);
        var point = proj.fromLatLngToPoint(p);
        this.routePoints.push(point);
    }
};

/**
 * Methods for working with location streams
 * @class Places.Route
 */
var Rp = Places.Route.prototype;

/**
 * Get closest point on route to test point
 * @param {GLatLng} latlng the test point
 * @return {GLatLng}
 */
Rp.closest = function (latlng) {
    var tm = this._map;
    var proj = this._map.getProjection();
    var point = proj.fromLatLngToPoint(latlng);
    var closest = Places.closest(point, this.routePoints);
    var proj = this._map.getProjection();
	var point = new google.maps.Point(closest.x, closest.y);
    return proj.fromPointToLatLng(point);
};

/**
 * internal use only, find distance along route to point nearest test point
 **/
Rp.length = function (index, fTo) {
    var routeOverlay = this._polyline;
    var d = 0;
	var p;
    for (var n=1; n<index; n++) {
		p = routeOverlay.getPath().getAt(n);
        d += routeOverlay.getPath().getAt(n-1).distanceFrom(p);
    }
	p = routeOverlay.getPath().getAt(index);
    d += routeOverlay.getPath().getAt(index-1).distanceFrom(p) * fTo;
    return d;
};

function _deg2rad(angle) {
	return angle * 0.017453292519943295; // (angle / 180) * Math.PI;
}

Q.beforeInit.set(function () {
	var plk = Places.loadGoogleMaps.key;
	Places.loadGoogleMaps.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp'
		+ '&libraries=places'
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
	"Places/address": "plugins/Places/js/tools/address.js",
	"Places/globe": "plugins/Places/js/tools/globe.js",
	"Places/countries": "plugins/Places/js/tools/countries.js",
	"Places/user/location": "plugins/Places/js/tools/user/location.js",
	"Places/location": "plugins/Places/js/tools/location.js"
});

})(Q, jQuery, window);
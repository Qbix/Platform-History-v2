/**
 * Places plugin's front end code
 *
 * @module Places
 * @class Places
 */

(function(Q, $, w) {

var Places = Q.Places = Q.plugins.Places = {

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
	 * @param {double} $lat1
	 * @param {double} $long1
	 * @param {double} $lat2
	 * @param {double} $long2
	 * @return {double} The result of applying the haversine formula
	 */
	distance: function(lat1, long1, lat2, long2) {
		var earthRadius = 3963.1676; // in meters

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
	 * @param {double} meters
	 * @param {string} [units] optionally specify 'km', 'kilometers' or 'miles'
	 * @return {string} Returns a label that looks like "x.y km", "x miles" or "x meters"
	 */
	distanceLabel: function(meters, units) {
		if (!units) {
			var milesr = Math.abs(meters/1609.34 - Math.round(meters/1609.34));
			var kmr = Math.abs(meters/1000 - Math.round(meters/1000));
			units = miles < kmr ? 'miles' : 'km';
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
	 * Calculate google position object from different arguments
	 * @method getGooglePosition
	 * @param {object|string} loc (Places/location stream, google placeId, a "latitude,longitude" pair, address, {userId: ...}, {latitude: ..., longitude})
	 * @param {function} callback
	 */
	getGooglePosition: function (loc, callback) {
		if (!loc) return;

		// loc already is a geocoder.geocode object
		if(loc.lat && loc.lng){
			callback(loc);
			return;
		}

		var tool = this;
		var param = {};

		if (typeof loc === 'string') {
			var parts = loc.split(',');
			if (parts.length == 2 && !isNaN(parts[0]) && !isNaN(parts[1])) { // loc is lng,ltd pair
				param.location = {
					lat: parseFloat(parts[0]),
					lng: parseFloat(parts[1])
				};
			} else if (loc.indexOf(' ') >= 0) { // loc is address
				param.address = loc;
			}else{ // loc is google place_id
				param.placeId = loc;
			}
		} else if (Q.typeOf(loc) === 'Q.Streams.Stream') {// loc is Places/location stream
			if (loc.fields.type !== 'Places/location') {
				throw new Q.Error();
			}
			param.location = {
				lat: parseFloat(loc.getAttribute('latitude')),
				lng: parseFloat(loc.getAttribute('longitude'))
			};
		} else if(Q.typeOf(loc) === 'object'){
			if(loc.placeId){ // loc is object {placeId: ...}
				param.placeId = loc.placeId;
			}else if(loc.latitude && loc.longitude){ // loc is object {latitude: ..., longitude: ...}
				param.location = {
					lat: parseFloat(loc.latitude),
					lng: parseFloat(loc.longitude)
				};
			}else if(loc.userId){ // loc is user id
				Q.Streams.get(loc.userId, "Places/user/location", function (err) {
					if (err) {
						return;
					}

					tool.getGooglePosition(this, callback);
				});

				return;
			}else{
				throw new Q.Error("Travel/map: unknown loc param: " + loc);
			}
		}else{
			throw new Q.Error("Travel/map: unknown loc param: " + loc);
		}

		// localy calculate if known lat and lng, to avoid OVER_QUERY_LIMIT
		if(param.location){
			callback(new google.maps.LatLng(param.location.lat, param.location.lng));
			return;
		}

		// calculate location only for placeId and address
		var geocoder = new google.maps.Geocoder;
		geocoder.geocode(param, function (results, status) {
			if (status !== 'OK') {
				throw new Q.Error("Travel/map: Can't geocode " + status);
			}
			if (!results[0]) {
				throw new Q.Error("Travel/map: No place matched " + results);
			}

			callback(results[0].geometry.location);
		});
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
	 * @param {Object} [options.provider='google']
	 */
	geocode: function (loc, callback, options) {
		var o = options || {};
		o.provider = o.provider || 'google';
		if (o.provider !== 'google') {
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
					lat: loc.latitude,
					lng: loc.longitude
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
	"Places/location": "plugins/Places/js/tools/location.js",
	"Places/address": "plugins/Places/js/tools/address.js",
	"Places/globe": "plugins/Places/js/tools/globe.js",
	"Places/countries": "plugins/Places/js/tools/countries.js",
});

})(Q, jQuery, window);
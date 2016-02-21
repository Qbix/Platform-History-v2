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
		var earthRadius = 3963.1676; // in miles

		var sin_lat   = Math.sin(_deg2rad(lat2  - lat1)  / 2.0);
		var sin2_lat  = sin_lat * sin_lat;

		var sin_long  = Math.sin(_deg2rad(long2 - long1) / 2.0);
		var sin2_long = sin_long * sin_long;

		var cos_lat1 = Math.cos(_deg2rad(lat1));
		var cos_lat2 = Math.cos(_deg2rad(lat2));

		var sqrt      = Math.sqrt(sin2_lat + (cos_lat1 * cos_lat2 * sin2_long));
		var distance  = 2.0 * earthRadius * Math.asin(sqrt);

		return distance;
	}


};

Places.Location = {
	/**
	 * @method getUserStream
	 * @static
	 * Get the user's "Places/user/location" stream
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
	"Places/globe": "plugins/Places/js/tools/globe.js",
	"Places/countries": "plugins/Places/js/tools/countries.js"
});

})(Q, jQuery, window);
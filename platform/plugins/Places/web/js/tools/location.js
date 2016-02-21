(function (Q, $, window, document, undefined) {

/**
 * Places Tools
 * @module Places-tools
 */

/**
 * Allows the logged-in user to indicate their location
 * @class Places location
 * @constructor
 * @param {Object} [options] used to pass options
 * @param {Object} [options.map] options for the map
 * @param {Number} [options.map.delay=300] how many milliseconds to delay showing the map, e.g. because the container is animating
 * @param {Q.Event} [options.onUpdate] this event occurs when the location is updated
 * @param {Q.Event} [options.onUnset] this event occurs when the location is unset
 */

Q.Tool.define("Places/location", function (options) {
	var tool = this;
	var state = tool.state;
	if (!Q.Users.loggedInUser) {
		tool.element.style.display = 'none';
		console.warn("Don't render Places/location when user is not logged in");
		return;
	}
	var publisherId = Q.Users.loggedInUser.id;
	var streamName = "Places/user/location";
	
	$(tool.element).addClass('Places_location_checking');
	
	var pipe = Q.pipe(['info', 'show'], function (params) {
		_showMap.apply(this, params.info);
	});
	
	Q.Streams.Stream
	.onRefresh(publisherId, streamName)
	.set(function () {
		var miles = this.get('miles');
		var latitude = this.get('latitude');
		var longitude = this.get('longitude');
		if (miles) {
			tool.$('.Places_location_miles').val(miles);
		};
		pipe.fill('info')(latitude, longitude, miles, state.onUpdate.handle);
		state.stream = this; // in case it was missing before
	});
	
	Q.Streams.retainWith(this)
	.get(publisherId, streamName, function (err) {
		if (!err) {
			var stream = state.stream = this;
			var miles = stream.get('miles');
			var latitude = stream.get('latitude');
			var longitude = stream.get('longitude');
			if (miles) {
				tool.$('.Places_location_miles').val(miles);
			}
		}
		if (!latitude || !longitude || !miles) {
			$(tool.element)
				.removeClass('Places_location_obtained')
				.removeClass('Places_location_checking')
				.addClass('Places_location_obtaining');
			Q.handle(state.onUnset, tool, [err, stream]);
		}
		setTimeout(function () {
			pipe.fill('show')();
		}, state.map.delay);
		
		if (stream && Q.getter.usingCached) {
			stream.refresh();
		}
	});
	
	tool.$('.Places_location_miles').on('change', function () {
		_submit();
	});
	
	tool.$('.Places_location_set, .Places_location_update_button')
	.on(Q.Pointer.click, function () {
		var $this = $(this);
		$this.addClass('Places_obtaining');
		if (!navigator.geolocation) {
			return geolocationFailed();
		}
		var timeout = setTimeout(geolocationFailed, state.timeout);
		var handledFail = false;
		Q.Places.loadGoogleMaps(function () {
			navigator.geolocation.getCurrentPosition(
			function (geo) {
				clearTimeout(timeout);
				if (handledFail) return;
				var geocoder = new google.maps.Geocoder();
				geocoder.geocode({'latLng': {
					lat: geo.coords.latitude,
					lng: geo.coords.longitude
				}}, function(results, status) {
					var country, state, placeName;
					if (status == google.maps.GeocoderStatus.OK && results[0]) {
						country = getComponent(results, 'country');
						state = getComponent(results, 'administrative_area_level_1');
						placeName = getComponent(results, 'locality')
							|| getComponent(results, 'sublocality');
					}
					var fields = Q.extend({
						unsubscribe: true,
						subscribe: true,
						miles: $('select[name=miles]').val(),
						timezone: (new Date()).getTimezoneOffset(),
						placeName: placeName,
						state: state,
						country: country
					}, true, geo.coords);
					Q.req("Places/geolocation", [], 
					function (err, data) {
						Q.Streams.Stream.refresh(
							publisherId, streamName, null,
							{ messages: 1, evenIfNotRetained: true}
						);
						$this.removeClass('Places_obtaining').hide(500);
					}, {method: 'post', fields: fields});
				});
			}, function () {
				clearTimeout(timeout);
				if (handledFail) return;
				geolocationFailed();
			}, {
				maximumAge: 300000,
				timeout: state.timeout
			});
		});
		
		function geolocationFailed() {
			handledFail = true;
			Q.prompt("Please enter your zipcode:",
			function (zipcode, dialog) {
				if (zipcode) {
					_submit(zipcode);
				}
			}, {
				title: "My Location",
				ok: "Update",
				onClose: function () {
					$this.removeClass('Places_obtaining');	
				}
			});
		}
		
		function getComponent(results, desiredType) {
			for (var i = 0; i < results[0].address_components.length; i++) {
				var shortname = results[0].address_components[i].short_name;
				var longname = results[0].address_components[i].long_name;
				var type = results[0].address_components[i].types;
				if (type.indexOf(desiredType) != -1) {
					if (!isNullOrWhitespace(shortname)) {
					    return shortname;
					}
					return longname;
				}
		    }
		}

		function isNullOrWhitespace(text) {
		    if (text == null) {
		        return true;
		    }
		    return text.replace(/\s/gi, '').length < 1;
		}
	});
	
	function _submit(zipcode) {
		Q.req('Places/geolocation', ['attributes'], function (err, data) {
			var msg = Q.firstErrorMessage(err, data && data.errors);
			if (msg) {
				return alert(msg);
			}
			Q.Streams.Stream.refresh(
				publisherId, streamName, null,
				{ messages: 1, evenIfNotRetained: true }
			);
		}, {
			method: 'post',
			fields: {
				subscribe: true,
				unsubscribe: true,
				zipcode: zipcode || '',
				miles: tool.$('.Places_location_miles').val(),
				timezone: (new Date()).getTimezoneOffset() / 60
			}
		});
	}
	
	var previous = {};
	function _showMap(latitude, longitude, miles, callback) {

		if (latitude == undefined
		|| longitude == undefined
		|| !miles) {
			return;
		}
		if (latitude == previous.latitude
		&& longitude == previous.longitude
		&& miles == previous.miles) {
			return;
		}
		previous = {
			latitude: latitude,
			longitude: longitude,
			miles: miles
		};

		Q.Places.loadGoogleMaps(function () {
			$(tool.element)
				.removeClass('Places_location_obtaining')
				.removeClass('Places_location_checking')
				.addClass('Places_location_obtained');
			setTimeout(function () {
				tool.$('.Places_location_map_container').show();
				tool.$('.Places_location_update').slideDown(800);
				setTimeout(function () {
					_showLocationAndCircle();
				}, 300);
			}, 0);
		});

		function _showLocationAndCircle() {
			var element = tool.$('.Places_location_map')[0];
			var map = new google.maps.Map(element, {
				center: new google.maps.LatLng(latitude, longitude),
				zoom: 12 - Math.floor(Math.log(miles) / Math.log(2)),
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				draggable: false,
				panControl: false,
				disableDoubleClickZoom: true,
				zoomControl: false,
				scaleControl: false,
				disableDefaultUI: true,
				scrollwheel: false,
				navigationControl: false
			});
			
			// Create marker 
			var marker = new google.maps.Marker({
			  map: map,
			  position: new google.maps.LatLng(latitude, longitude),
			  title: 'My location'
			});

			// Add circle overlay and bind to marker
			var circle = new google.maps.Circle({
			  map: map,
			  radius: miles*1609.34,
			  fillColor: '#0000AA'
			});
			circle.bindTo('center', marker, 'position');
			
			Q.handle(callback, tool, [latitude, longitude, miles, map]);
		}
	}
},

{ // default options here
	map: {
		delay: 300
	},
	timeout: 10000,
	onUnset: new Q.Event(),
	onUpdate: new Q.Event()
},

{ // methods go here
	
});

})(Q, jQuery, window, document);
(function (Q, $, window, document, undefined) {

/**
 * Places Tools
 * @module Places-tools
 */

var Users = Q.Users;
var Streams = Q.Streams;
var Places = Q.Places;

/**
 * Allows the logged-in user to indicate their location
 * @class Places user location
 * @constructor
 * @param {Object} [options] used to pass options
 * @param {Object} [options.changes] what to do when location changes
 * @param {Boolean|Object} [options.globe] Pass true or options for a Places/globe tool to display a rotating globe instead of a static globe image
 * @param {Number} [options.joinNearby=1] Pass 1 to join to the Places/nearby stream at the new location. Pass 2 to join and subscribe.
 * @param {Number} [options.leaveNearby=2] Pass 1 to unsubscribe from the Places/nearby stream at the old location. Pass 2 to unsubscribe and leave.
 * @param {Number} [options.joinInterests=2] Pass 1 to join to all the local interests at the new location. Pass 2 to join and subscribe.
 * @param {Number} [options.leaveInterests=2] Whether to unsubscribe from all the local interests at the old location. Pass 2 to unsubscribe and leave.
 * @param {Object} [options.meters] object of { meters: title } pairs, by default is generated from Places/nearby/meters config
 * @param {array} [options.defaultMeters] override the key in the meters array to select by default. Defaults to "Places/nearby/defaultMeters" config
 * @param {String} [options.units] second parameter to pass to Places.distanceLabel, default depends on Places.metric
 * @param {Boolean|Object} [options.setMapButton] Pass false here to display a different style of prompt if location isn't obtained yet
 * @param {Object} [options.setMapButton.markers] Options for map markers
 * @param {Number} [options.setMapButton.markers.duration] The duration of the markers animation
 * @param {Number} [options.setMapButton.markers.count] Options for map markers
 * @param {Number} [options.setMapButton.markers.src] Image src for map markers
 * @param {Boolean} [options.setMapButton.markers.multicolor=true] Whether to use markers of multiple colors
 * @param {String} [options.updateButton="Update my location"] override the title of the update button
 * @param {Object} [options.map] options for the map
 * @param {Number} [options.map.delay=300] how many milliseconds to delay showing the map, e.g. because the container is animating
 * @param {Q.Event} [options.onReady] this event occurs when the tool interface is ready
 * @param {Q.Event} [options.onSet] this event occurs when the location is set somehow
 * @param {Q.Event} [options.onUnset] this event occurs when the location is unset
 * @param {Q.Event} [options.onUpdate] this event occurs when the location is updated via the tool
 */

Q.Tool.define("Places/user/location", function (options) {
	var tool = this;
	var state = tool.state;
	var $te = $(tool.element);
	if (!Users.loggedInUser) {
		tool.element.style.display = 'none';
		console.warn("Don't render Places/user/location when user is not logged in");
		return;
	}
	var publisherId = Users.loggedInUser.id;
	var streamName = "Places/user/location";
	
	if (!state.meters) {
		state.meters = {};
		var pnm = Places.nearby.meters;
		for (var i=0, l=pnm.length; i<l; ++i) {
			var m = pnm[i];
			state.meters[m] = Places.distanceLabel(m, state.units);
		}
	}
	if (state.defaultMeters === undefined) {
		state.defaultMeters = Places.nearby.defaultMeters;
	}
	var select = document.createElement('select');
	select.addClass('Places_user_location_meters');
	Q.each(state.meters, function (m, l) {
		var option = document.createElement('option');
		option.setAttribute('value', m);
		option.innerHTML = l;
		if (m == state.defaultMeters) {
			option.setAttribute('selected', 'selected');
		}
		select.appendChild(option);
	});
	
	Q.Text.get('Places/content', function (err, text) {
		state.updateButton = state.updateButton || text.location.update;
		state.map.prompt = (state.map.prompt || text.location.prompt)
			.interpolate({ClickOrTap: Q.text.Q.words.ClickOrTap});
		state.map.set = text.location.set
			.interpolate({ClickOrTap: Q.text.Q.words.ClickOrTap});
		state.interested = text.location.interested.interpolate({
			select: select.outerHTML
		});
		Q.Template.render('Places/user/location', state, function (err, html) {
			Q.replace(tool.element, html);;
			tool.$('.Places_user_location_container')
			.addClass('Places_user_location_checking');
	
			var pipe = Q.pipe(['info', 'show'], function (params) {
				_showMap.apply(this, params.info);
			});
	
			Streams.Stream
			.onRefresh(publisherId, streamName)
			.set(function () {
				var meters = parseFloat(this.getAttribute('meters')) || null;
				var latitude = parseFloat(this.getAttribute('latitude')) || null;
				var longitude = parseFloat(this.getAttribute('longitude')) || null;
				if (meters) {
					tool.$('.Places_user_location_meters').val(meters);
				};
				pipe.fill('info')(latitude, longitude, meters, state.onSet.handle);
				state.stream = this; // in case it was missing before
			});
	
			Streams.retainWith(tool)
			.get(publisherId, streamName, function (err) {
				if (!err) {
					var stream = state.stream = this;
					var meters = stream.getAttribute('meters');
					var latitude = stream.getAttribute('latitude');
					var longitude = stream.getAttribute('longitude');
					if (meters) {
						tool.$('.Places_user_location_meters').val(meters);
					}
				}
				if (!latitude || !longitude || !meters) {
					$te.removeClass('Places_user_location_obtained')
						.addClass('Places_user_location_obtaining');
					$te.find('.Places_user_location_container')
						.removeClass('Places_user_location_checking');
					var m = state.setMapButton;
					if (m) {
						var markers = m.markers || {};
						var $map = $te.find('.Places_user_location_fake_map');
						var rect = $map[0].getBoundingClientRect();
						var w = rect.width / 1.2, h = rect.height / 1.2;
						var markerCount = markers.count || 50;
						var duration = markers.duration || 3000;
						var src = Q.getObject('maps.markers.src', state)
							|| Q.url('{{Places}}/img/marker.svg');
						Q.each(0, markerCount, function () {
							var left = Math.random() * w;
							var top = Math.random() * h;
							var hr = Math.random() * 360;
							var filter = markers.multicolor ? 'hue-rotate('+hr+'deg)' : 'none';
							setTimeout(function () {
								$('<img class="Places_user_location_marker" />').attr({
									src: src
								}).css({
									left: left,
									top: top - 100,
									opacity: 0,
									filter: filter
								}).appendTo($map).animate({
									top: top,
									opacity: 0.8
								});
							}, Math.random() * duration);
						});
						$te.find('.Places_user_location_button')
							.plugin('Q/clickable');
					} else if (state.globe) {
						var globeOptions = Q.isPlainObject(state.globe) ? state.globe : {};
						$('<div />').tool('Places/globe', globeOptions).appendTo(
							tool.$('.Places_user_location_whileObtaining')
						).activate(function () {
							Q.handle(state.onUnset, tool, [err, stream]);
							if (!state.onReady.occurred) {
								Q.handle(state.onReady, tool, [err, stream]);
							}
							this.rotationSpeed(40);
						});
					} else {
						Q.handle(state.onUnset, tool, [err, stream]);
						if (!state.onReady.occurred) {
							Q.handle(state.onReady, tool, [err, stream]);
						}
					}
				}
				setTimeout(function () {
					pipe.fill('show')();
				}, state.map.delay);
		
				if (stream && Q.getter.usingCached) {
					stream.refresh();
				}
			});
	
			tool.$('.Places_user_location_meters').on('change', function () {
				_submit();
			});

			var selectors = [
				'.Places_user_location_set',
				'.Places_user_location_update_button',
				'.Places_globe_tool',
				'.Places_user_location_button'
			];
			$te.on(Q.Pointer.click, selectors.join(','), function () {
				var $this = $(this);
				$this.addClass('Places_obtaining');
				if (!navigator.geolocation) {
					return geolocationFailed();
				}
				var timeout = setTimeout(geolocationFailed, state.timeout);
				var handledFail = false;
				Places.loadGoogleMaps(function () {
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
							_submit(null, Q.extend({
								placeName: placeName,
								state: state,
								country: country
							}, true, geo.coords), function () {
								$this.removeClass('Places_obtaining').hide(300);
							});
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
					Q.Text.get('Places/content', function (err, text) {
						Q.prompt(text.location.enterPostcode,
						function (postcode, dialog) {
							if (postcode) {
								_submit(postcode);
							}
						}, {
							title: "My Location",
							ok: "Update",
							onClose: function () {
								$this.removeClass('Places_obtaining');	
							}
						});
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
		});
	
		function _submit(postcode, fields, callback) {
			fields = Q.extend({}, fields, {
				joinNearby: state.changes.joinNearby,
				joinInterests: state.changes.joinInterests,
				leaveNearby: state.changes.leaveNearby,
				leaveInterests: state.changes.leaveInterests,
				meters: tool.$('.Places_user_location_meters').val(),
				timezone: (new Date()).getTimezoneOffset() / 60,
				defaultMeters: state.defaultMeters
			});
			if (postcode) {
				fields.postcode = postcode;
			}
			Q.req('Places/geolocation', [], function (err, data) {
				var msg = Q.firstErrorMessage(err, data && data.errors);
				if (msg) {
					return alert(msg);
				}
				Streams.Stream.refresh(publisherId, streamName, function () {
					var meters = this.getAttribute('meters');
					var latitude = this.getAttribute('latitude');
					var longitude = this.getAttribute('longitude');
					if (meters) {
						tool.$('.Places_user_location_meters').val(meters);
					};
					if (latitude && longitude) {
						Q.handle(state.onUpdate, tool, [latitude, longitude, meters]);
						Q.handle(callback, tool, [latitude, longitude, meters]);
					}
				}, { 
					messages: 1,
					evenIfNotRetained: true
				});
			}, {
				method: 'post',
				fields: fields
			});
		}
	
		var previous = {};
		function _showMap(latitude, longitude, meters, callback) {

			if (latitude == null || longitude == null || !meters) {
				return;
			}
			if (latitude == previous.latitude
			&& longitude == previous.longitude
			&& meters == previous.meters) {
				return;
			}
			previous = {
				latitude: latitude,
				longitude: longitude,
				meters: meters
			};

			Places.loadGoogleMaps(function () {
				$te.removeClass('Places_user_location_obtaining')
					.addClass('Places_user_location_obtained');
				$te.find('.Places_user_location_container')
					.removeClass('Places_user_location_checking');
				setTimeout(function () {
					tool.$('.Places_user_location_map_container').show();
					tool.$('.Places_user_location_update').slideDown(800);
					setTimeout(function () {
						_showLocationAndCircle();
					}, 300);
				}, 0);
				if (!state.onReady.occurred) {
					Q.handle(state.onReady, tool, [null, state.stream]);
				}
			});

			function _showLocationAndCircle() {
				var element = tool.$('.Places_user_location_map')[0];
				var map = state.map = new google.maps.Map(element, {
					center: new google.maps.LatLng(latitude, longitude),
					zoom: 12 - Math.floor(Math.log(meters/1609.34) / Math.log(2)),
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
				  radius: meters,
				  fillColor: '#0000AA'
				});
				circle.bindTo('center', marker, 'position');
			
				Q.handle(callback, tool, [latitude, longitude, meters, map]);
			}
		}
	});
},

{ // default options here
	updateButton: null,
	setMapButton: {
		markers: {
			src: Q.url('{{Places}}/img/marker.svg'),
			count: 50,
			duration: 3000,
			multicolor: true
		}
	},
	map: {
		delay: 300,
		prompt: null
	},
	globe: true,
	changes: {
		joinNearby: 1,
		joinInterests: 2,
		leaveNearby: 1,
		leaveInterests: 1
	},
	timeout: 10000,
	units: Places.metric ? 'km' : 'miles',
	onReady: new Q.Event(),
	onSet: new Q.Event(),
	onUnset: new Q.Event(),
	onUpdate: new Q.Event()
},

{ // methods go here

});

Q.Template.set('Places/user/location',
	'<div class="Places_user_location_container Places_user_location_checking '
	+ '{{#if globe}}Places_user_location_globe{{else}}Places_user_location_noGlobe{{/if}}'
	+ '">'
		+ '{{{interested}}}'
		+ '<div class="Places_user_location_whileObtaining">'
		+ '{{#if setMapButton}}'
			+ '<div class="Places_user_location_fake_map">'
			+ '</div>'
			+ '<button class="Places_user_location_button">'
				+ '<span>{{{map.set}}}</span>'
			+ '</button>'
		+ '{{else}}'
			+ '<div class="Places_user_location_set Q_aspect_where">'
				+ '<span>{{{map.prompt}}}</span>'
			+ '</div>'
		+ '{{/if}}'
		+ '</div>'
		+ '<div class="Places_user_location_whileObtained">'
			+ '<div class="Places_user_location_map_container">'
				+ '<div class="Places_user_location_map"></div>'
			+ '</div>'
			+ '<div class="Places_user_location_update Places_user_location_whileObtained">'
				+ '<button class="Places_user_location_update_button Q_button">'
					+ '{{updateButton}}'
				+ '</button>'
			+ '</div>'
		+ '</div>'
	+ '</div>'
);

})(Q, Q.$, window, document);
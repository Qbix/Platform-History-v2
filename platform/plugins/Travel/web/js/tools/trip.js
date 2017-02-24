(function (Q, $, window, undefined) {
	
var Users = Q.Users;
var Streams = Q.Streams;
var Places = Q.Places;
var Travel = Q.Travel;

/**
 * Travel Tools
 * @module Travel-tools
 * @main
 */

/**
 * Used to manage a trip and its riders
 * @class Travel trip
 * @constructor
 * @param {Object} [options]
 *   @param {String} options.publisherId
 *   @param {String} options.streamName
 *   @param {Streams.Stream|String} options.fromLocation Provide a Places/location stream, a google placeId, a "latitude,longitude" pair, or an address for reverse geocoding
 *   @param {Streams.Stream|String} options.toLocation Provide a Places/location stream, a google placeId, a "latitude,longitude" pair, or an address for reverse geocoding
 *   @param {HTMLElement} [options.mapElement] You can supply an existing element if you want
 */
Q.Tool.define("Travel/trip", function Users_avatar_tool(options) {
	var tool = this;
	var state = this.state;
	if (!state.publisherId) {
		throw new Q.Error("Travel/trip tool: missing options.publisherId");
	}
	if (!state.fromLocation && !state.toLocation) {
		throw new Q.Error("Travel/trip tool: provide either fromLocation or toLocation");
	}
	tool.refresh();
},

{
	publisherId: null,
	streamName: null,
	fromloc: null,
	toloc: null,
	iconSize: 50,
	mapElement: null,
	templates: {
		trip: {
			dir: 'plugins/Travel/views',
			name: 'Travel/trip',
			fields: { }
		}
	},
	onRefresh: new Q.Event()
},

{
	/**
	 * Refresh the display
	 * @method refresh
	 */
	refresh: function () {
		var tool = this;
		var state = tool.state;
		Q.Places.loadGoogleMaps(function () {
			var properties = ['fromLocation', 'toLocation'];
			var p = Q.pipe(properties, function (params, subjects) {
				if (!state.streamName) {
					_composer(tool, params.fromLocation[0], params.fromLocation[0]);
				} else {
					_player(tool, fromPlace, toPlace);
				}
			});
			Q.each(properties, function (property) {
				var loc = state[property];
				if (!loc) {
					return p.fill(property)(null);
				}
				var param = {};
				if (typeof loc === 'string') {
					var parts = loc.split(',');
					if (parts.length == 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
						param.latlng = {
							lat: parts[0],
							lng: parts[1]
						};
					} else if (loc.indexOf(' ') >= 0) {
						param.address = loc; 
					} else {
						param.placeId = loc;
					}
				} else if (Q.typeOf(loc) === 'Q.Streams.Stream') {
					if (loc.fields.type !== 'Places/location') {
						throw new Q.Error();
					}
					param.latlng = {
						lat: loc.getAttribute('latitude'),
						lng: loc.getAttribute('longitude')
					};
				}
				var geocoder = new google.maps.Geocoder;
				geocoder.geocode(param, function (results, status) {
					if (status !== 'OK') {
						throw new Q.Error("Travel/trip: Can't geocode " + loc);
					}
					if (!results[0]) {
						throw new Q.Error("Travel/trip: No place matched " + loc);
					}
					p.fill(property)(results[0]);
				});
			});
		});
	}
}

);

function _composer(tool, fromPlace, toPlace) {
	var state = tool.state;
	if (!Users.loggedInUser) {
		return console.warn("Travel/trip: user is not logged in");
	}
	var $count = $('<select class="Travel_trip_count" />');
	Q.each(1, 10, function (i) {
		$count.append($('<option />', {value: i}).html(i));
	});
	var fieldName;
	var fromAddress, toAddress, suffix;
	if (toPlace && fromPlace) {
		toAddress = toPlace.formatted_address;
		fromAddress = fromPlace.formatted_address;
	} else if (!fromPlace) {
		fieldName = 'fromLocation';
		suffix = 'from';
		fromAddress = Q.Tool.setUpElementHTML('div', 'Places/address', {}, tool.prefix+suffix);
		toAddress = place.formatted_address;
	} else {
		fieldName = 'toLocation';
		suffix = 'to';
		fromAddress = place.formatted_address;
		toAddress = Q.Tool.setUpElementHTML('div', 'Places/address', {}, tool.prefix+suffix);
	}
	Users.getLabels(Q.Users.loggedInUser.id, 'Users/', function (err, labels) {
		var $labels = $('<select class="Travel_trip_labels" />').append(
			$('<option selected="selected" />', {value: ''}).html('People')
		);
		Q.each(labels, function () {
			$labels.append($('<option />', {value: this.label}).html(this.title));
		});
		Q.Template.render('Travel/trip/composer', {
			src: Q.url('plugins/Places/img/icons/loc/'+state.iconSize+'.png'),
			size: state.iconSize,
			alt: "loc icon",
			fromAddress: fromAddress,
			toAddress: toAddress,
			count: $count[0].outerHTML,
			labels: $labels[0].outerHTML
		}, function (err, html) {
			$(tool.element).html(html).activate(function () {
				var $count = tool.$('.Travel_trip_count').val(4);
				var $labels = tool.$('.Travel_trip_labels');
				
				var $div = tool.$('.Travel_trip_share').css({
					opacity: 0.2,
					'pointer-events': 'none'
				}).plugin('Q/clickable')
				.on(Q.Pointer.click, function () {
					Streams.create({
						type: 'Travel/trip',
						attributes: {
							from: fromAddress,
							to: toAddress,
							maxPeople: $count.val(),
							labels: $labels.val()
						}
					}, function () {
						debugger;
					});
				});
				if (!suffix) {
					return;
				}
				var addressTool = tool.child(suffix);
				addressTool.state.onChoose.set(function (place) {
					$div.css('pointer-events', 'auto').animate({
						opacity: 1
					});
					state[fieldName] = {
						place: place
					};
				});
			});
		}, state.trip);
	});

}

function _player(tool, fromPlace, toPlace) {
	var state = tool.state;
	Streams.get(state.publisherId, state.streamName, function (err) {
		if (err) {
			return;
		}
	});
}

Q.Template.set('Travel/trip/fixedloc', 
	'<table class="Travel_trip_loc"><tr>'
	+ '<td class="Travel_trip_loc_icon">'
	+  '<img src="{{& src}}" alt="{{alt}}" class="Travel_trip_icon Travel_trip_icon_{{size}}">'
	+ '</td>'
	+ '<td class="Travel_trip_loc_address">{{&address}}</td></tr></table>'
);

Q.Template.set('Travel/trip/composer', 
	'<table class="Travel_trip_loc"><tr>'
	+ '<th>From:</th>'
	+ '<td class="Travel_trip_loc_address">{{&fromAddress}}</td>'
	+ '</tr><tr>'
	+ '<th>To:</th>'
	+ '<td class="Travel_trip_loc_address">{{&toAddress}}</td></tr></table>'
	+ '<div class="Travel_trip_offer">'
	+ 'I can offer a ride to at most<br>'
	+ '{{&count}} {{&labels}}'
	+ '</div>'
	+ '<div class="Travel_trip_share">'
	+ '<button class="Q_button Travel_trip_share_button">Share</button>'
	+ '</div>'
);

Q.Template.set('Travel/trip/player', '<img src="{{& src}}" alt="{{alt}}" class="Travel_trip_icon Travel_trip_icon_{{size}}">');

})(Q, jQuery, window);
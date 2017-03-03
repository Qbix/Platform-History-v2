(function (Q, $, window, document, undefined) {

/**
 * Places Tools
 * @module Places-tools
 */

var Users = Q.Users;
var Streams = Q.Streams;
var Places = Q.Places;

Q.text.Places.address = {
	filter: 'Start typing a location...'
};

/**
 * Used to select an address
 * @class Places address
 * @constructor
 * @param {Object} [options] used to pass options
 * @param {Number} [options.latitude] latitude of bias point
 * @param {Number} [options.longitude] longitude of bias point
 * @param {Number} [options.miles] try to find things within this radius
 * @param {String} [options.searchQuery] use this to fill the initial results, if any
 * @param {Number} [options.types] the type to pass to google's nearbySearch
 * @param {Object} [options.filter] Options for the child Q/filter tool
 * @param {HTMLElement} [options.mapElement] You can supply an existing element if you want
 * @param {Q.Event} [options.onChoose] When a valid location is selected. Receives (placeId, details)
 * @param {Q.Event} [options.onError] When there was some kind of error
 */

Q.Tool.define("Places/address", function (options) {
	var tool = this;
	var state = this.state;
	state.mapElement = state.mapElement || $('<div />').appendTo(this.element)[0];
	var p = Q.pipe(['google', 'filter'], function (params, subjects) {
		tool.service = new google.maps.places.PlacesService(state.mapElement);
		tool.refresh();
	});
	Q.Places.loadGoogleMaps(p.fill('google'));
	$('<div />').tool('Q/filter', state.filter)
	.appendTo(tool.element)
	.activate(function () {
		var filter = tool.filter = this;
		filter.state.onFilter.set(function (query, element) {
			var latest = Q.latest(filter);
			_getResults(query, function ($content) {
				if (Q.latest(filter, latest)) {
					$(element).empty().append($content);
				}
			});
		}, tool);
		filter.state.onChoose.set(function (element, obj) {
			var placeId = $(element).attr('placeid');
			var place = tool.place = _places[placeId];
			if (!place) {
				return;
			}
			obj.text = place.name;
			tool.$('.Places_address_text')
			.html(place.description)
			.show();
			Q.handle(state.onChoose, tool, [place, obj]);
		}, tool);
		filter.state.onClear.set(function () {
			tool.$('.Places_address_text').empty().hide();
			tool.place = null;
			Q.handle(state.onChoose, tool, [null]);
		}, tool);
		p.fill('filter')(this);
	});
	$('<div class="Places_address_text "/>').appendTo(tool.element);
},

{ // default options here
	miles: 1000,
	searchQuery: null,
	filter: {
		placeholder: Q.text.Places.address.filter
	},
	mapElement: null,
	onChoose: new Q.Event(),
	onError: new Q.Event()
},

{ // methods go here
	/**
	 * Call this to refresh the tool and the autocomplete
	 * @method refresh
	 * @static
	 * @param {Function} callback
	 */
	refresh: function (callback) {
		if (!this.filter) {
			return false; // not ready yet
		}
		var tool = this;
		var state = tool.state;
		var $te = $(tool.element);
		var miles = state.miles;
		var latitude = state.latitude;
		var longitude = state.longitude;
		var searchQuery = state.searchQuery && state.searchQuery.trim();
		var filter = tool.filter;
		filter.setText('');
		var $results = tool.filter.$results;
		if (!searchQuery) {
			$results.empty();
			return;
		}
		$results.empty().append(
			$('<img class="Places_address_results_loading" />').attr({
				src: 'plugins/Q/img/throbbers/loading.gif'
			})
		);
		if (!latitude || !longitude || !searchQuery) {
			return Q.handle(callback);
		}
		var types = state.types;
		var fields = {
			location: new google.maps.LatLng(latitude, longitude),
			keyword: searchQuery,
			rankBy: google.maps.places.RankBy.DISTANCE 
		};
		if (types) {
			fields.type = Q.first(types);
		}
		var $table = $('<table />').appendTo($results);
		tool.service.nearbySearch(fields, function (places) {
			$('.Places_address_results_loading', $results).hide();
			Q.each(places, function (i, place) {
				var l, d, m, distance, $distance = null;
				if (l = Q.getObject('geometry.location', place)) {
					distance = Q.Places.distance(
						latitude, longitude, l.lat(), l.lng()
					);
					if (distance > miles) {
						return false;
					}
					d = Math.round(distance)+1;
					m = (d === 1 ? ' mi' : ' mi');
					$distance = $('<td class="Places_distance" />')
					.append($('<div />').text(d+m));
				}
				var $name = $('<div class="Places_placeName" />')
				.text(place.name);
				var $description = $('<div class="Places_description" />')
				.text(' ' + place.vicinity);
				var $placeInfo = $('<td class="Places_placeInfo" />')
				.append($name, $description);
				var $tr = $('<tr class="Q_filter_result Places_autocomplete_result" />')
				.append($placeInfo, $distance)
				.attr('placeid', place.place_id)
				.appendTo($table);
				_places[place.place_id] = {
					id: place.place_id,
					name: place.name,
					description: place.vicinity
				};
			});
			Q.handle(callback);
			_results[''] = $results.html();
		});
	}
});

var _results = {};
var _places = {};
function _getResults(query, callback) {
	query = query.trim();
	if (_results[query]) {
		return callback(_results[query]);
	}
	if (!query) {
		return callback('');
	}
	Q.req('Places/autocomplete', 'results',
	function (err, data) {
		var results, msg;
		if (msg = Q.firstErrorMessage(err, data && data.errors)) {
			results = _results[query] = $('<div class="Places_noResults"/>')
				.html("No results");
			callback(results);
			return;
		}
		var $table = $('<table />');
		Q.each(data.slots.results, function (i, prediction) {
			if (prediction.terms.length < 3) {
				return;
			}
			var place = { // a bootleg object just in case we need it
				name: prediction.description.split(',')[0],
				description: prediction.terms[1].value
					+ ', ' + prediction.terms[2].value,
				id: prediction.place_id
			};
			var $name = $('<div class="Places_placeName" />')
			.text(place.name);
			var $description = $('<div class="Places_description" />')
			.text(place.description);
			var $placeInfo = $('<td class="Places_placeInfo" />')
			.append($name, $description);
			var $tr = $('<tr class="Q_filter_result Places_autocomplete_result" />')
			.append($placeInfo)
			.attr('placeid', place.id)
			.appendTo($table);
			_places[place.id] = place;
		});
		results = _results[query] = $table;
		callback(results);
	}, { fields: { input: query }})
}

})(Q, jQuery, window, document);
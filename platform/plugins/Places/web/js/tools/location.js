(function (Q, $, window, document, undefined) {

/**
 * Places Tools
 * @module Places-tools
 */

var Users = Q.Users;
var Streams = Q.Streams;
var Places = Q.Places;

/**
 * Allows the logged-in user to add his own locations and select among these locations
 * @class Places location
 * @constructor
 * @param {Object} [options] used to pass options
 * @param {String} [options.publisherId=Q.Users.loggedInUserId()] Override the publisherId
 *  for saving new locations.
 * @param {Object} [options.geocode] Default google location object, if available
 * @param {Places.Coordinates} [options.location] Provide a location to start off with.
 *  Can be anything that is accepted by Places.Coordinates constructor.
 * @param {Boolean} [options.showCurrent=true] Whether to allow user to select current location
 * @param {Boolean} [options.showLocations=true] Whether to allow user to select their saved locations
 * @param {Boolean} [options.showAddress=true] Whether to allow user to enter a custom address
 * @param {Boolean} [options.showAreas=false] Whether to show Places/areas tool for selected location
 * @param {Q.Event} [options.onChoose] User selected some valid location. First parameter is Places.Coordinates object.
 */
Q.Tool.define("Places/location", function (options) {
	var tool = this;
	var state = this.state;
	var $te = $(tool.element);

	Q.addStylesheet('Q/plugins/Places/css/location.css');

	// change location event
	$te.on(Q.Pointer.click, "[data-location], .Places_location_preview_tool", function () {
		tool.toggle(this);
	});

	tool.Q.onStateChanged('location').set(function () {
		Q.handle(state.onChoose, tool, [state.location]);
	});

	// if showAreas - add Places/areas tool if not exist
	if(state.showAreas){
		state.onChoose.set(function(location){
			var placesAreas = tool.$(".Q_tool.Places_areas_tool")[0];
			placesAreas = placesAreas ? Q.Tool.from(placesAreas, "Places/areas") : null;

			if (Q.isEmpty(location)) {
				if (Q.typeOf(placesAreas) === "Q.Tool") {
					Q.Tool.remove(placesAreas.element);
				}

				return false;
			}

			if (!placesAreas) {
				$("<div>").tool("Places/areas", {
					location: location
				}).appendTo($te).activate();

				return true;
			}

			placesAreas.state.location = location;
			placesAreas.refresh();

			return true;
		}, tool);
	}

	tool.refresh();
},

{ // default options here
	geocode: null,
	onChoose: new Q.Event(function (coordinates) {
		this.state.location = coordinates;
	}, 'Places/location'),
	location: null, // currently selected location
	showCurrent: true,
	showLocations: true,
	showAddress: true,
	showAreas: false
},

{ // methods go here
	/**
	 * Refresh the display
	 * @method refresh
	 */
	refresh: function () {
		var tool = this;
		var state = tool.state;
		var $te = $(tool.element);

		// location empty - render standard location select template
		if (Q.isEmpty(state.location)) {
			tool.selectLocation();
			return;
		}

		// location already set in state - just type it
		Places.Coordinates.from(state.location).geocode(function (err, results) {
			var fem = Q.firstErrorMessage(err);
			if (fem) {
				// if something wrong with location
				// render standard location select template
				tool.selectLocation();

				return console.warn(fem);
			}

			var result = results[0];
			var address = result.formatted_address || result.address;
			$te.html(address).addClass("Q_selected");
			Q.handle(state.onChoose, tool, [this, result.geometry.location]);
		});
	},
	/**
	 * Render template with locations, so user can select one of them
	 * @method selectLocation
	 */
	selectLocation: function(){
		var tool = this;
		var state = tool.state;
		var $te = $(tool.element);
		var userId = Users.loggedInUserId();

		Q.Text.get('Places/content', function (err, text) {
			Q.Template.render('Places/location/select', Q.extend({
				text: text
			}, state), function (err, html) {
				$te.html(html).activate(function () {

					// set address tool
					tool.$(".Places_location_address")
					.tool('Places/address', {
						onChoose: _onChoose
					}, 'Places_address', tool.prefix)
					.activate(function () {
						tool.addressTool = this;
						var $toolParent = $(tool.addressTool.element).closest("[data-location=address]");

						// wait when included Q/filter tool activated
						this.state.onFilterActivated.set(function () {
							// start toggle locations when address tool input focused.
							this.state.onFocus.set(function () {
								tool.toggle($toolParent);
							}, tool);
						}, tool);
					});

					// set showLocations state.
					if (state.showLocations && userId) {
						tool.$(".Places_location_related")
							.tool('Streams/related', {
								publisherId: userId,
								streamName: 'Places/user/locations',
								relationType: 'Places/locations',
								isCategory: true,
								editable: false,
								realtime: true,
								sortable: false
							}, tool.prefix + 'relatedLocations')
							.activate(function () {
								tool.relatedTool = this;
							});
					}

					function _onChoose(place) {
						if (!place || !place.id) {
							return Q.handle(state.onChoose, tool, [null, null]);
						}
						Places.Coordinates.from({
							placeId: place.id
						}).geocode(function (err, results) {
							var msg = Q.firstErrorMessage(err);
							if (msg) {
								throw new Q.Error(msg);
							}

							var result = results[0];
							if (!result || !userId) {
								return;
							}
							var attributes = {
								types: result.types,
								latitude: result.geometry.location.lat(),
								longitude: result.geometry.location.lng(),
								locationType: result.geometry.type,
								venue: place.name
							};
							if (result.place_id) {
								attributes.placeId = result.place_id;
							}
							var textConfirm = text.location.confirm;
							Q.confirm(textConfirm.message, function (shouldSave) {
								if (!shouldSave) {
									return;
								}
								var textAdd = text.location.add;
								Q.prompt(textAdd.title, function (title) {
									if (!title) {
										return;
									}
									var publisherId = state.publisherId || userId;
									Streams.create({
										publisherId: publisherId,
										type: 'Places/location',
										title: title,
										attributes: attributes,
										readLevel: 0,
										writeLevel: 0,
										adminLevel: 0
									}, function (err) {
										if (!err) {
											var sf = this.fields;
											tool.relatedTool.state.onRefresh.setOnce(
											function (previews, map, entering, exiting, updating) {
												var key = Q.firstKey(entering);
												var index = map[key];
												var preview = previews[index];
												Q.Pointer.canceledClick = false;
												tool.toggle(preview.element);
											});
										}
									}, {
										publisherId: userId,
										streamName: 'Places/user/locations',
										type: 'Places/locations'
									});
								}, {
									title: textAdd.title,
									placeholder: textAdd.placeholder,
									ok: textAdd.ok
								});
							}, {
								title: textConfirm.title,
								ok: textConfirm.ok,
								cancel: textConfirm.cancel
							});

							this.venue = place.name;
							var description = place.description;
							if (description.indexOf(',') >= 0) {
								this.venue += description.substr(description.indexOf(','));
							}

							$te.find(".Q_selected").removeClass("Q_selected");
							$(tool.addressTool.element).addClass('Q_selected');
							Q.handle(state.onChoose, tool, [this, result.geometry.location]);
						});
					}
				});
			}, {tool: tool});
		});
	},
	/**
	 * Get current geolocation
	 * @method getCurrentPosition
	 * @param {function} [success] Callback for success
	 * @param {function} [fail] Callback for fail
	 */
	getCurrentPosition: function (success, fail) {
		var tool = this;

		navigator.geolocation.getCurrentPosition(function (pos) {
			Q.handle(success, tool, [pos]);
		}, function (err) {
			Q.handle(fail, tool, [err]);
			Q.alert("Places.location.getCurrentPosition: ERROR(" + err.code + "): " + err.message);

			return false;
		}, {
			enableHighAccuracy: false, // need to set true to make it work consistently, it doesn't seem to make it any more accurate
			timeout: 5000,
			maximumAge: 0
		});
	},
	/**
	 * Make some needed actions when user select some other location.
	 * @method toggle
	 * @param {HTMLElement} elem Selected currently element
	 */
	toggle: function (elem) {
		var tool = this;
		var state = this.state;
		var $te = $(tool.element);
		var $this = $(elem);

		if ($this.hasClass('Q_selected')) {
			return false;
		}

		// toggle Q_selected class
		$te.find(".Q_selected").removeClass("Q_selected");
		$this.addClass('Q_selected');

		var $olt = $this.find(tool.addressTool.element);
		if ($olt.length) {
			$olt.plugin('Q/placeholders', function () {
				tool.addressTool.filter.setText('');
				tool.addressTool.filter.$input.plugin('Q/clickfocus');
			});
		}

		var selector = $this.attr("data-location");
		if (selector === 'current') {
			tool.getCurrentPosition(function (pos) {
				var crd = pos.coords;
				if (!crd) {
					Q.alert("Places/location tool: could not obtain location", pos);
					return false;
				}
				Places.Coordinates.from({
					latitude: crd.latitude,
					longitude: crd.longitude
				}).geocode(function (err, results) {
					var loc = Q.getObject([0, 'geometry', 'location'], results);
					Q.handle(state.onChoose, tool, [this, loc]);
				});
			}, function (err) {
				Q.handle(state.onChoose, tool, [null, null]);
			});

			return;
		} else if (selector === 'address') {
			// if address selected just repeat onChoose event of Places/address tool
			Q.handle(
				tool.addressTool.state.onChoose,
				tool.addressTool,
				[tool.addressTool.place]
			);
			return;
		}

		// related location selected
		var locationPreviewTool = Q.Tool.from($this, "Streams/preview");
		var ls = locationPreviewTool.state;
		Streams.get(ls.publisherId, ls.streamName, function () {
			Places.Coordinates.from(this).geocode(function (err, results) {
				var loc = Q.getObject([0, 'geometry', 'location'], results);
				Q.handle(state.onChoose, tool, [this, loc]);
			});
		});
	}
});

Q.Template.set('Places/location/select',
	'{{#if showCurrent}}' +
		'<div data-location="current">{{text.location.myCurrentLocation}}</div>' +
	'{{/if}}' +
	'{{#if showLocations}}' +
		'<div class="Places_location_related"></div>' +
	'{{/if}}' +
	'{{#if showAddress}}' +
		'<div data-location="address">' +
			'<label>{{text.location.enterAddress}}</label>' +
			'<div class="Places_location_address"></div>' +
		'</div>' +
	'{{/if}}'
);
})(Q, jQuery, window, document);
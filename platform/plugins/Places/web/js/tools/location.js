(function (Q, $, window, document, undefined) {

/**
 * Places Tools
 * @module Places-tools
 */

var Users = Q.Users;
var Streams = Q.Streams;
var Places = Q.Places;

/**
 * Allows the logged-in user to locations to a publisher and select among already added locations
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
 * @param {Object} [options.selectedLocation] Selected location in format:
 * {
 * 		placeId: 'place id string',
 * 		venue: 'Venue string',
 * 		area: 'Area string'
 * 	}, used this location/area
 * as selected when tool loaded.
 * @param {Q.Event} [options.onChoose] User selected some valid location. First parameter is Places.Coordinates object.
 */
Q.Tool.define("Places/location", function (options) {
	var tool = this;
	var state = this.state;
	var $te = $(tool.element);

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
					Q.Tool.remove(placesAreas.element, true, true);
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

		// if defined selected area, select one
		if (Q.getObject("selectedLocation.area", state)) {
			this.element.forEachTool('Places/area/preview', function () {
				var previewTool = this.preview;
				var previewState = this.preview.state;

				// skip composer
				if (!previewState.streamName) {
					return;
				}

				// filter by location
				if (Q.getObject("location.placeId", state) !== Q.getObject("selectedLocation.placeId", state)) {
					return;
				}

				Q.Streams.get(previewState.publisherId, previewState.streamName, function (err) {
					if (err) {
						return;
					}

					if (this.fields.title === state.selectedLocation.area) {
						var filterTool = Q.Tool.from($(previewTool.element).closest(".Places_areas_filter")[0], "Q/filter");
						if (!filterTool) {
							return console.warn("Q/filter tool not found");
						}

						previewState.onLoad.add(function () {
							filterTool.choose(previewTool.element);
						}, tool);
					}
				});
			});
		}
	}

	// set selected location
	if (state.selectedLocation) {
		this.element.forEachTool('Places/location/preview', function () {
			var previewTool = this.preview;
			var previewState = this.preview.state;

			// skip composer
			if (!previewState.streamName) {
				return;
			}

			Q.Streams.get(previewState.publisherId, previewState.streamName, function (err) {
				if (err) {
					return;
				}

				if (this.getAttribute('placeId') === state.selectedLocation.placeId) {
					tool.toggle(previewTool.element);
					state.selectedLocation.selected = true;
				}
			});
		});
	}

	var pipe = new Q.pipe(['styles', 'texts'], tool.refresh.bind(tool));
	Q.addStylesheet('{{Places}}/css/location.css', pipe.fill('styles'));
	Q.Text.get('Places/content', function (err, text) {
		tool.text = text;
		pipe.fill('texts')();
	});
},

{ // default options here
	publisherId: null,
	geocode: null,
	onChoose: new Q.Event(function (coordinates) {
		this.state.location = coordinates;
	}, 'Places/location'),
	location: null, // currently selected location
	selectedLocation: null,
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
		var state = this.state;
		var $te = $(tool.element);
		var userId = state.publisherId || Users.loggedInUserId();

		Q.Template.render('Places/location/select', Q.extend({
			text: tool.text
		}, state), function (err, html) {
			$te.html(html).activate(function () {
				var place = null;
				if (state.selectedLocation) {
					place = {
						id: state.selectedLocation.placeId,
						name: state.selectedLocation.venue
					};
				}

				// set address tool
				tool.$(".Places_location_address").tool('Places/address', {
					onChoose: _onChoose,
					place: place
				}, 'Places_address', tool.prefix).activate(function () {
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
					// if logged user is not a publisher of Places/user/locations
					// need to participate this user to this category to allow
					// get messages about changes
					if (userId !== Users.loggedInUserId()) {
						Streams.Stream.join(userId, 'Places/user/locations');
					}

					tool.$(".Places_location_related").tool('Streams/related', {
						publisherId: userId,
						streamName: 'Places/user/locations',
						relationType: 'Places/locations',
						isCategory: true,
						editable: false,
						realtime: true,
						sortable: false,
						relatedOptions: {
							withParticipant: false
						},
						onRefresh: function () {
							$(this.element).attr("data-loading", "false");
						}
					}, tool.prefix + 'relatedLocations').activate(function () {
						tool.relatedTool = this;
					});
				}

				function _onChoose(place) {
					if (!place || !place.id) {
						return Q.handle(state.onChoose, tool, [null, null]);
					}

					var addressTool = this;

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

						// skip this if selected location
						if (userId === Users.loggedInUserId() && place.id !== Q.getObject("selectedLocation.placeId", state)) {
							var textConfirm = tool.text.location.confirm;
							Q.confirm(textConfirm.message, function (shouldSave) {
								if (!shouldSave) {
									return;
								}
								var textAdd = tool.text.location.add;
								Q.prompt(textAdd.title, function (title) {
									if (!title) {
										return;
									}

									Streams.create({
										publisherId: userId,
										type: 'Places/location',
										title: title,
										attributes: attributes,
										readLevel: 0,
										writeLevel: 0,
										adminLevel: 0
									}, function (err) {
										if (err) {
											return;
										}

										tool.relatedTool.state.onRefresh.setOnce(function (previews, map, entering, exiting, updating) {
											var key = Q.firstKey(entering);
											var index = map[key];
											var preview = previews[index];
											Q.Pointer.canceledClick = false;
											tool.toggle(preview.element);
										});
									}, {
										publisherId: userId,
										streamName: 'Places/user/locations',
										type: 'Places/locations'
									});
								}, {
									title: textAdd.title,
									placeholder: textAdd.placeholder,
									ok: textAdd.ok,
									initialText: place.name
								});
							}, {
								title: textConfirm.title,
								ok: textConfirm.ok,
								cancel: textConfirm.cancel
							});
						}

						// if this placeId already selected in related locations,
						// set selectedLocation.selected=false to allow select this place further
						// and exit, to avoid reset above selection
						if (place.id === Q.getObject("selectedLocation.placeId", state) && Q.getObject("selectedLocation.selected", state)) {
							state.selectedLocation.selected = false;
							return;
						}

						this.venue = place.name;
						var description = place.description;
						if (description && description.indexOf(',') >= 0) {
							this.venue += description.substr(description.indexOf(','));
						}

						$te.find(".Q_selected").removeClass("Q_selected");
						$(addressTool.element).addClass('Q_selected');
						this.stream = null;
						Q.handle(state.onChoose, tool, [this, result.geometry.location]);
					});
				}
			});
		}, {tool: tool});
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
			tool.$('.Q_selected').removeClass('Q_selected');
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
			});
		}

		var selector = $this.attr("data-location");
		if (selector === 'current') {
			$this.addClass('Q_working');
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
					$this.removeClass('Q_working');
				});
			}, function (err) {
				Q.handle(state.onChoose, tool, [null, null]);
				$this.removeClass('Q_working');
			});

			return;
		} else {
			tool.$('[data-location="current"]').removeClass('Q_working');
			if (selector === 'address') {
				// if address selected just repeat onChoose event of Places/address tool
				Q.handle(
					tool.addressTool.state.onChoose,
					tool.addressTool,
					[tool.addressTool.place]
				);
				return;
			}
		}

		// related location selected
		tool.addressTool.filter.setText('');
		var locationPreviewTool = Q.Tool.from($this, "Streams/preview");
		var ls = locationPreviewTool.state;
		Streams.get(ls.publisherId, ls.streamName, function () {
			var locationStream = this;
			Places.Coordinates.from(locationStream).geocode(function (err, results) {
				var loc = Q.getObject([0, 'geometry', 'location'], results);
				this.stream = locationStream;
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
		'<div class="Places_location_related" data-loading="true"></div>' +
	'{{/if}}' +
	'{{#if showAddress}}' +
		'<div data-location="address">' +
			'<label>{{text.location.enterAddress}}</label>' +
			'<div class="Places_location_address"></div>' +
		'</div>' +
	'{{/if}}'
);
})(Q, Q.$, window, document);
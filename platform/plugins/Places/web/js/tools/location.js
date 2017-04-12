(function (Q, $, window, document, undefined) {

	/**
	 * Places Tools
	 * @module Places-tools
	 */

	var Users = Q.Users;
	var Streams = Q.Streams;
	var Places = Q.Places;

	Q.setObject("Q.text.Places.Location", {
		myCurrentLocation: "My current location",
		enterAddress: "Enter an address",
		create: {
			action: "Add Location",
			title: "New Location",
			nameYourLocation: "Name your location"
		}
	});
	Q.setObject("Q.text_en.Places.Location", Q.text.Places.Location);

	/**
	 * Allows the logged-in user to add his own locations and select among these locations
	 * @class Places location
	 * @constructor
	 * @param {Object} [options] used to pass options
	 * @param {object} [options.geocode] Ready google location object
	 * @param {bool} [options.useRelatedLocations] Whether to show related locations
	 * @param {object} [options.location] Currently selected location
	 * @param {Q.Event} [options.onChoose] this event occurs when user selected some valid location
	 */

	Q.Tool.define("Places/location", function (options) {
			var tool = this;
			var state = this.state;
			var $te = $(tool.element);

			Q.addStylesheet('plugins/Places/css/location.css');

			// change location event
			$te.on(Q.Pointer.click, "[data-location], .Places_location_preview_tool", function () {
				var $this = $(this);

				if ($this.hasClass('Q_selected')) {
					return false;
				}

				// set onChoose status to null
				Q.handle(state.onChoose, tool, [null]);

				// toggle Q_selected class
				$te.find(".Q_selected").removeClass("Q_selected");
				$this.addClass("Q_selected");

				var selector = $this.attr("data-location");
				if (selector == 'current') {
					tool.getCurrentPosition(function (pos) {
						var crd = pos.coords;

						// something wrong
						if (!crd) {
							Q.alert("Places/location tool: wrong coords", pos);
							return false;
						}

						// get valid google object and fire onChoose event
						tool.geocode({
							latitude: crd.latitude,
							longitude: crd.longitude
						}, function (geocode) {
							Q.handle(state.onChoose, tool, [geocode]);
						});
					}, function (err) {
						Q.alert("Places/location tool: ERROR(" + err.code + "): " + err.message);
						return false;
					});

					return;
				} else if (selector == 'other') {
					// if "other location" selected just repeat onChoose event of places/address tool
					Q.handle(state.otherLocationTool.state.onChoose, state.otherLocationTool, [state.otherLocationTool.place]);
					return;
				}

				// related location selected
				var locationPreviewTool = Q.Tool.from($this, "Streams/preview");
				Streams.get(locationPreviewTool.state.publisherId, locationPreviewTool.state.streamName, function () {
					// get valid google object and fire onChoose event
					tool.geocode(this, function (geocode) {
						Q.handle(state.onChoose, tool, [geocode]);
					});
				});
			});

			tool.refresh();
		},

		{ // default options here
			geocode: null,
			onChoose: new Q.Event(function (geocode) {
				this.state.location = geocode;
			}, 'Places/location'),
			location: null, // currently selected location
			useRelatedLocations: true
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
				var userId = Users.loggedInUser.id;

				// location already set in state - just type it
				if (state.geocode) {
					if (!state.geocode.formatted_address) {
						Q.alert("Places/location tool: wrong geocode", state.geocode);
						return false;
					}

					$te.html(state.geocode.formatted_address).addClass("Q_selected");
					Q.handle(state.onChoose, tool, [state.geocode.geometry.location]);

					return;
				}

				Q.Template.render('Places/location/select', {
					text: Q.text.Places.Location
				}, function (err, html) {
					$te.html(html).activate(function () {

						// set otherLocation address tool
						tool.$(".Places_location_otherLocation").tool('Places/address', {
							onChoose: function (place) {
								if (place && place.id) {
									// get valid google object and fire onChoose event
									tool.geocode({placeId: place.id}, function (geocode) {
										Q.handle(state.onChoose, tool, [geocode]);
									});

									return;
								}

								Q.handle(state.onChoose, tool, [null]);
							}
						}, tool.prefix + 'otherLocation').activate(function () {
							state.otherLocationTool = this;
						});

						// set related locations if state.
						if (state.useRelatedLocations && userId) {
							tool.$(".Places_location_related").tool('Streams/related', {
								publisherId: userId,
								streamName: 'Places/user/location',
								relationType: 'Places/location',
								isCategory: true,
								creatable: {
									"Places/location": {
										"title": Q.text.Places.Location.create.action,
										"preprocess": function (callback, tool, event) {
											// please see Streams/preview documentation for preprocess option
											Q.Dialogs.push({
												title: Q.text.Places.Location.create.title,
												className: 'Places_location_userLocationsNew',
												template: {
													name: "Places/location/new",
													fields: {
														text: Q.text.Places.Location.create
													}
												},
												onActivate: function () {
													var $this = $(this);
													var button = $this.find('.Q_button[name=submit]');
													var title = $this.find("input[name=title]");
													var _validate = function () {
														var result = true;
														var buttonParent = button.closest(".Places_location_new_actions");
														// title requred
														if (!title.val()) {
															result = false;
														}

														// location required
														if (!Q.getObject(['location', 'place'], $this)) {
															result = false;
														}

														if (result) {
															buttonParent.css('pointer-events', 'auto').animate({opacity: 1});
														} else {
															buttonParent.css('pointer-events', 'none').animate({opacity: 0.2});
														}
													};

													_validate();

													// validate on title change
													title.on("keyup blur change click", _validate);

													// create Places/location tool
													$this.find(".Places_location_new_select").tool('Places/location', {
														useRelatedLocations: false,
														onChoose: function (geocode) {
															Q.setObject(['location', 'place'], geocode, $this);

															// check conditions for submit
															_validate();
														}
													}, tool.prefix + 'relatedLocations').activate();

													button.plugin('Q/clickable').on(Q.Pointer.click, function () {
														var loc = Q.getObject(['location', 'place'], $this);
														var titleVal = title.val();

														if (!titleVal) {
															Q.alert("Places/location/add: Please set title.");
															return false;
														}

														if (!loc) {
															Q.alert("Places/location/add: Please set location.");
															return false;
														}

														callback({
															title: titleVal,
															attributes: {
																latitude: loc.lat(),
																longitude: loc.lng()
															}
														});

														Q.Dialogs.pop();
													})
												},
												onClose: function () {
													callback(false);
												}
											});
										}
									}
								}
							}, tool.prefix + 'relatedLocations').activate();
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
					console.warn("Places.location.getCurrentPosition: ERROR(" + err.code + "): " + err.message);
				}, {
					enableHighAccuracy: true, // need to set true to make it work consistently, it doesn't seem to make it any more accurate
					timeout: 5000,
					maximumAge: 0
				});
			},
			/**
			 * Obtain geocoding definition from a geocoding service
			 * @method geocode
			 * @static
			 * @param {Object} loc Provide a Places/location stream, or an object with either a "placeId" property, a pair of "latitude","longitude" properties, an "address" property for reverse geocoding, or a pair of "userId" and optional "streamName" (which otherwise defaults to "Places/user/location")
			 * @param {Function} callback gets (array of results of the geolocation, and status code)
			 */
			geocode: function (loc, callback) {
				var tool = this;

				if (loc.latitude || loc.longitude) { // if known latitude, longitude - calculate google location local
					if (!loc.latitude) {
						throw new Q.Error(p + "missing latitude");
					}
					if (!loc.longitude) {
						throw new Q.Error(p + "missing longitude");
					}

					// localy calculate if known lat and lng, to avoid requests to google api (danger of OVER_QUERY_LIMIT !!!)
					Q.handle(callback, Places.Location, [new google.maps.LatLng(parseFloat(loc.latitude), parseFloat(loc.longitude)), 'OK']);
					return;
				} else if (typeof loc.lat == 'function' && typeof loc.lng == 'function') { // loc - already google location object
					Q.handle(callback, Places.Location, [loc, 'OK']);
					return;
				}else if(loc.geometry && loc.geometry.location){ // we have standard google location object - return just location
					Q.handle(callback, Places.Location, [loc.geometry.location, 'OK']);
					return;
				}

				// for other loc - call Places plugin
				Places.Location.geocode(loc, function(geocode){
					if(geocode.geometry && geocode.geometry.location){ geocode = geocode.geometry.location; }
					Q.handle(callback, tool, [geocode]);
				});
			}
		}
	);

	Q.Template.set('Places/location/select',
		'<div data-location="current">{{text.myCurrentLocation}}</div>' +
		'<div class="Places_location_related"></div>' +
		'<div data-location="other" class="Q_selected"><label>{{text.enterAddress}}</label><div class="Places_location_otherLocation"></div></div>'
	);

	Q.Template.set("Places/location/new",
		'<div class="Places_location_new">' +
		'	<div class="Places_location_new_title"><input placeholder="{{text.nameYourLocation}}" name="title"></div>' +
		'	<div class="Places_location_new_select"></div>' +
		'	<div class="Places_location_new_actions"><button class="Q_button" name="submit">{{text.action}}</button></div>' +
		'</div>'
	);

})(Q, jQuery, window, document);
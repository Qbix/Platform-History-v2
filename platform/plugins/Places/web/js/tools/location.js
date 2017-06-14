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
		},
		confirm: {
			title: "Save this location?",
			message: "Do you plan to use this location again in the future?",
			ok: 'Yes',
			cancel: 'No'
		},
		add: {
			title: "Name this location",
			placeholder: "Home, Work etc.",
			ok: "Save"
		}
	});
	Q.setObject("Q.text_en.Places.Location", Q.text.Places.Location);

	/**
	 * Allows the logged-in user to add his own locations and select among these locations
	 * @class Places location
	 * @constructor
	 * @param {Object} [options] used to pass options
	 * @param {Object} [options.geocode] Default google location object, if available
	 * @param {Boolean} [options.showCurrent=true] Whether to allow user to select current location
	 * @param {Boolean} [options.showLocations=true] Whether to allow user to select their saved locations
	 * @param {Boolean} [options.showAddress=true] Whether to allow user to enter a custom address
	 * @param {Object} [options.location] Optional selected location to start off with
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
				$this.addClass('Q_selected');
				
				var $olt = $this.find(tool.addressTool.element);
				if ($olt.length) {
					$olt.plugin('Q/placeholders', function () {
						tool.addressTool.filter.setText('');
						tool.addressTool.filter.$input.plugin('Q/clickfocus');
					});
				}

				var selector = $this.attr("data-location");
				if (selector == 'current') {
					tool.getCurrentPosition(function (pos) {
						var crd = pos.coords;
						if (!crd) {
							Q.alert("Places/location tool: could not obtain location", pos);
							return false;
						}
						Places.Coordinates.from({
							latitude: crd.latitude,
							longitude: crd.longitude
						}.geocode(function (err, results) {
							var loc = Q.getObject([0, 'geometry', 'location'], results);
							Q.handle(state.onChoose, tool, [loc, this]);
						});
					}, function (err) {
						Q.alert("Places/location tool: ERROR(" + err.code + "): " + err.message);
						return false;
					});

					return;
				} else if (selector == 'address') {
					// if address selected just repeat onChoose event of places/address tool
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
						Q.handle(state.onChoose, tool, [loc, this]);
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
			showCurrent: true,
			showLocations: true,
			showAddress: true
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
					var address = state.geocode.formatted_address
						|| state.geocode.address;
					if (!address) {
						Q.alert("Places/location tool: wrong geocode", state.geocode);
						return false;
					}

					$te.html(state.geocode.address).addClass("Q_selected");
					Q.handle(state.onChoose, tool, [state.geocode.geometry.location]);

					return;
				}

				Q.Template.render('Places/location/select', Q.extend({
					text: Q.text.Places.Location
				}, state), function (err, html) {
					$te.html(html).activate(function () {

						// set address tool
						tool.$(".Places_location_address")
						.tool('Places/address', {
							onChoose: _onChoose
						}, 'Places_address', tool.prefix)
						.activate(function () {
							tool.addressTool = this;
						});

						// set showLocationsf state.
						if (state.showLocations && userId) {
							tool.$(".Places_location_related")
							.tool('Streams/related', {
								publisherId: userId,
								streamName: 'Places/user/locations',
								relationType: 'Places/locations',
								isCategory: true
							}, tool.prefix + 'relatedLocations')
							.activate(function () {
								tool.relatedTool = this;
							});
						}
						
						function _onChoose(place) {
							if (!place || !place.id) {
								return Q.handle(state.onChoose, tool, [null]);
							}
							Places.Coordinates.from({
								placeId: place.id
							}).geocode(function (err, results) {
								var result = results[0];
								if (!result) {
									return;
								}
								var c = Q.text.Places.Location.confirm;
								Q.confirm(c.message, function (shouldSave) {
									if (!shouldSave) {
										return;
									}
									var a = Q.text.Places.Location.add;
									Q.prompt(a.prompt, function (title) {
										if (!title) {
											return;
										}
										Streams.create({
											type: 'Places/location',
											title: title,
											attributes: {
												types: result.types,
												latitude: result.geometry.location.lat(),
												longitude: result.geometry.location.lng(),
												locationType: result.geometry.type
											},
											readLevel: 0,
											writeLevel: 0,
											adminLevel: 0
										}, function (err) {
											if (!err) {
												tool.relatedTool.refresh();
											}
										}, {
											publisherId: userId,
											streamName: 'Places/user/locations',
											type: 'Places/locations'
										});
									}, {
										title: a.title,
										placeholder: a.placeholder,
										ok: a.ok
									});
								}, {
									title: c.title,
									ok: c.ok,
									cancel: c.cancel
								});
								Q.handle(state.onChoose, tool, [loc, this]);
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
					console.warn("Places.location.getCurrentPosition: ERROR(" + err.code + "): " + err.message);
				}, {
					enableHighAccuracy: true, // need to set true to make it work consistently, it doesn't seem to make it any more accurate
					timeout: 5000,
					maximumAge: 0
				});
			}
		}
	);

	Q.Template.set('Places/location/select',
		'{{#if showCurrent}}' +
			'<div data-location="current">{{text.myCurrentLocation}}</div>' +
		'{{/if}}' +
		'{{#if showLocations}}' +
			'<div class="Places_location_related"></div>' +
		'{{/if}}' +
		'{{#if showAddress}}' +
			'<div data-location="address">' +
				'<label>{{text.enterAddress}}</label>' +
				'<div class="Places_location_address"></div>' +
			'</div>' +
		'{{/if}}'
	);

	Q.Template.set("Places/location/new",
		'<div class="Places_location_new">' +
		'	<div class="Places_location_new_title"><input placeholder="{{text.nameYourLocation}}" name="title"></div>' +
		'	<div class="Places_location_new_select"></div>' +
		'	<div class="Places_location_new_actions"><button class="Q_button" name="submit">{{text.action}}</button></div>' +
		'</div>'
	);

})(Q, jQuery, window, document);
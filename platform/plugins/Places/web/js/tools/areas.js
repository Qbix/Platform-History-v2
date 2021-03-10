(function (Q, $, window, document, undefined) {

	/**
	 * Places Tools
	 * @module Places-tools
	 */

	var Users = Q.Users;
	var Streams = Q.Streams;

	/**
	 * Allows the logged-in user to select/add areas to locations.
	 * Pass either (publisherId,streamName) or (location) options.
	 * @class Places areas
	 * @constructor
	 * @param {Object} options used to pass options
	 * @param {String} options.publisherId Location stream publisher id
	 * @param {String} options.streamName Places/location stream name
	 * @param {String} options.location Location object. It will be used to find Places/location stream.
	 * @param {Places.Coordinates} options.location To relate the areas to
	 */
	Q.Tool.define("Places/areas", function (options) {
			var tool = this;
			var state = this.state;
			var $te = $(tool.element);

			var pipe = new Q.Pipe(['style', 'text'], function (params) {
				tool.refresh();
			});

			Q.addStylesheet('{{Places}}/css/areas.css', function(){
				pipe.fill('style')();
			});

			Q.Text.get('Places/content', function (err, text) {
				state.text = text;

				pipe.fill('text')();
			});

			$te.on(Q.Pointer.click, function () {
				// $te.find('.Places_areas_filter').addClass("Q_selected");
			});
		},

		{ // default options here
			publisherId: null,
			streamName: null,
			location: null,
			areaSelected: null
		},

		{ // methods go here
			/**
			 * Refresh the display
			 * @method refresh
			 */
			refresh: function () {
				var tool = this;
				var state = tool.state;

				// if location defined, try to get publisherId and streamName from it
				state.publisherId = Q.getObject("location.stream.fields.publisherId", state) || Users.communityId;
				state.streamName = Q.getObject("location.stream.fields.name", state);

				// if Q/filter didn't created - create one
				if (!tool.filterTool) {
					var $container = $('<div class="Places_areas_container" />').appendTo(tool.element);
					$("<div class='Places_areas_filter'>").tool('Q/filter', {
						placeholder: state.text.areas.filterPlaceholder
					}, 'Q_filter')
						.appendTo($container)
						.activate(function(){
							tool.filterTool = this;

							// filtering Streams/related tool results
							tool.filterTool.state.onFilter.set(function (query, element) {
								var titles = tool.filterTool.$(".Streams_related_tool .Streams_preview_tool").not(".Streams_preview_composer");

								titles.each(function(){
									var $this = $(this);

									// if title start with query string - show Streams/preview tool element, and hide otherwise
									if ($(".Streams_preview_title", $this).text().toUpperCase().startsWith(query.toUpperCase())) {
										$this.show();
									} else {
										$this.hide();
									}
								});
							}, tool);

							// set selected Places/area stream
							tool.filterTool.state.onChoose.set(function (element, details) {
								var previewTool = Q.Tool.from($(element).closest('.Streams_preview_tool').add(element), "Streams/preview");

								if (!previewTool) {
									return false;
								}

								state.areaSelected = {
									publisherId: previewTool.state.publisherId,
									streamName: previewTool.state.streamName,
									text: details.text
								};
							}, tool);

							// clear selected Places/area stream
							tool.filterTool.state.onClear.set(function () {
								state.areaSelected = null;
							}, tool);

							tool.buildAreas();
						});
				} else {
					// clear Q/filter input
					tool.filterTool.setText('');

					tool.buildAreas();
				}
			},
			/**
			 * Create or refresh Streams/related tool with areas
			 * @method buildAreas
			 */
			buildAreas: function () {
				var tool = this;
				var state = this.state;

				tool.filterTool.element.classList.add("Q_working");
				tool.getStream(function(stream){
					// if related tool already exist - set new stream and refresh
					if (tool.relatedTool) {
						tool.relatedTool.state.publisherId = stream.fields.publisherId;
						tool.relatedTool.state.streamName = stream.fields.name;
						tool.relatedTool.refresh();

						return;
					}

					// apply Streams/related tool exactly to Q/filter results element
					tool.$(".Q_filter_results").tool("Streams/related", {
						publisherId: stream.fields.publisherId,
						streamName: stream.fields.name,
						relationType: 'area',
						isCategory: true,
						editable: false,
						onRefresh: function(){
							// add Q_filter_result class to each preview tool except composer
							$(".Streams_preview_tool:not(.Streams_related_composer)", this.element).addClass("Q_filter_result");
							tool.filterTool.element.classList.remove("Q_working");
						},
						creatable: {
							"Places/area": {
								'title': state.text.areas.newArea,
								'preprocess': function(_proceed){
									tool.prompt(_proceed);
								}
							}
						}
					}).activate(function(){
						tool.relatedTool = this;
					});
				});
			},
			/**
			 * Show Q.prompt to add new area
			 * @method prompt
			 * @param {function} _proceed Callback from Streams/related tool to create new stream
			 */
			prompt: function(_proceed){
				var tool = this;
				var state = this.state;

				var title = tool.filterTool.$input.val() || "";

				var $prompt = Q.prompt(state.text.areas.promptTitle, function (title, dialog) {
					// user click cancel button
					if (title === null) {
						return false;
					}

					// title required
					if (!title) {
						Q.alert(state.text.areas.absent, {
							title: state.text.areas.error,
							onClose: function(){
								tool.prompt(_proceed);
							}
						});
						return false;
					}

					// get array of areas exist
					var areasExist = tool.relatedTool.$(".Streams_preview_title").map(function(){
						return $.trim($(this).text());
					}).get() || [];

					// if title already exist
					if (areasExist.indexOf(title) >= 0) {
						Q.alert(state.text.areas.exist, {
							title: state.text.areas.error,
							onClose: function(){
								tool.prompt(_proceed);
							}
						});
						return false;
					}

					Q.handle(_proceed, null, [{
						title: title,
						publisherId: state.publisherId
					}]);

					// wait when new preview tool created with this title and add class Q_filter_result
					var timerId = setInterval(function(){
						var container = tool.relatedTool.$(".Streams_preview_container .Streams_preview_title:contains('"+title+"')");

						if(!container.length){
							return;
						}

						clearInterval(timerId);

						// set Q_filter_result class to just created area
						var $result = container.closest(".Streams_preview_container").addClass("Q_filter_result");

						// select just created area
						tool.filterTool.choose($result[0])
					}, 500);
				},
				{
					title: state.text.areas.addNewArea,
					ok: state.text.areas.add,
					className: "Places_area_title"
				});

				// set default value
				$("input[type=text]", $prompt).val(title);
			},
			/**
			 * Get location stream and launch callback with this stream as argument
			 * @method getStream
			 * @param {Function} [callback] callback
			 */
			getStream: function(callback){
				var state = this.state;
				var location = state.location;

				// default publisherId to communityId
				if (state.streamName && !state.publisherId) {
					state.publisherId = Users.communityId;
				}

				if (state.publisherId && state.streamName) { // stripped stream means that it have only publisherId and name
					Streams.get(state.publisherId, state.streamName, function () {
						Q.handle(callback, this, [this]);
					});
				} else if(location) {
					// we have just location object and need to check whether stream exist
					// check if we already have location with lat, lng and use one
					// if no - create Places/location stream
					Q.req("Places/areas", 'data', function (err, response) {
						var msg;
						if (msg = Q.firstErrorMessage(err, response && response.errors)) {
							console.warn("Places/areas: " + msg);
							return false;
						}
						var data = response.slots.data;
						Streams.get(data.publisherId, data.streamName, function () {
							Q.handle(callback, this, [this]);
						});
					}, {
						method: 'POST',
						fields: {
							location: {
								latitude: location.latitude,
								longitude: location.longitude,
								venue: location.venue,
								placeId: location.placeId
							}
						}
					});
				} else {
					throw new Exception("Places/areas: required publisherId and streamName, or location");
				}
			}
		});

})(Q, Q.$, window, document);
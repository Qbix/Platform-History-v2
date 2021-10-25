(function (Q, $) {

/**
 * @module Streams-tools
 */

var Users = Q.Users;
var Streams = Q.Streams;

/**
 * Renders a bunch of Stream/preview tools for streams related to the given stream.
 * Has options for adding new related streams, as well as sorting the relations, etc.
 * Also can integrate with Q/tabs tool to render tabs "related" to some category.
 * @class Streams related
 * @constructor
 * @param {Object} [options] options for the tool
 *   @param {String} [options.publisherId] Either this or "stream" is required. Publisher id of the stream to which the others are related
 *   @param {String} [options.streamName] Either this or "stream" is required. Name of the stream to which the others are related
 *   @param {String} [options.tag="div"] The type of element to contain the preview tool for each related stream.
 *   @param {Q.Streams.Stream} [options.stream] You can pass a Streams.Stream object here instead of "publisherId" and "streamName"
 *   @param {String} options.relationType=null The type of the relation.
 *   @param {Boolean} [options.isCategory=true] Whether to show the streams related TO this stream, or the ones it is related to.
 *   @param {Object} [options.relatedOptions] Can include options like 'limit', 'offset', 'ascending', 'min', 'max', 'prefix' and 'fields'
 *   @param {Boolean} [options.editable] Set to false to avoid showing even authorized users an interface to replace the image or text of related streams
 *   @param {Boolean} [options.closeable] Set to false to avoid showing even authorized users an interface to close related streams
 *   @param {Boolean} [options.composerPosition=null] Can be "first" or "last". Where to place composer in a tool. If null, composer arranged by relatedOptions.ascending.
 *   @param {Object} [options.previewOptions] Object of options which can be passed to Streams/preview tool.
 *   @param {Object} [options.specificOptions] Object of options which can be passed to $streamType/preview tool.
 *   @param {Object} [options.creatable]  Optional pairs of {streamType: toolOptions} to render Streams/preview tools create new related streams.
 *   The params typically include at least a "title" field which you can fill with values such as "New" or "New ..."
 *   @param {Function} [options.toolName] Function that takes (streamType, options) and returns the name of the tool to render (and then activate) for that stream. That tool should reqire the "Streams/preview" tool, and work with it as documented in "Streams/preview".
 *   @param {Boolean} [options.realtime=false] Whether to refresh every time a relation is added, removed or updated by anyone
 *   @param {Object|Boolean} [options.sortable] Options for "Q/sortable" jQuery plugin. Pass false here to disable sorting interface. If streamName is not a String, this interface is not shown.
 *   @param {Function} [options.tabs] Function for interacting with any parent "Q/tabs" tool. Format is function (previewTool, tabsTool) { return urlOrTabKey; }
 *   @param {Object} [options.activate] Options for activating the preview tools that are loaded inside
 *   @param {Boolean|Object} [infinitescroll=false] If true or object, activate Q/infinitescroll tool on closer scrolling ancestor (if tool.element non scrollable). If object, set it as Q/infinitescroll params.
 *   @param {Object} [options.updateOptions] Options for onUpdate such as duration of the animation, etc.
 *   @param {Object} [options.beforeRenderPreview] Event occur before Streams/preview tool rendered inside related tool.
 *   If executing result of this handler===false, skip adding this preview tool to the related list.
 *   @param {Q.Event} [options.onUpdate] Event that receives parameters "data", "entering", "exiting", "updating"
 *   @param {Q.Event} [options.onRefresh] Event that occurs when the tool is completely refreshed, the "this" is the tool.
 *      Parameters are (previews, map, entering, exiting, updating).
 */
Q.Tool.define("Streams/related", function _Streams_related_tool (options) {
	// check for required options
	var tool = this;
	var state = this.state;
	if ((!state.publisherId || !state.streamName)
	&& (!state.stream || Q.typeOf(state.stream) !== 'Q.Streams.Stream')) {
		throw new Q.Error("Streams/related tool: missing publisherId or streamName");
	}
	if (!state.relationType) {
		throw new Q.Error("Streams/related tool: missing relationType");
	}
	if (state.sortable === true) {
		state.sortable = Q.Tool.define.options('Q/sortable');
	}
	if (state.sortable && typeof state.sortable !== 'object') {
		throw new Q.Error("Streams/related tool: sortable must be an object or boolean");
	}

	tool.previewElements = {};

	state.publisherId = state.publisherId || state.stream.fields.publisherId;
	state.streamName = state.streamName || state.stream.fields.name;
	
	// save first value of relatedOptions.limit to use it to load more streams
	state.loadMore = Q.getObject("relatedOptions.limit", state);

	if (this.element.classList.contains("Streams_related_participant")) {
		state.mode = "participant";
	} else if (state.mode === "participant" && !this.element.classList.contains("Streams_related_participant")) {
		this.element.classList.add("Streams_related_participant");
	}

	var pipe = new Q.pipe(['styles', 'texts'], tool.refresh.bind(tool));

	// render the tool
	Q.addStylesheet("{{Streams}}/css/tools/related.css", pipe.fill('styles'));
	Q.Text.get('Streams/content', function (err, text) {
		var msg = Q.firstErrorMessage(err);
		if (msg) {
			console.warn(msg);
		}

		tool.text = text;
		pipe.fill('texts')();
	});

	if (state.infinitescroll) {
		var $dummyElement = $("<div>").css("height", $(window).height() * 2).appendTo(tool.element);
		var scrollableElement = this.element.scrollingParent(true, "vertical", true);
		$dummyElement.remove();
		if (!(scrollableElement instanceof HTMLElement) || scrollableElement.tagName === "HTML") {
			return console.warn("Streams/related: scrolligParent for infinitescroll not found");
		}

		$(scrollableElement).tool('Q/infinitescroll', {
			onInvoke: function () {
				var offset = $(">.Streams_preview_tool.Streams_related_stream:visible", tool.element).length;
				var infiniteTool = this;

				// skip duplicated (same offsets) requests
				if (!isNaN(infiniteTool.state.offset) && infiniteTool.state.offset >= offset) {
					return;
				}

				infiniteTool.setLoading(true);
				infiniteTool.state.offset = offset;
				tool.loadMore(state.loadMore, function () {
					infiniteTool.setLoading(false);
				});
			}
		}).activate();
	}

	// observe dom elements for mutation
	tool.domObserver = new MutationObserver(function (mutations) {
		mutations.forEach(function(mutation) {
			if (mutation.type !== 'childList' || Q.isEmpty(mutation.removedNodes)) {
				return;
			}

			mutation.removedNodes.forEach(function(removedElement) {
				var publisherId = Q.getObject("options.streams_preview.publisherId", removedElement);
				var streamName = Q.getObject("options.streams_preview.streamName", removedElement);
				if (!publisherId || !streamName) {
					return;
				}

				delete tool.previewElements[publisherId][streamName];
				if (Q.isEmpty(tool.previewElements[publisherId])) {
					delete tool.previewElements[publisherId];
				}
			});
		});
	});
	tool.domObserver.observe(tool.element, {childList: true});
},

{
	publisherId: Q.info.app,
	isCategory: true,
	relationType: null,
	realtime: false,
	infinitescroll: false,
	composerPosition: null,
	activate: {
		batchSize: {
			start: 20,
			grow: 1.5
		}
	},
	editable: true,
	closeable: true,
	creatable: {},
	sortable: {
		draggable: '.Streams_related_stream',
		droppable: '.Streams_related_stream'
	},
	previewOptions: {},
	tabs: function (previewTool, tabsTool) {
		return Streams.key(previewTool.state.publisherId, previewTool.state.streamName);
	},
	toolName: function (streamType) {
		return streamType+'/preview';
	},
	beforeRenderPreview: new Q.Event(function (tff) {
		var alreadyExists = false;
		$(".Streams_preview_tool", this.element).each(function () {
			var publisherId = this.getAttribute("data-publisherId");
			var streamName = this.getAttribute("data-streamName");
			var streamType = this.getAttribute("data-streamType");
			if (publisherId === tff.publisherId && streamName === tff.name && streamType === tff.type) {
				alreadyExists = true;
			}
		});
		return !alreadyExists;
	}, "Streams/related"),
	onUpdate: new Q.Event(
	function _Streams_related_onUpdate(result, entering, exiting, updating) {
		function _placeRelatedTool (element) {
			// select closest larger weight
			var closestLargerWeight = null;
			var closestLargerElement = null;
			var elementsAmount = 0;
			var thisWeight = Q.getObject("options.streams_preview.related.weight", element);
			Q.each(tool.previewElements, function () {
				Q.each(this, function () {
					var weight = Q.getObject("options.streams_preview.related.weight", this);
					if (weight > thisWeight && (!closestLargerWeight || weight < closestLargerWeight)) {
						closestLargerWeight = weight;
						closestLargerElement = this;
					}
					elementsAmount++;
				});
			});

			if (closestLargerElement) {
				if (ascending) {
					$(closestLargerElement).before(element);
				} else {
					$(closestLargerElement).after(element);
				}
			} else if (state.composerPosition && elementsAmount === 1) {
				if (state.composerPosition === "first") {
					$container.append(element);
				} else if (state.composerPosition === "last") {
					$container.prepend(element);
				}
			} else {
				if (ascending) {
					if (elementsAmount === 1) {
						$container.append(element);
					} else {
						$(".Streams_related_stream:last", $container).after(element);
					}
				} else {
					if (elementsAmount === 1) {
						$container.prepend(element);
					} else {
						$(".Streams_related_stream:first", $container).before(element);
					}
				}
			}
		};

		function addComposer(streamType, params) {
			// TODO: test whether the user can really create streams of this type
			// and otherwise do not append this element
			if (params && !Q.isPlainObject(params)) {
				params = {};
			}
			params.streamType = streamType;

			var tff = {
				publisherId: params.publisherId || tool.state.publisherId,
				name: "",
				type: streamType,
				previewOptions: Q.extend(state.previewOptions, { creatable: params }),
				specificOptions: state.specificOptions
			};

			var element = tool.elementForStream(
				tff.publisherId, tff.name, tff.type, null, tff.previewOptions, tff.specificOptions
			).addClass('Streams_related_composer Q_contextual_inactive');

			if (Q.handle(state.beforeRenderPreview, tool, [tff, element]) === false) {
				return;
			}

			if (tool.tabs) {
				element.addClass('Q_tabs_tab');
			}

			if (state.composerPosition) {
				if (state.composerPosition === "first") {
					$container.prepend(element);
				} else if (state.composerPosition === "last") {
					$container.append(element);
				}
			} else {
				if (ascending) {
					$container.prepend(element);
				} else {
					$container.append(element);
				}
			}

			Q.activate(element, function () {
				var preview = Q.Tool.from(element, 'Streams/preview');
				var previewState = preview.state;
				tool.integrateWithTabs([element], true);
				previewState.beforeCreate.set(function () {
					$(this.element).addClass('Streams_related_loading').removeClass('Streams_related_composer');
					previewState.beforeCreate.remove(tool);
				}, tool);
				previewState.onCreate.set(function (stream) {
					// set data-streamName attribute to mark tool as not composer
					element.setAttribute("data-streamName", stream.fields.name);

					// set weight to element
					Q.setObject("options.streams_preview.related.weight", this.state.related.weight, element);

					// place new preview to the valid place in the list
					_placeRelatedTool(element);

					addComposer(streamType, params);
				}, tool);

				Q.handle(state.onComposer, tool, [preview]);
			});
		}
		
		var tool = this;
		var state = tool.state;
		var $te = $(tool.element);
		var $container = $te;
		var isTabs = $te.hasClass('Q_tabs_tool');
		if (isTabs) {
			$container = $te.find('.Q_tabs_tabs');
		}

		var ascending = Q.getObject("ascending", state.relatedOptions) || false;

		if (result.stream.testWriteLevel('relate')) {
			Q.each(state.creatable, addComposer);
			if (state.sortable && result.stream.testWriteLevel('edit')) {
				if (state.realtime) {
					alert("Streams/related: can't mix realtime and sortable options yet");
					return;
				}
				var sortableOptions = Q.extend({}, state.sortable);
				var $t = tool.$();
				$t.plugin('Q/sortable', sortableOptions, function () {
					$t.state('Q/sortable').onSuccess.set(function ($item, data) {
						if (!data.direction) return;
						var p = new Q.Pipe(['timeout', 'updated'], function () {
							if (state.realtime) return;
							Streams.related.cache.removeEach(
								[state.publisherId, state.streamName]
							);
							// TODO: replace with animation?
							tool.refresh();
						});
						var s = Q.Tool.from(data.target, 'Streams/preview').state;
						var i = Q.Tool.from($item[0], 'Streams/preview').state;
						var r = i.related;
						setTimeout(
							p.fill('timeout'),
							this.state('Q/sortable').drop.duration
						);
						Streams.updateRelation(
							r.publisherId,
							r.streamName,
							r.type,
							i.publisherId,
							i.streamName,
							s.related.weight,
							1,
							p.fill('updated')
						);
					}, tool);
				});
			}
		}

		// remove exiting previews
		Q.each(exiting, function (i) {
			var publisherId = this.fields.publisherId;
			var streamName = this.fields.name;
			var element = Q.getObject([publisherId, streamName], tool.previewElements);

			if (!element) {
				return;
			}

			Q.removeElement(element, true);
		});

		var elements = [];
		Q.each(result.relations, function (i) {
			if (!this.from) {
				return;
			}

			var tff = this.from.fields;

			// if element exists - do nothing
			if (Q.getObject([tff.publisherId, tff.name], tool.previewElements)) {
				return;
			}

			var element = tool.elementForStream(
				tff.publisherId, 
				tff.name, 
				tff.type,
				this.weight,
				state.previewOptions
			);

			if (Q.handle(state.beforeRenderPreview, tool, [tff, element]) === false) {
				return;
			}

			elements.push(element);
			$(element).addClass('Streams_related_stream');
			Q.setObject([tff.publisherId, tff.name], element, tool.previewElements);

			_placeRelatedTool(element);
		});

		// activate the elements one by one, asynchronously
		var previews = [];
		var map = {};
		var i=0;
		var batchSize = state.activate.batchSize.start;
		setTimeout(function _activatePreview() {
			var elementsToActivate = [];
			var _done = false;
			for (var j=0; j<batchSize; ++j) {
				var element = elements[i++];
				if (element) {
					elementsToActivate.push(element);
				} else {
					_done = true;
					break;
				}
			}
			batchSize *= state.activate.batchSize.grow;
			Q.activate(elementsToActivate, null, function (elem, tools, options) {
				Q.each(tools, function () {
					var index = previews.push(this) - 1;
					var publisherId = Q.getObject("preview.state.publisherId", this);
					var streamName = Q.getObject("preview.state.streamName", this);

					if (!publisherId || !streamName) {
						return;
					}

					var key = Streams.key(publisherId, streamName);
					map[key] = index;
				});
				tool.integrateWithTabs(elem, true);
				if (_done) {
					if (tool.tabs) {
						tool.tabs.refresh();
					}
					tool.state.onRefresh.handle.call(tool, previews, map, entering, exiting, updating);
					return;
				}
				setTimeout(_activatePreview, 0);
			});
		}, 0);
		// The elements should animate to their respective positions, like in D3.

	}, "Streams/related"),
	onRefresh: new Q.Event()
},

{
	/**
	 * Call this method to refresh the contents of the tool, requesting only
	 * what's needed and redrawing only what's needed.
	 * @method refresh
	 * @param {Function} onUpdate An optional callback to call after the update has completed.
	 *  It receives (result, entering, exiting, updating) arguments.
	 *  The child tools may still be refreshing after this. If you want to call a function
	 *  after they have all refreshed, use the tool.state.onRefresh event.
	 */
	refresh: function (onUpdate) {
		var tool = this;
		var state = tool.state;
		var publisherId = state.publisherId || Q.getObject("stream.fields.publisherId", state);
		var streamName = state.streamName || Q.getObject("stream.fields.name", state);

		Streams.retainWith(tool).related(
			publisherId, 
			streamName, 
			state.relationType, 
			state.isCategory, 
			state.relatedOptions,
			function (errorMessage) {
				if (errorMessage) {
					return console.warn("Streams/related refresh: " + errorMessage);
				}

				tool.relatedResult(this, onUpdate);
			}
		);
	},
	/**
	 * Process related results
	 * @method relatedResult
	 * @param {Object} result related result
	 * @param {function} onUpdate callback executed when updated
	 * @param {boolean} partial Flag indicated that loaded partial data. This case no need to compare streams for exiting.
	 */
	relatedResult: function (result, partial, onUpdate) {
		var tool = this;

		if (typeof arguments[1] === "function") {
			onUpdate = arguments[1];
			partial = false;
		}

		var entering, exiting, updating;
		entering = exiting = updating = null;
		function comparator(s1, s2, i, j) {
			return s1 && s2 && s1.fields && s2.fields
				&& s1.fields.publisherId === s2.fields.publisherId
				&& s1.fields.name === s2.fields.name;
		}
		var tsr = tool.state.result;
		if (tsr) {
			if (!partial) {
				exiting = Q.diff(tsr.relatedStreams, result.relatedStreams, comparator);
			}
			entering = Q.diff(result.relatedStreams, tsr.relatedStreams, comparator);
			updating = Q.diff(result.relatedStreams, entering, exiting, comparator);
		} else {
			exiting = updating = [];
			entering = result.relatedStreams;
		}
		tool.state.onUpdate.handle.apply(tool, [result, entering, exiting, updating]);
		Q.handle(onUpdate, tool, [result, entering, exiting, updating]);

		// Now that we have the stream, we can update the event listeners again
		var dir = tool.state.isCategory ? 'To' : 'From';
		var eventNames = ['onRelated'+dir, 'onUnrelated'+dir, 'onUpdatedRelate'+dir];
		if (tool.state.realtime) {
			Q.each(eventNames, function (i, eventName) {
				result.stream[eventName]().set(function (msg, fields) {
					// TODO: REPLACE THIS WITH AN ANIMATED UPDATE BY LOOKING AT THE ARRAYS entering, exiting, updating
					var isCategory = tool.state.isCategory;
					if (fields.type !== tool.state.relationType) {
						return;
					}
					if (!Users.loggedInUser
						|| msg.byUserId != Users.loggedInUser.id
						|| msg.byClientId != Q.clientId()
						|| msg.ordinal !== tool.state.lastMessageOrdinal + 1) {
						tool.refresh();
					} else {
						tool.refresh(); // TODO: make the weights of the items in between update in the client
					}
					tool.state.lastMessageOrdinal = msg.ordinal;
				}, tool);
			});
		} else {
			Q.each(eventNames, function (i, eventName) {
				result.stream[eventName]().remove(tool);
			});
		}
		tool.state.result = Q.extend(tool.state.result, 2, result, 2);
		tool.state.lastMessageOrdinal = result.stream.fields.messageCount;
	},
	/**
	 * Request part of related data and add previews
	 * @method loadMore
	 * @param {Integer} amount How much elements to load
	 * @param {function} onUpdate callback executed when updated
	 */
	loadMore: function (amount, onUpdate) {
		var tool = this;
		var state = tool.state;
		var publisherId = state.publisherId || Q.getObject("stream.fields.publisherId", state);
		var streamName = state.streamName || Q.getObject("stream.fields.name", state);

		var limit = Q.getObject("relatedOptions.limit", state);
		if (!limit) {
			throw new Q.Error("Streams/related/loadMore: limit undefined, no sense to use loadMore, because all items loaded");
		}

		var options = Q.extend({}, state.relatedOptions, {
			offset: limit,
			limit: amount
		});

		Streams.retainWith(tool).related(
			publisherId,
			streamName,
			state.relationType,
			state.isCategory,
			options,
			function (errorMessage) {
				if (errorMessage) {
					return console.warn("Streams/related refresh: " + errorMessage);
				}

				tool.relatedResult(this, true, onUpdate);

				state.relatedOptions.limit += amount;
			}
		);
	},
	/**
	 * Some time need to remove relation when user doesn't participated to stream (hence doesn't get unrelatedTo message).
	 * @method removeRelation
	 * @param {String } publisherId
	 * @param {String} streamName
	 */
	removeRelation: function (publisherId, streamName) {
		var result = this.state.result;

		var previewTools = this.children("Streams/preview");
		Q.each(previewTools, function (i, previewTool) {
			previewTool = Q.getObject("streams_preview", previewTool);

			if (!previewTool) {
				return console.warn("Streams/related.removeRelation: Streams/preview tool not found");
			}

			if (previewTool.state.publisherId !== publisherId || previewTool.state.streamName !== streamName) {
				return;
			}

			Q.Tool.remove(previewTool.element, true, true);

			// delete from relatedStreams
			delete result.relatedStreams[publisherId + "\t" + streamName];

			// delete from relations
			Q.each(result.relations, function (j, relation) {
				if (relation.fromPublisherId === publisherId && relation.fromStreamName === streamName) {
					result.relations.splice(j, 1);
				}
			})
		});
	},
	/**
	 * You don't normally have to call this method, since it's called automatically.
	 * Sets up an element for the stream with the tag and toolName provided to the
	 * Streams/related tool. Also populates "publisherId", "streamName" and "related" 
	 * options for the tool.
	 * @method elementForStream
	 * @param {String } publisherId
	 * @param {String} streamName
	 * @param {String} streamType
	 * @param {Number} weight The weight of the relation
	 * @param {Object} [previewOptions]
	 *  Options for the Streams/preview tool
	 * @param {Object} [specificOptions]
	 *  Options for the $streamType/preview tool
	 * @return {HTMLElement} An element ready for Q.activate
	 */
	elementForStream: function (
		publisherId, streamName, streamType, weight, 
		previewOptions, specificOptions
	) {
		var tool = this;
		var state = this.state;
		var o = Q.extend({
			publisherId: publisherId,
			streamName: streamName,
			related: {
				publisherId: state.publisherId,
				streamName: state.streamName,
				type: state.relationType,
				weight: weight
			},
			editable: state.editable,
			closeable: state.closeable
		}, previewOptions);
		var f = state.toolName;
		if (typeof f === 'string') {
			f = Q.getObject(state.toolName) || f;
		}
		var toolName = (typeof f === 'function') ? f(streamType, o) : f;
		var toolNames = ['Streams/preview', toolName];
		var toolOptions = [o, specificOptions || {}];

		if (state.mode === "participant" && state.closeable && publisherId && streamName) {
			toolNames.push("Q/badge");
			toolOptions.push({
				tr: {
					size: "24px",
					right: "-10px",
					top: "-5px",
					className: "Streams_preview_close",
					display: 'block',
					onClick: function (e) {
						e.preventDefault();
						e.stopPropagation();

						var $element = $(this).closest(".Streams_preview_tool");

						$element.addClass('Q_working');
						Q.confirm(tool.text.participating.AreYouSureRemoveParticipant, function (res) {
							if (!res) {
								return $element.removeClass('Q_working');
							}

							Streams.unrelate(state.publisherId, state.streamName, state.relationType, publisherId, streamName, function (err) {
								$element.removeClass('Q_working');
								if (err) {
									return console.warn(err);
								}

								tool.removeRelation(publisherId, streamName);
							});
						}, {title: tool.text.participating.RemoveParticipant});

						return false;
					}
				}
			});
		}

		var e = Q.Tool.setUpElement(
			state.tag || 'div', 
			toolNames,
			toolOptions,
			null, this.prefix
		);
		// we need these attributes to check if this preview tool already exists to avoid doublicated previews
		e.setAttribute('data-publisherId', publisherId);
		e.setAttribute('data-streamName', streamName);
		e.setAttribute('data-streamType', streamType);
 		return e;
	},

	/**
	 * You don't normally have to call this method, since it's called automatically.
	 * It integrates the tool with a Q/tabs tool on the same element or a parent element,
	 * turning each Streams/preview of a related stream into a tab.
	 * @method integrateWithTabs
	 * @param elements
	 *  The elements of the tools representing the related streams
	 */
	integrateWithTabs: function (elements, skipRefresh) {
		var id, tabs, i;
		var tool = this;
		var state = tool.state;
		if (typeof state.tabs === 'string') {
			state.tabs = Q.getObject(state.tabs);
			if (typeof state.tabs !== 'function') {
				throw new Q.Error("Q/related tool: state.tabs does not refer to a function");
			}
		}
		var t = tool;
		if (!tool.tabs) {
			do {
				tool.tabs = t.sibling('Q/tabs');
				if (tool.tabs) {
					break;
				}
			} while (t = t.parent());
		}
		if (!tool.tabs) {
			return;
		}
		tabs = tool.tabs;
		var $composer = tool.$('.Streams_related_composer');
		$composer.addClass('Q_tabs_tab');
		Q.each(elements, function (i) {
			var element = this;
			element.addClass("Q_tabs_tab");
			var preview = Q.Tool.from(element, 'Streams/preview');
			var key = preview.state.onRefresh.add(function () {
				var value = state.tabs.call(tool, preview, tabs);
				var attr = value.isUrl() ? 'href' : 'data-name';
				element.setAttribute(attr, value);
				if (!tabs.$tabs.is(element)) {
					tabs.$tabs = tabs.$tabs.add(element);
				}
				var onLoad = preview.state.onLoad;
				if (onLoad) {
					onLoad.add(function () {
						// all the related tabs have loaded, process them
						tabs.refresh();
					});
				}
				preview.state.onRefresh.remove(key);
			});
			var key2 = preview.state.onComposer.add(function () {
				tabs.refresh();
			});
		});
		if (!skipRefresh) {
			tabs.refresh();
		}
	},
	previewElement: function (publisherId, streamName) {
		return Q.getObject([publisherId, streamName], this.previewElements);
	},
	previewTool: function (publisherId, streamName) {
		return Q.getObject([publisherId, streamName, 'Q', 'tool'], this.previewElements);
	},
	Q: {
		beforeRemove: function () {
			$(this.element).plugin('Q/sortable', 'remove');
			this.state.onUpdate.remove("Streams/related");
			this.domObserver.disconnect();
		}
	}
}

);

})(Q, jQuery);

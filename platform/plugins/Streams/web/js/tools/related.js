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
 *   @param {Object} [options.creatable]  Optional pairs of {streamType: toolOptions} to render Streams/preview tools create new related streams.
 *   The params typically include at least a "title" field which you can fill with values such as "New" or "New ..."
 *   @param {Function} [options.toolName] Function that takes (streamType, options) and returns the name of the tool to render (and then activate) for that stream. That tool should reqire the "Streams/preview" tool, and work with it as documented in "Streams/preview".
 *   @param {Boolean} [options.realtime=false] Whether to refresh every time a relation is added, removed or updated by anyone
 *   @param {Object} [options.sortable] Options for "Q/sortable" jQuery plugin. Pass false here to disable sorting interface. If streamName is not a String, this interface is not shown.
 *   @param {Function} [options.tabs] Function for interacting with any parent "Q/tabs" tool. Format is function (previewTool, tabsTool) { return urlOrTabKey; }
 *   @param {Object} [options.updateOptions] Options for onUpdate such as duration of the animation, etc.
 *   @param {Q.Event} [options.onUpdate] Event that receives parameters "data", "entering", "exiting", "updating"
 *   @param {Q.Event} [options.onRefresh] Event that occurs when the tool is completely refreshed, the "this" is the tool
 */
Q.Tool.define("Streams/related", function _Streams_related_tool (options) {
	// check for required options
	var state = this.state;
	if ((!state.publisherId || !state.streamName)
	&& (!state.stream || Q.typeOf(state.stream) !== 'Streams.Stream')) {
		throw new Q.Error("Streams/related tool: missing publisherId or streamName");
	}
	if (!state.relationType) {
		throw new Q.Error("Streams/related tool: missing relationType");
	}
	if (state.sortable && typeof state.sortable !== 'object') {
		throw new Q.Error("Streams/related tool: sortable must be an object or false");
	}

	state.publisherId = state.publisherId || state.stream.fields.publisherId;
	state.streamName = state.streamName || state.stream.fields.streamName;
	
	state.refreshCount = 0;

	// render the tool
	this.refresh();
},

{
	publisherId: Q.info.app,
	isCategory: true,
	relationType: null,
	realtime: false,
	editable: true,
	closeable: true,
	creatable: {},
	sortable: {
		draggable: '.Streams_related_stream',
		droppable: '.Streams_related_stream'
	},
	tabs: function (previewTool, tabsTool) {
		return Streams.key(previewTool.state.publisherId, previewTool.state.streamName);
	},
	toolName: function (streamType) {
		return streamType+'/preview';
	},
	onUpdate: new Q.Event(
	function _Streams_related_onUpdate(result, entering, exiting, updating) {
		function addComposer(streamType, params, creatable, oldElement) {
			// TODO: test whether the user can really create streams of this type
			// and otherwise do not append this element
			if (params && !Q.isPlainObject(params)) {
				params = {};
			}
			params.streamType = streamType;
			var element = tool.elementForStream(
				tool.state.publisherId, "", streamType, null, 
				{ creatable: params }
			).addClass('Streams_related_composer Q_contextual_inactive');
			if (tool.tabs) {
				element.addClass('Q_tabs_tab');
			}
			if (oldElement) {
				$(oldElement).before(element);
				var $last = tool.$('.Streams_related_composer:last');
				if ($last.length) {
					$(oldElement).insertAfter($last);
				}
			} else {
				var $prev = $container.find('.Streams_related_stream:first').prev();
				if ($prev.length) {
					$prev.after(element);
				} else {
					$container.append(element);
				}
			}
			Q.activate(element, function () {
				var rc = tool.state.refreshCount;
				var preview = Q.Tool.from(element, 'Streams/preview');
				var ps = preview.state;
				tool.integrateWithTabs([element], true);
				preview.state.beforeCreate.set(function () {
					// workaround for now
					if (tool.state.refreshCount > rc) {
						return;
					}
					$(this.element)
						.addClass('Streams_related_loading')
						.removeClass('Streams_related_composer');
					addComposer(streamType, params, null, element);
					ps.beforeCreate.remove(tool);
				}, tool);
				preview.state.onCreate.set(function () {
					$(this.element)
						.removeClass('Streams_related_loading')
						.removeClass('Streams_related_composer')
						.addClass('Streams_related_stream');
					ps.onCreate.remove(tool);
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
		Q.removeElement($container.find('.Streams_preview_tool'), true);
		++state.refreshCount;
		
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
		
		tool.previewElements = {};
		var elements = [];
		Q.each(result.relations, function (i) {
			if (!this.from) return;
			var tff = this.from.fields;
			var element = tool.elementForStream(
				tff.publisherId, 
				tff.name, 
				tff.type, 
				this.weight
			);
			elements.push(element);
			$(element).addClass('Streams_related_stream');
			Q.setObject([tff.publisherId, tff.name], element, tool.previewElements);
			$container.append(element);
		});
		// activate the elements one by one, asynchronously
		var previews = [];
		var map = {};
		var i=0;
		setTimeout(function _activatePreview() {
			var element = elements[i++];
			if (!element) {
				if (tool.tabs) {
					tool.tabs.refresh();
				}
				tool.state.onRefresh.handle.call(tool, previews, map, entering, exiting, updating);
				return;
			}
			Q.activate(element, null, function () {
				var index = previews.push(this) - 1;
				var key = Streams.key(this.state.publisherId, this.state.streamName);
				map[key] = index;
				tool.integrateWithTabs([element], true);
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
		var publisherId = state.publisherId;
		var streamName = state.streamName;
		Streams.retainWith(tool).related(
			publisherId, 
			streamName, 
			state.relationType, 
			state.isCategory, 
			state.relatedOptions,
			relatedResult
		);
		
		function relatedResult(errorMessage) {
			if (errorMessage) {
				console.warn("Streams/related refresh: " + errorMessage);
				return;
			}
			var result = this;
			var entering, exiting, updating;
			entering = exiting = updating = null;
			function comparator(s1, s2, i, j) {
				return s1 && s2 && s1.fields && s2.fields
					&& s1.fields.publisherId === s2.fields.publisherId
					&& s1.fields.name === s2.fields.name;
			}
			var tsr = tool.state.result;
			if (tsr) {
				exiting = Q.diff(tsr.relatedStreams, result.relatedStreams, comparator);
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
					result.stream[eventName]().set(onChangedRelations, tool);
				});
			} else {
				Q.each(eventNames, function (i, eventName) {
					result.stream[eventName]().remove(tool);
				});
			}
			tool.state.result = result;
			tool.state.lastMessageOrdinal = result.stream.fields.messageCount;
		}
		function onChangedRelations(msg, fields) {
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
		}
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
	 * @param {Object} options
	 *  The elements of the tools representing the related streams
	 * @return {HTMLElement} An element ready for Q.activate
	 */
	elementForStream: function (publisherId, streamName, streamType, weight, options) {
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
		}, options);
		var f = state.toolName;
		if (typeof f === 'string') {
			f = Q.getObject(state.toolName) || f;
		}
		var toolName = (typeof f === 'function') ? f(streamType, o) : f;
		var e = Q.Tool.setUpElement(
			state.tag || 'div', 
			['Streams/preview', toolName], 
			[o, {}], 
			null, this.prefix
		);
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
		var tabs = tool.tabs;
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
		}
	}
}

);

})(Q, jQuery);
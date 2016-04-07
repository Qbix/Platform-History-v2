(function (Q, $) {

/**
 * @module Streams-tools
 */

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
 *   @param {Stream} [options.stream] You can pass a Streams.Stream object here instead of "publisherId" and "streamName"
 *   @param {Stream} [options.relationType =""] The type of the relation.
 *   @param {Boolean} [options.isCategory=true] Whether to show the streams related TO this stream, or the ones it is related to.
 *   @param {Object} [options.relationOptions] Can include options like 'limit', 'offset', 'ascending', 'min', 'max' and 'prefix'
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
Q.Tool.define("Streams/related",

function _Streams_related_tool (options)
{
	// check for required options
	var state = this.state;
	if ((!options.publisherId || !options.streamName)
	&& (!options.stream || Q.typeOf(options.stream) !== 'Streams.Stream')) {
		throw new Q.Error("Streams/related tool: missing options.stream");
	}
	if (options.relationType === undefined) {
		throw new Q.Error("Streams/related tool: missing options.relationType");
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
	realtime: false,
	editable: true,
	closeable: true,
	creatable: {},
	sortable: {
		draggable: '.Streams_related_stream',
		droppable: '.Streams_related_stream'
	},
	tabs: function (previewTool, tabsTool) {
		return Q.Streams.key(previewTool.state.publisherId, previewTool.state.streamName);
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
				preview.state.beforeCreate.set(function () {
					// workaround for now
					if (tool.state.refreshCount > rc) {
						return;
					}
					$(this.element)
						.addClass('Streams_related_loading')
						.removeClass('Streams_related_composer');
					addComposer(streamType, params, null, element);
					tool.integrateWithTabs([element]);
					ps.beforeCreate.remove(tool);
				}, tool);
				preview.state.onCreate.set(function () {
					$(this.element)
						.removeClass('Streams_related_loading')
						.removeClass('Streams_related_composer')
						.addClass('Streams_related_stream');
					ps.onCreate.remove(tool);
				}, tool);
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
		Q.Tool.remove($container.find('.Streams_related_composer'));
		Q.Tool.remove($container.find('.Streams_related_stream'));
		++state.refreshCount;
		Q.Streams.refresh.beforeRequest.set(function () {
			result.stream.refresh(null, {messages: true});
		}, 'Streams/related');
		
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
							Q.Streams.related.cache.removeEach(
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
						Q.Streams.updateRelation(
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
			$(element).addClass('Streams_related_stream');
			elements.push(element);
			$container.append(element);
		});
		Q.activate(tool.element, function () {
			tool.integrateWithTabs(elements);
			tool.state.onRefresh.handle.call(tool);
		});
		// The elements should animate to their respective positions, like in D3.

	}, "Streams/related"),
	onRefresh: new Q.Event()
},

{
	/**
	 * Call this method to refresh the contents of the tool, requesting only
	 * what's needed and redrawing only what's needed.
	 * @method refresh
	 * @param {Function} An optional callback to call after refresh has completed.
	 *  It receives (result, entering, exiting, updating) arguments.
	 */
	refresh: function (callback) {
		var tool = this;
		var state = tool.state;
		var publisherId = state.publisherId;
		var streamName = state.streamName;
		Q.Streams.retainWith(tool).related(
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
				updating = Q.diff(result.relatedStreams, entering, entering, comparator);
			} else {
				exiting = updating = [];
				entering = result.relatedStreams;
			}
			tool.state.onUpdate.handle.apply(tool, [result, entering, exiting, updating]);
			Q.handle(callback, tool, [result, entering, exiting, updating]);
			
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
			if (!Q.Users.loggedInUser
			|| msg.byUserId != Q.Users.loggedInUser.id
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
	integrateWithTabs: function (elements) {
		var id, parents, tabs, i;
		var tool = this;
		var state = tool.state;
		if (typeof state.tabs === 'string') {
			state.tabs = Q.getObject(state.tabs);
			if (typeof state.tabs !== 'function') {
				throw new Q.Error("Q/related tool: state.tabs does not refer to a function");
			}
		}
		parents = tool.parents();
		parents[tool.id] = tool;
		for (id in parents) {
			var tabs = tool.tabs = Q.Tool.from(parents[id].element, "Q/tabs");
			if (!tabs) continue;
			var $composer = tool.$('.Streams_related_composer');
			$composer.addClass('Q_tabs_tab');
			Q.each(elements, function (i) {
				var element = elements[i];
				var preview = Q.Tool.from(element, 'Streams/preview');
				var key = preview.state.onRefresh.add(function () {
					var value = state.tabs.call(tool, preview, tabs);
					var attr = value.isUrl() ? 'href' : 'data-name';
					elements[i].addClass("Q_tabs_tab")
						.setAttribute(attr, value);
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
			});
			tabs.refresh();
			break;
		}
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
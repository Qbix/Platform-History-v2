(function (Q, $, window, undefined) {

/**
 * @module Streams-tools
 */

/**
 * Provides base protocol and behavior for rendering a stream preview.
 * Should be combined with a tool on the same element that will actually
 * manage and render the interface.
 * @class Streams preview
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *   @param {String} options.publisherId The publisher's user id.
 *   @required
 *   @param {String} [options.streamName] If empty, and "creatable" is true, then this can be used to add new related streams.
 *   @param {Function} [options.preprocess] This function receives 
 *   (a callback, this tool, the event if any that triggered it). 
 *   This is your chance to do any processing before the request to create the stream is sent.
 *   The function must call the callback. If it passes false as the first parameter,
 *   it stops the process from continuing. However, if you want to go ahead and continue
 *   to call Q.Streams.create, you can pass here any extra fields for the stream, such
 *   as "title", "content", "attributes" (as JSON string), etc.
 *   @param {Object} [options.related] , Optional information to add a relation from the newly created stream to another one. Can include:
 *   @param {String} [options.related.publisherId] the id of whoever is publishing the related stream
 *   @param {String} [options.related.streamName] the name of the related stream
 *   @param {Mixed} [options.related.type] the type of the relation
 *   @param {Object} [options.related] A hash with properties "publisherId" and "streamName", and usually "type" and "weight". Usually set by a "Streams/related" tool.
 *   @param {Boolean|Array} [options.editable=true] Set to false to avoid showing even authorized users an interface to replace the image or text. Or set to an array naming only certain fields, which the rendering method would hopefully recognize.
 *   @param {Boolean} [options.closeable=true] Set to false to avoid showing even authorized users an option to closeable (or close) this stream
 *   @param {Object} [options.creatable] Optional fields you can override in case if streamName = "", 
 *     @param {String} [options.creatable.title="New Item"] Optional title for the case when streamName = "", i.e. the composer
 *     @param {Boolean} [options.creatable.clickable=true] Whether the image composer image is clickable
 *     @param {Number} [options.creatable.addIconSize=100] The size in pixels of the square add icon
 *     @param {Number} [options.creatable.options={}] Any options to pass to Q.Streams.create
 *   @param {Object} [options.imagepicker] Any options to pass to the Q/imagepicker jquery plugin -- see its options.
 *   @uses Q imagepicker
 *   @param {Object} [options.actions] Any options to pass to the Q/actions jquery plugin -- see its options.
 *   @uses Q actions
 *   @param {Object} [options.sizes] If passed, uses this instead of Q.Streams.image.sizes for the sizes
 *   @param {Object} [options.overrideShowSize]  A hash of {icon: size} pairs to override imagepicker.showSize when the icon is a certain string. The empty string matches all icons.
 *   @param {String} [options.throbber="plugins/Q/img/throbbers/loading.gif"] The url of an image to use as an activity indicator when the image is loading
 *   @param {Number} [options.cacheBust=null] Number of milliseconds to use for combating the re-use of cached images when they are first loaded.
 *   @param {Q.Event} [options.beforeCreate] An event that occurs right before a composer requests to create a new stream
 *   @param {Q.Event} [options.onCreate] An event that occurs after a new stream is created by a creatable preview
 *   @param {Q.Event} [options.onComposer] An event that occurs after a composer is rendered
 *   @param {Q.Event} [options.onRefresh] An event that occurs after a stream preview is rendered for an existing stream
 *   @param {Q.Event} [options.onLoad] An event that occurs after the refresh calls its callback, which should happen when everything has fully rendered
 *   @param {Q.Event} [options.beforeClose] Optionally set to a function that takes a callback, to display e.g. a dialog box confirming whether to close the stream. It should call the callback with no arguments, in order to proceed with the closing.
 *   @param {Q.Event} [options.onClose] An event that occurs after a stream with a preview has been closed
 *   @param {Object} [options.templates] Under the keys "views", "edit" and "create" you can override options for Q.Template.render .
 *   The fields passed to the template include "alt", "titleTag" and "titleClass"
 *     @param {Object} [options.templates.create]
 *       @param {String} [options.templates.create.name]
 *       @default 'Streams/preview/create'
 *       @param {Object} [options.templates.create.fields]
 *         @param {String} [options.templates.create.fields.alt]
 *         @param {String} [options.templates.create.fields.titleClass]
 *         @param {String} [options.templates.create.fields.titleTag]
 */
Q.Tool.define("Streams/preview", function _Streams_preview(options) {
	var tool = this;
	var state = tool.state;
	if (!state.publisherId) {
		throw new Q.Error("Streams/preview tool: missing options.publisherId");
	}
	var si = state.imagepicker;
	if (!si || !si.showSize) {
		throw new Q.Error("Streams/preview tool: missing options.imagepicker.showSize");
	}
	if (!si.saveSizeName) {
		si.saveSizeName = {};
		si.saveSizeName[si.showSize] = si.showSize;
		Q.each(state.sizes || Q.Streams.image.sizes, function (i, size) {
			si.saveSizeName[size] = size;
		});
	}
	var $te = $(tool.element);
	$te.addClass('Streams_preview');
	// let the extending tool's constructor run,
	// it may change this tool's state or methods
	setTimeout(function () {
		if (!$te.closest('html').length) {
			return; // tool is removed
		}
		if (state.streamName) {
			tool.loading();
			tool.preview();
		} else {
			tool.composer();
		}
	}, 0);
},

{
	related: null,
	editable: true,
	creatable: {
		title: null,
		clickable: true,
		addIconSize: 50,
		streamType: null,
		options: {}
	},
	throbber: "plugins/Q/img/throbbers/loading.gif",

	imagepicker: {
		showSize: "50",
		fullSize: "200x"
	},
	sizes: null,
	overrideShowSize: {},
	cacheBust: null,
	cacheBustOnUpdate: 1000,

	actions: {
		position: 'mr'
	},
	beforeClose: null,
	
	beforeCreate: new Q.Event(),
	onCreate: new Q.Event(),
	onComposer: new Q.Event(),
	onRefresh: new Q.Event(),
	onLoad: new Q.Event(),
	onClose: new Q.Event(function (wasRemoved) {
		this.element.removeClass('Q_working');
		Q.Masks.hide(this);
		if (wasRemoved) {
			this.$().hide(300, function () {
				$(this).remove();
			});
		}
	}, 'Streams/preview'),
	onReopen: new Q.Event(),
	onError: new Q.Event(function (err) {
		var fem = Q.firstErrorMessage(err);
		var $te = $(this.element);
		var position = $te.css('position');
		var $div = $("<div class='Streams_preview_error' />")
		.text(err).animate({opacity: 0.5}, 300);
		$te.css({
			'cursor': 'grabbing',
			'position': (position === 'static' ? 'relative' : position),
			'overflow': 'hidden'
		}).append($div)
		.click(function () {
			$te.slideUp(300);
		}).plugin('Q/actions', {
			actions: {
				remove: function () {
					$te.slideUp(300);
				}
			}
		});
	}, 'Streams/preview'),
	
	templates: {
		create: {
			name: 'Streams/preview/create',
			fields: { alt: 'new', titleClass: '', titleTag: 'h2' }
		}
	}
},

{
	create: function (event, callback) {
		function _proceed(overrides) {
			if (overrides != undefined && !Q.isPlainObject(overrides)) {
				return;
			}
			var fields = Q.extend({
				publisherId: state.publisherId,
				type: state.creatable.streamType || "Streams/text/small"
			}, overrides);
			state.beforeCreate.handle.call(tool);
			tool.loading();
			Q.Streams.retainWith(tool)
			.create(fields, function Streams_preview_afterCreate(err, stream, extra) {
				if (err) {
					state.onError.handle.call(tool, err);
					Q.handle(callback, tool, [err]);
					return err;
				}
				var r = state.related;
				state.related.weight = Q.getObject(['related', 'weight'], extra);
				state.publisherId = this.fields.publisherId;
				state.streamName = this.fields.name;
				tool.stream = this;
				var wait = this.refresh(Streams_preview_afterCreateRefresh, {
					messages: true
				});
				if (wait === false) {
					Streams_preview_afterCreateRefresh();
				}
				function Streams_preview_afterCreateRefresh(r) {
					state.onCreate.handle.call(tool, tool.stream);
					Q.handle(callback, tool, [tool.stream]);
					tool.preview();
				}
			}, state.related, state.creatable.options);
		}
		var tool = this;
		var state = tool.state;
		if (state.creatable && state.creatable.preprocess) {
			Q.handle(state.creatable.preprocess, this, [_proceed, tool, event]);
		} else {
			_proceed();
		}
	},
	composer: function _composer () {
		var tool = this;
		var state = tool.state;
		var f = state.template && state.template.fields;
		var fields = Q.extend({
			alt: "New Item",
			title: "New Item",
			src: Q.url('plugins/Streams/img/actions/add.png'),
			prefix: tool.prefix
		}, state.templates.create.fields, f, state.creatable);
		tool.element.addClass('Streams_preview_create');
		Q.Template.render(
			'Streams/preview/create',
			fields,
			function (err, html) {
				if (err) return;
				tool.element.innerHTML = html;
				tool.element.removeClass('Streams_preview_create');
				_setWidthHeight(tool, tool.$('.Streams_preview_add'));
				var container = tool.$('.Streams_preview_container');
				container.css('display', 'inline-block');
				if (state.creatable.clickable) {
					var clo = (typeof state.creatable.clickable === 'object')
						? state.creatable.clickable
						: {};
					container.plugin('Q/clickable', clo);
				}
				container.on(Q.Pointer.fastclick, tool, tool.create.bind(tool));
				Q.handle(state.onComposer, tool);
			},
			state.templates.create
		);
	},
	loading: function _loading() {
		var tool = this;
		var state = tool.state;
		var $img = $('<img />').attr({
			'alt': 'loading',
			'src': Q.url(state.throbber),
			'class': 'Streams_preview_loading'
		});
		Q.Tool.clear(tool.element);
		$(tool.element).empty().append($img);
		_setWidthHeight(tool, $img);
	},
	preview: function _preview() {
		var tool = this;
		var state = tool.state;
		Q.Streams.retainWith(tool).get(state.publisherId, state.streamName,
		function (err) {
			// handle error messages
			if (err) {
				state.onError.handle.call(tool, err);
				var fem = Q.firstErrorMessage(err);
				return console.warn("Streams/preview: " + fem);
			}
			if (this.fields.closedTime) {
				$(tool.element).addClass('Streams_closed');
			}
			// trigger the refresh when it's ready
			tool.stream = this;
			state.onRefresh.handle.call(tool, this, state.onLoad.handle);
			setTimeout(function () {
				tool.actions();
			}, 0);
		});
		Q.Streams.Stream.onFieldChanged(state.publisherId, state.streamName)
		.set(function (fields, updated) {
			tool.stream = this;
			setTimeout(function () {
				for (var i=0, l=fields.length; i<l; ++i) {
					tool.stateChanged('stream.fields.'+field[i]);
				}
			});
			var $te = $(tool.element);
			if (fields.closedTime === null) {
				$te.removeClass('Streams_closed');
			} else if (fields.closedTime) {
				$te.addClass('Streams_closed');
			}
			setTimeout(function () {
				// run this after the stream was updated
				tool.actions();
			}, 0);
		}, tool);
	},
	/**
	 * @method icon
	 * @param {HTMLElement} element
	 * @param {Function} onLoad 
	 * @param {Object} [options]
	 * @param {String} [options.defaultIcon='default']
	 * @param {String} [options.cacheBust=null]
	 */
	icon: function _icon (element, onLoad, options) {
		var tool = this;
		var state = tool.state;
		options = options || {};
		Q.Streams.get(state.publisherId, state.streamName, function () {
			tool.stream = this;
			// icon and imagepicker
			var oss = state.overrideShowSize;
			var fields = this.fields;
			var si = state.imagepicker;
			var sfi = options.icon || fields.icon;
			var size = si.saveSizeName[si.showSize];
			var attributes = options.attributes || fields.attributes;
			attributes = (attributes && JSON.parse(attributes)) || {};
			if (attributes.sizes
			&& attributes.sizes.indexOf(state.imagepicker.showSize) < 0) {
				for (var i=0; i<attributes.sizes.length; ++i) {
					size = attributes.sizes[i];
					var parts1 = attributes.sizes[i].toString().split('x');
					var parts2 = si.showSize.toString().split('x');
					if (parts1.length === 1) parts1[1] = parts1[0];
					if (parts2.length === 2) parts2[1] = parts2[0];
					if (parseInt(parts1[0]||0) >= parseInt(parts2[0]||0)
					 && parseInt(parts1[1]||0) >= parseInt(parts2[1]||0)) {
						break;
					}
				}
			}
			var file = (oss && (oss[sfi] || oss['']))
				|| size
				|| Q.first(si.saveSizeName, {nonEmptyKey: true});
			var full = si.saveSizeName[si.fullSize] || file;
			var size = si.saveSizeName[si.showSize];
			var defaultIcon = (options.defaultIcon) || 'default';
			var icon = (sfi && sfi !== 'default') ? sfi : defaultIcon;
			element.src = Q.url(
				Q.Streams.iconUrl(icon, file), null, 
				{cacheBust: options.cacheBust && state.cacheBustOnUpdate}
			);
			element.setAttribute('data-fullsrc', Q.url(
				Q.Streams.iconUrl(icon, full), null, 
				{cacheBust: options.cacheBust && state.cacheBustOnUpdate}
			));
			// check if we should add the imagepicker
			var se = state.editable;
			if (element && se && (se === true || se.indexOf('icon') >= 0)
			&& this.testWriteLevel('suggest')) {
				$(element).off('load.Streams-preview')
				.on('load.Streams-preview', function () {
					// add imagepicker
					var ipo = Q.extend({}, si, {
						preprocess: function (callback) {
							var subpath;
							var parts = tool.stream.iconUrl(40).split('/');
							var iconUrl = parts.slice(0, parts.length-1).join('/')
								.substr(Q.info.baseUrl.length+1);
							if (parts[1] === 'Users') {
								// uploading a user icon
								path = 'uploads/Users';
								subpath = state.publisherId.splitId() + '/icon';
							} else { // uploading a regular stream icon
								path = 'uploads/Streams';
								subpath = state.publisherId.splitId() + '/'
									+ state.streamName + '/icon';
							}
							subpath += '/'+Math.floor(Date.now()/1000);
							callback({ path: path, subpath: subpath });
						},
						onSuccess: {'Streams/preview': function (data, key, file) {
							tool.stream.refresh(null, {
								messages: true,
								changed: {icon: true}
							});
							return false;
						}}
					});
					$(this).plugin('Q/imagepicker', ipo, function () {
						Q.handle(onLoad, tool, [element]);
					});
				});
			} else {
				Q.handle(onLoad, tool, [element]);
			}
		});
		Q.Streams.Stream.onFieldChanged(state.publisherId, state.streamName, 'icon')
		.set(function (fields) {
			tool.icon(element, onLoad, Q.extend({}, options, {
				attributes: fields.attributes,
				cacheBust: true,
				icon: fields.icon
			}));
		}, this);
		return this;
	},
	actions: function _actions () {
		var tool = this;
		var state = tool.state;
		// check if we should add this behavior
		if (!state.actions
		|| state.closeable === false
		|| !tool.stream.testWriteLevel('close')) {
			return false;
		}
		// add some actions
		var actions = {};
		var action = tool.stream.isRequired
			? (tool.stream.fields.closedTime ? 'open' : 'close')
			: 'remove';
		if (action === 'open') {
			actions[action] = function () {
				tool.stream.reopen(function (err) {
					if (err) return;
					tool.state.onReopen.handle.call(tool);
				});
			};
		} else {
			actions[action] = function () {
				if (state.beforeClose) {
					Q.handle(state.beforeClose, tool, [_remove]);
				} else {
					_remove();
				}
				function _remove(cancel) {
					if (cancel) return;
					tool.element.addClass('Q_working');
					Q.Masks.show(tool, {
						shouldCover: tool.element, className: 'Q_removing'
					});
					tool.stream.close(function (err) {
						if (err) return;
						tool.state.onClose.handle.call(tool, !tool.stream.isRequired);
					});
				}
			};
		}
		var ao = Q.extend({}, state.actions, { actions: actions });
		tool.$().plugin('Q/actions', ao);
		return this;
	},
	close: function _close() {
		var tool = this;
		var state = tool.state;
		tool.stream.close(function (err) {
			if (err) {
				alert(err);
				return;
			}
			state.onClose.handle.call(tool);
		});
	},
	Q: {
		onLayout: new Q.Event(function () {
			var iconWidth = this.$('.Streams_preview_icon').outerWidth(true);
			this.$('.Streams_preview_title').width(
				$(this.element).innerWidth() - iconWidth
			);
		}, 'Streams/preview')
	}
}

);

Q.Template.set('Streams/preview/create',
	'<div class="Streams_preview_container Q_clearfix">'
	+ '<img src="{{& src}}" alt="{{alt}}" class="Streams_preview_add">'
	+ '<div class="Streams_preview_contents {{titleClass}}">'
	+ '<{{titleTag}} class="Streams_preview_title">{{title}}</{{titleTag}}>'
	+ '</div></div>'
);

function _setWidthHeight(tool, $img) {
	var state = tool.state;
	var parts = state.imagepicker.showSize.split('x');
	var w = parts[0] || parts[1] || state.creatable.addIconSize;
	var h = parts[0] || parts[1] || state.creatable.addIconSize;
	w = h = Math.min(w, h);
	if (w && h) {
		$img.width(w).height(h);
	}
}

})(Q, jQuery, window);
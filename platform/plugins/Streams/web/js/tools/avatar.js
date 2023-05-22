(function (Q, $, window, undefined) {

var Users = Q.Users;
var Streams = Q.Streams;

/**
 * Streams Tools
 * @module Streams-tools
 * @main
 */

/**
 * Avatar representing a user
 * @class Users avatar
 * @constructor
 * @param {Object} [options] A hash of options, containing:
 *   @param {String} options.userId The id of the user object. Defaults to id of the logged-in user, if any. Can be '' for a blank-looking avatar.
 *   @param {Number|String|true} [options.icon=Q.Users.icon.defaultSize] Size of the icon to render before the display name. Or 0 for no icon. You can also pass true here for default size. Or pass a string to specify the url of the icon.
 *   @param {Boolean} [options.contents=true] Set to false to not show the name
 *   @param {Boolean} [options.short=false] If true, renders the short version of the display name.
 *   @param {Boolean|Array} [options.editable=false] If true, and userId is the logged-in user's id, the tool presents an interface for the logged-in user to edit their name and icon. This can also be an array containing one or more of 'icon', 'name'.
 *   @param {Boolean} [options.short=false] If true, renders the short version of the display name.
 *   @param {String} [options.className] Any css classes to add to the tool element
 *   @param {Boolean} [options.reflectChanges=true] Whether the tool should update its contents on changes to user streams like firstName, lastName, username and icon. Set to false if you are showing many avatars in a list such as "Users/list" or "Streams/participating" tools. Otherwise it can result many database queries – one per avatar!
 *   @param {Boolean} [options.reflectIconChanges=String(options.icon).isUrl()] Whether to automatically update the icon if the user's icon stream changes
 *   @param {Boolean} [options.withGender=false] Whether to also load the gender, and listen for its changes
 *   @param {Number} [options.cacheBust=null] Number of milliseconds to use for combating the re-use of cached images when they are first loaded.
 *   @param {Object} [options.templates]
 *     @param {Object} [options.templates.icon]
 *       @param {String} [options.templates.icon.dir='{{Users}}/views']
 *       @param {String} [options.templates.icon.name='Users/avatar/icon']
 *       @param {Object} [options.templates.icon.fields]
 *         @param {String} [options.templates.icon.fields.alt="user icon"]
 *     @param {Object} [options.templates.contents]
 *       @param {String} [options.templates.contents.dir='{{Users}}/views']
 *       @param {String} [options.templates.contents.name='Users/avatar/contents']
 *       @param {Object} [options.templates.contents.fields]
 *         @param {String} [options.templates.contents.fields.tag="span"]
 * @param {Object} [options.inplaces] Additional fields to pass to the child Streams/inplace tools, if any
 *   @param {Q.Event} [options.onRefresh]  An event that occurs when the avatar is refreshed
 *   @param {Q.Event} [options.onRefresh] Event occurs when tool element has rendered with content
 *   @param {Q.Event} [options.onUpdate]  An event that occurs when the icon is updated via this tool
 *   @param {Q.Event} [options.onImagepicker]  An event that occurs when the imagepicker is activated
 *   @param {Q.Event} [options.onMissing]  An event that occurs if the avatar info turns out to be missing
 */
Q.Tool.define("Users/avatar", function Users_avatar_tool(options) {
	var tool = this;
	var state = this.state;
	if (state.icon === true) {
		state.icon = Users.icon.defaultSize;
	}
	if (state.userId == null) {
		state.userId = Users.loggedInUserId();
	}
	if (state.editable === true) {
		state.editable = ['icon', 'name'];
	}
	this.refresh(true);
	if (!state.userId) {
		return;
	}
	if (state.className) {
		$(tool.element).addClass(state.className);
	}
	if (state.reflectIconChanges === undefined) {
		state.reflectIconChanges = !String(state.icon).isUrl();
	}
	if (state.reflectIconChanges) {
		Streams.Stream.onFieldChanged(state.userId, 'Streams/user/icon', 'icon')
		.set(function (fields, field) {
			var $img = tool.$('.Users_avatar_icon');
			var iconSize = state.icon || $img.width();
			$img.attr('src', 
				Q.url(Streams.iconUrl(fields.icon, iconSize), null, {
					cacheBust: state.cacheBustOnUpdate
				})
			);
		}, this);
	}
	if (!state.editable || state.editable.indexOf('name') < 0) {
		Q.each(["firstName", "lastName", "username", "gender"], function (i, val) {
			if (val === "gender" && !state.withGender) {
				return;
			}

			Streams.Stream.onFieldChanged(state.userId, 'Streams/user/' + val, 'content').set(function (fields, field) {
				Streams.Avatar.get.forget(state.userId);
				tool.refresh();
			}, tool);
		});
	}
},

{
	userId: undefined,
	icon: Users.icon.defaultSize,
	contents: true,
	"short": false,
	className: null,
	reflectChanges: true,
	withGender: false,
	templates: {
		icon: {
			dir: '{{Users}}/views',
			name: 'Users/avatar/icon',
			fields: { alt: "user icon" }
		},
		contents: {
			dir: '{{Users}}/views',
			name: 'Users/avatar/contents',
			fields: { tag: "span" }
		},
		blank: {
			contents: {
				dir: '{{Users}}/views',
				name: 'Users/avatar/contents/blank',
				fields: { tag: "span" }
			},
			icon: {
				dir: '{{Users}}/views',
				name: 'Users/avatar/icon/blank',
				fields: { tag: "span" }
			}
		}
	},
	editable: false,
	imagepicker: {},
	inplaces: {},
	cacheBust: null,
	cacheBustOnUpdate: 1000,
	onUpdate: new Q.Event(),
	onImagepicker: new Q.Event(),
	onRefresh: new Q.Event(),
	onMissing: new Q.Event(function () {
		this.element.style.display = 'none';
	}, 'Users/avatar')
},

{
	/**
	 * Refresh the avatar's display
	 * @method refresh
	 * @param {boolean} [unlessContent=false] only used by constructor to pass true
	 */
	refresh: function (unlessContent) {
		var tool = this;
		var state = this.state;
		if (state.userId === undefined) {
			console.warn("Users/avatar: no userId provided");
			return; // empty
		}
		if (unlessContent && tool.element.childNodes.length) {
			return _present();
		}
		Q.Tool.clear(tool.element);
		if (state.icon === true) {
			state.icon = Users.icon.defaultSize;
		}
		
		var p = new Q.Pipe(['icon', 'contents'], function (params) {
			var icon = state.icon ? params.icon[0] : '';
			var contents = state.contents ? params.contents[0] : '';
			tool.element.innerHTML = icon + contents;
			setTimeout(function () {
				Q.handle(state.onRefresh, tool);
			}, 0);
			_present();
		});
		if (state.userId === '') {
			var fields = Q.extend({}, state.templates.contents.fields, {
				name: ''
			});
			Q.Template.render('Users/avatar/icon/blank', fields, function (err, html) {
				p.fill('icon')(html);
			}, state.templates.blank.icon);
			Q.Template.render('Users/avatar/contents/blank', fields, function (err, html) {
				p.fill('contents')(html);
			}, state.templates.blank.contents);
			return;
		}

		var fields = Q.extend({}, state.templates.icon.fields, {
			src: Q.url(Users.iconUrl('loading'), null),
			state: state
		});
		Q.Template.render('Users/avatar/loading', fields, function (err, html) {
			Q.replace(tool.element, html);;
		});
		tool.element.addClass('Q_loading');
		
		Streams.Avatar.get(state.userId, function (err, avatar) {
			var fem = Q.firstErrorMessage(err, avatar);
			if (fem) {
				return console.warn(fem);
			}
			var fields;
			tool.element.removeClass('Q_loading');
			if (!avatar) {
				return Q.handle(state.onMissing, tool, [err]);
			}
			state.avatar = avatar;
			if (state.icon) {
				var src = isNaN(state.icon)
					? state.icon
					: Q.url(avatar.iconUrl(state.icon, true), null);
				fields = Q.extend({}, state.templates.icon.fields, {
					src: src,
					size: parseInt(state.icon) || 'icon'
				});
				Q.Template.render('Users/avatar/icon', fields, 
				function (err, html) {
					p.fill('icon')(html);
				}, Q.extend({size: state.icon}, state.templates.icon));
			} else {
				p.fill('icon')('');
			}

			fields = Q.extend({}, state.templates.contents.fields, {
				name: this.displayName(Q.extend({}, state, {html: true}))
			});
			if (fields.name) {
				Q.Template.render('Users/avatar/contents', fields,
				function (err, html) {
					p.fill('contents')(html);
				}, state.templates.contents);
			} else {
				Q.Template.render('Users/avatar/contents/blank', fields,
				function (err, html) {
					p.fill('contents')(html);
				});
			}
		});
		
		if (state.reflectChanges) {
			// Retain the streams, so they can be refreshed while this tool is active,
			// triggering the Streams plugin to update the avatar.
			var names = [
				'Streams/user/username',
				'Streams/user/icon'
			];
			if (!Users.isCommunityId(state.userId)) {
				names.push('Streams/user/firstName');
				names.push('Streams/user/lastName');
				if (state.withGender) {
					names.push('Streams/user/gender');
				}
			}
			Streams.Stream.retain(state.userId, names, tool);
		}
	
		function _present() {
			Q.Text.get('Streams/content', function (err, text) {
				Q.handle(state.onRefresh, tool, []);
				if (!state.editable) return;
				if (state.editable === true) {
					state.editable = ['icon', 'name'];
				}
				if (state.editable.indexOf('name') >= 0) {
					var zIndex = 5;
					Q.each(['firstName', 'lastName', 'username'], function (k, vName) {
						var f = tool.element.getElementsByClassName('Streams_'+vName)[0];
						if (!f || f.getElementsByClassName('Streams_inplace_tool').length) {
							return;
						}
						var opt = Q.extend({
							publisherId: state.userId,
							streamName: 'Streams/user/'+vName,
							inplaceType: 'text',
							inplace: {
								bringToFront: f,
								placeholder: text.avatar[vName],
								staticHtml: f.innerHTML,
								capitalize: (vName === 'firstName' || vName === 'lastName')
							}
						}, state.inplaces);
						Q.Tool.setUpElement(
							f, 'Streams/inplace', opt,
							'Streams_inplace-'+vName, tool.prefix
						);
						f.style.zIndex = --zIndex;
						Q.activate(f);
					});
				}
			});
			if (state.editable && state.editable.indexOf('icon') >= 0
			&& Users.loggedInUser) {
				var $img = tool.$('.Users_avatar_icon').addClass('Streams_editable');
				var saveSizeName = {};
				Q.each(Users.icon.sizes, function (k, v) {
					saveSizeName[k] = v;
				});
				Streams.retainWith(tool).get(
					state.userId,
					'Streams/user/icon',
					function (err) {
						var stream = this;
						var o = Q.extend({
							saveSizeName: saveSizeName,
							maxStretch: Users.icon.maxStretch,
							showSize: state.icon || $img.width(),
							path: 'Q/uploads/Users',
							preprocess: function (callback) {
								callback({
									subpath: state.userId.splitId()+'/icon/'
										+Math.floor(Date.now()/1000),
									save: "Users/icon"
								});
							},
							onSuccess: {"Users/avatar": function () {
								stream.refresh(function () {
									state.onUpdate.handle.call(tool, this);
								}, {
									unlessSocket: true,
									changed: { icon: true }
								});
							}},
							cacheBust: state.cacheBust
						}, state.imagepicker);
						$img.plugin('Q/imagepicker', o, function () {
							state.onImagepicker.handle($img.state('Q/imagepicker'));
						});
					}
				)
			}
			Streams.onAvatar(state.userId).set(function () {
				tool.refresh();
			}, tool);
		}
	}
}

);

Q.Template.set('Users/avatar/loading', '{{#if state.icon}}<img src="{{{src}}}" alt="{{alt}}" class="Users_avatar_loading Users_avatar_icon Users_avatar_icon_{{size}}">{{else}}...{{/if}}');
Q.Template.set('Users/avatar/icon', '<img src="{{{src}}}" alt="{{alt}}" class="Users_avatar_icon Users_avatar_icon_{{size}}">');
Q.Template.set('Users/avatar/contents', '<{{tag}} class="Users_avatar_name">{{{name}}}</{{tag}}>');
Q.Template.set('Users/avatar/icon/blank', '<div class="Users_avatar_icon Users_avatar_icon_blank"></div>');
Q.Template.set('Users/avatar/contents/blank', '<div class="Users_avatar_name Users_avatar_name_blank">&nbsp;</div>');

})(Q, Q.$, window);

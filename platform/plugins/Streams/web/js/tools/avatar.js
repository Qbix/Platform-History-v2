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
 * @param {String} prefix Prefix of the tool to be constructed.
 * @param {Object} [options] A hash of options, containing:
 *   @param {String} options.userId The id of the user object. Can be '' for a blank-looking avatar.
 *   @param {Number} [options.icon=Q.Users.icon.defaultSize] Size of the icon to render before the display name. Or 0 for no icon.
 *   @param {Boolean} [options.short=false] If true, renders the short version of the display name.
 *   @param {Boolean|Array} [options.editable=false] If true, and userId is the logged-in user's id, the tool presents an interface for the logged-in user to edit their name and icon. This can also be an array containing one or more of 'icon', 'name'.
 *   @param {Boolean} [options.reflectChanges=true] Whether the tool should update its contents on changes
 *   @param {Number} [options.cacheBust=null] Number of milliseconds to use for combating the re-use of cached images when they are first loaded.
 *   @param {Object} [options.templates]
 *     @param {Object} [options.templates.icon]
 *       @param {String} [options.templates.icon.dir='plugins/Users/views']
 *       @param {String} [options.templates.icon.name='Users/avatar/icon']
 *       @param {Object} [options.templates.icon.fields]
 *         @param {String} [options.templates.icon.fields.alt="user icon"]
 *     @param {Object} [options.templates.contents]
 *       @param {String} [options.templates.contents.dir='plugins/Users/views']
 *       @param {String} [options.templates.contents.name='Users/avatar/contents']
 *       @param {Object} [options.templates.contents.fields]
 *         @param {String} [options.templates.contents.fields.tag="span"]
 * @param {Object} [options.inplaces] Additional fields to pass to the child Streams/inplace tools, if any
 *   @param {Q.Event} [options.onRefresh]  An event that occurs when the avatar is refreshed
 *   @param {Q.Event} [options.onUpdate]  An event that occurs when the icon is updated via this tool
 *   @param {Q.Event} [options.onImagepicker]  An event that occurs when the imagepicker is activated
 */
Q.Tool.define("Users/avatar", function(options) {
	var tool = this;
	var state = this.state;
	if (state.icon === true) {
		state.icon = Users.icon.defaultSize;
	}
	if (state.me) {
		state.userId = Users.loggedInUserId();
	}
	if (state.editable === true) {
		state.editable = ['icon', 'name'];
	}
	this.refresh();
	if (!state.userId || !state.reflectChanges) {
		return;
	}
	Streams.Stream.retain(state.userId, 'Streams/user/firstName', tool);
	Streams.Stream.retain(state.userId, 'Streams/user/lastName', tool);
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
	if (!state.editable || state.editable.indexOf('name') < 0) {
		Streams.Stream.onFieldChanged(state.userId, 'Streams/user/firstName', 'content')
		.set(handleChange, this);
		Streams.Stream.onFieldChanged(state.userId, 'Streams/user/lastName', 'content')
		.set(handleChange, this);
	}
	function handleChange(fields, field) {
		Streams.Avatar.get.forget(state.userId);
		tool.element.innerHTML = '';
		tool.refresh();
	}
},

{
	userId: null,
	icon: Users.icon.defaultSize,
	"short": false,
	reflectChanges: true,
	templates: {
		icon: {
			dir: 'plugins/Users/views',
			name: 'Users/avatar/icon',
			fields: { alt: "user icon" }
		},
		contents: {
			dir: 'plugins/Users/views',
			name: 'Users/avatar/contents',
			fields: { tag: "span" }
		}
	},
	editable: false,
	imagepicker: {},
	inplaces: {},
	cacheBust: null,
	cacheBustOnUpdate: 1000,
	onRefresh: new Q.Event(),
	onUpdate: new Q.Event(),
	onImagepicker: new Q.Event()
},

{
	/**
	 * Refresh the avatar's display
	 * @method refresh
	 */
	refresh: function () {
		
		var tool = this;
		var state = this.state;
		if (tool.element.childNodes.length) {
			return _present();
		}
		
		// TODO: implement analogous functionality
		// to when Users/avatar is rendered server-side,
		// with "editable" and the same <span> elements
		// for firstName and lastName.
		
		if (state.userId === undefined) {
			console.warn("Users/avatar: no userId provided");
			return; // empty
		}
		if (state.icon === true) {
			state.icon = Users.icon.defaultSize;
		}
	
		var p = new Q.Pipe(['icon', 'contents'], function (params) {
			tool.element.innerHTML = params.icon[0] + params.contents[0];
			_present();
		});
		
		if (state.userId === '') {
			var fields = Q.extend({}, state.templates.contents.fields, {
				name: ''
			});
			Q.Template.render('Users/avatar/icon/blank', fields, function (err, html) {
				p.fill('icon')(html);
			});
			Q.Template.render('Users/avatar/contents/blank', fields, function (err, html) {
				p.fill('contents')(html);
			});
			return;
		}
		
		Streams.Avatar.get(state.userId, function (err, avatar) {
			var fields;
			if (!avatar) return;
			state.avatar = avatar;
			if (state.icon) {
				fields = Q.extend({}, state.templates.icon.fields, {
					src: Q.url(this.iconUrl(state.icon), null)
				});
				Q.Template.render('Users/avatar/icon', fields, 
				function (err, html) {
					p.fill('icon')(html);
				}, state.templates.icon);
			} else {
				p.fill('icon')('');
			}

			fields = Q.extend({}, state.templates.contents.fields, {
				name: this.displayName({
					"short": state["short"],
					"html": true
				})
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
	
		function _present() {
			Q.handle(state.onRefresh, tool, []);
			if (!state.editable) return;
			if (state.editable === true) {
				state.editable = ['icon', 'name'];
			}
			if (state.editable.indexOf('name') >= 0) {
				var zIndex = 5;
				Q.each(['firstName', 'lastName', 'username'], function (k, vName) {
					var f = tool.getElementsByClassName('Streams_'+vName)[0];
					if (!f || f.getElementsByClassName('Streams_inplace_tool').length) {
						return;
					}
					var opt = Q.extend({
						publisherId: state.userId,
						streamName: 'Streams/user/'+vName,
						inplaceType: 'text',
						inplace: {
							bringToFront: f,
							placeholder: 'Your '+vName.substr(0, vName.length-4)+' name',
							staticHtml: f.innerHTML
						}
					}, state.inplaces);
					var e = Q.Tool.setUpElement(
						'span', 'Streams/inplace', opt, tool.prefix+'Streams_inplace-'+vName, tool.prefix
					);
					f.innerHTML = '';
					f.appendChild(e);
					f.style.zIndex = --zIndex;
					Q.activate(e);
				});
			}
			if (state.editable.indexOf('icon') >= 0 && Users.loggedInUser) {
				var $img = tool.$('.Users_avatar_icon').addClass('Streams_editable');
				var saveSizeName = {};
				Q.each(Users.icon.sizes, function (k, v) {
					saveSizeName[v] = v+".png";
				});
				Streams.retainWith(tool).get(
					Users.loggedInUser.id,
					'Streams/user/icon',
					function (err) {
						var stream = this;
						var o = Q.extend({
							saveSizeName: saveSizeName,
							showSize: state.icon || $img.width(),
							path: 'uploads/Users',
							preprocess: function (callback) {
								callback({
									subpath: state.userId.splitId()+'/icon/'
										+Math.floor(Date.now()/1000)
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
		}
	}
}

);

Q.Template.set('Users/avatar/icon', '<img src="{{& src}}" alt="{{alt}}" class="Users_avatar_icon">');
Q.Template.set('Users/avatar/contents', '<{{tag}} class="Users_avatar_name">{{& name}}</{{tag}}>');
Q.Template.set('Users/avatar/icon/blank', '<div class="Users_avatar_icon Users_avatar_icon_blank"></div>');
Q.Template.set('Users/avatar/contents/blank', '<div class="Users_avatar_name Users_avatar_name_blank">&nbsp;</div>');

})(Q, jQuery, window);
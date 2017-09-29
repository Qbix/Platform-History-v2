(function (Q, $) {

/**
 * Streams Tools
 * @module Streams-tools
 */

/**
 * Interface for selecting facebook photos from user albums
 * @class Streams photoSelector
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *   @param {Q.Event} [options.onSelect] Triggered when the user selects a photo.
 *   @param {Q.Event} [options.beforePhotos] Triggered when photos are about to be rendered.
 *   @param {Q.Event} [options.onPhotos] Triggered when photos have been rendered.
 *   @param {Q.Event} [options.onPhotosLoaded] Triggered when the photos have all been loaded.
 *   @param {String} [options.uid='me'] Optional. The uid of the user on the platform whose photos are shown. Facebook only allows 'me' or a page id as a value.
 *   @param {String} [$options.fetchBy='album'] The tool supports different algoriths for fetching photos. Can be either by 'album' or 'tags'. Maybe more will be added later.
 *   @param {String} [$options.preprocessAlbums] Optional function to process the albums array before presenting it in the select. Receives a reference to the albums array as the first parameter, and a callback to call when it's done as the second.
 *   @param {String} [$options.preprocessPhotos] Optional function to process the photos array before presenting it in the select. Receives a reference to the albums array as the first parameter, and a callback to call when it's done as the second.
 *   @param {Q.Event} [options.onLoad] Q.Event, callback or callback string name which is called when bunch of photos has been loaded.
 *   @param {Q.Event} [options.onError] Q.Event, callback or callback string which will be called for each image that is unable to load. Image DOM element will be passed as first argument.
 *   @param {String} [options.platform='facebook]  Has to be "facebook" for now. 
 *   @param {String} [options.prompt=false]
 *   Specifies type of prompt if user is not logged in or didn't give required permission for the tool.
 *  Can be either 'button', 'dialog' or null|false.
 *  In first case just shows simple button which opens facebook login popup.
 *  In second case shows Users.facebookDialog prompting user to login.
 *  In third case will not show any prompt and will just hide the tool.
 *   @param {String} [options.promptTitle]  Used only when 'prompt' equals 'dialog' - will be title of the dialog.
 *   @param {String} [options.promptText]  Used either for button caption when 'prompt' equals 'button' or dialog text when 'prompt' equals 'dialog'.
 *   @param {Boolean} [options.oneLine]  If true, all the images are shown in a large horizontally scrolling line.
 *   @default false
 *   @param {Boolean} [options.cache]  If true, photos will be cached using localStorage (if available).
 *   @default false
 */
Q.Tool.define("Streams/photoSelector", function _Streams_photoSelector_constructor (o) {

	var tool = this;
	var state = tool.state;
	var $te = $(tool.element);

	if (!state.onSelect) {
		console.warn("Streams/photoSelector: please provide the onSelect option");
	}
	if (state.platform !== 'facebook') {
		console.warn("Only facebook is supported as a platform for now");
	}
	
	var fields = 'id,album,created_time,from,icon,images,link,name,name_tags,updated_time,width,event,place,picture';

	var fetchBy = {
		album: Q.getter(function(albumId, callback) {
			FB.api('/'+albumId+'/photos?limit=100&fields='+fields,
			function (response) {
				_returnedPhotos(response, callback);
			});
		}),
		tags: Q.getter(function(callback) {
			FB.api('/'+state.uid+'/photos?limit=100&type=tagged&fields='+fields,
			function (response) {
				_returnedPhotos(response, callback);
			});
		})
	};
	
	function _returnedPhotos(response, callback) {
		if (!response || response.error) {
			return;
		}
		var photos = response.data;
		if (state.preprocessPhotos) {
			state.preprocessPhotos.call(tool, photos, function () {
				callback.call(tool, photos);
			});
		} else {
			callback.call(tool, photos);
		}
	}

	function fetchAlbums(callback) {
		FB.api('/'+state.uid+'/albums?fields=id,name,type,created_time', function (response) {
			if (!response || response.error) {
				return;
			}
			var albums = response.data;
			if (state.preprocessAlbums) {
				state.preprocessAlbums.call(tool, albums, function () {
					callback.call(tool, albums);
				});
			} else {
				callback.call(tool, albums);
			}
		});
	}

	function showAlbums(albums) {
		tool.$albums = $('<select class="Streams_photoSelector_albums" />')
		.on('change keydown input', Q.debounce(function() {
			fetchPhotos();
		}, 50));
		$te.empty().append(tool.$albums);
		Q.each(albums, function () {
			tool.$albums.append(
				$('<option />', {value: this.id})
				.text(this.name)
				.data('album', this)
			);
		});
	}

	function fetchPhotos() {
		switch (state.fetchBy) {
		case 'album':
			fetchBy.album(tool.$albums.val(), showPhotos);
			break;
		case 'tags':
			fetchBy.tags(showPhotos);
			break;
		default:
			break;
		}
	}

	function showPhotos(photos) {
		
		var album = tool.$albums
			? tool.$albums.find(':selected').data('album')
			: null;
		Q.handle(state.beforePhotos, this, [album]);
		if (state.fetchBy == 'tags') {
			$te.empty();
		}
		tool.$photosContainer = $te.find('.Streams_photoSelector_container');
		if (tool.$photosContainer.length) {
			tool.$photosContainer.empty();
		} else {
			tool.$photosContainer = $('<div class="Streams_photoSelector_container" />')
				.appendTo($te);
		}
		
		var p = new Q.Pipe();
		var w = [];
		if (Q.isEmpty(photos)) {
			tool.$photosContainer.append('<div class="Streams_photoSelector_noPhotos">No photos found for these criteria.</div>');
		} else {
			Q.each(photos, function () {
				var photo = this;
				var $img = $('<img />')
				.on('load', p.fill(src))
				.attr({src: photo.picture})
				.data('photo', this)
				.appendTo(tool.$photosContainer)
				.on(Q.Pointer.fastclick, function () {
					Q.handle(state.onSelect, tool, [this, photo, photo.images]);
				});
				w.push(src);
			});
			if (state.oneLine) {
				tool.$photosContainer.addClass('Streams_photoSelector_oneLine');
			}
		}
		
		Q.handle(state.onPhotos, tool, [album]);
		p.add(w, function () {
			Q.handle(state.onPhotosLoaded, tool, [album]);
		}).run();
		
	}
	
	function _fetch() {
		switch (state.fetchBy) {
		case 'album':
			fetchAlbums(function (albums) {
				showAlbums(albums);
				fetchPhotos();
			});
			break;
		case 'tags':
			fetchPhotos();
			break;
		default:
			break;
		}
	}

	function onSuccessfulLogin($te) {
		FB.api('/me/permissions', function (response) {
			var authorized = false;
			Q.each(response.data, function (i, data) {
				if (data.permission == 'user_photos' && data.status == 'granted') {
					authorized = true;
				}
			});
			if (authorized) {
				_fetch();
			} else {
				Q.plugins.Users.facebookDialog({
					'title': 'Permissions request',
					'content': 'The application requires access to your photos.',
					'buttons': [
						{
							'label': 'Grant permissions',
							'handler': function(dialog) {
								Q.plugins.Users.login({
									using: 'facebook',
									scope: 'user_photos',
									onCancel: function() {
										dialog.close();
										$te.empty();
									},
									onSuccess: function() {
										dialog.close();
										_fetch();
									}
								});
							},
							'default': true
						},
						{
							'label': 'Cancel',
							'handler': function(dialog) {
								$te.empty();
								dialog.close();
							}
						}
					],
					'position': null,
					'shadow': true
				});
			}
		});
	}

	switch (state.platform) {
	case 'facebook':
		$te.find('*').remove();
		$te.removeClass('Streams_photoSelector_by_album Streams_photoSelector_by_tags')
			.addClass('Streams_photoSelector_by_' + state.fetchBy);
		var src = Q.url('/{{Q}}/img/throbbers/loading.gif');
		$te.append('<div class="Streams_tools_throbber"><img src="'+src+'" alt="" /></div>');
		Q.plugins.Users.login({
			tryQuietly: true,
			using: 'facebook',
			scope: 'user_photos',
			onSuccess: function() {
				onSuccessfulLogin($te);
			},
			onCancel: function() {	
				if (state.prompt == 'dialog') {
					// we may show the dialog asking user to login
					Q.plugins.Users.facebookDialog({
						'title': state.promptTitle,
						'content': state.promptText,
						'buttons': [
							{
								'label': 'Login',
								'handler': function(dialog) {
									Q.plugins.Users.login( {
										using: 'facebook',
										onCancel: function() {
											dialog.close();
											$te.hide();
										},
										onSuccess: function() {
											dialog.close();
											onSuccessfulLogin($te);
										}
									});
								},
								'default': true
							},
							{
								'label': 'Cancel',
								'handler': function(dialog) {
									$te.hide();
									dialog.close();
								}
							}
						],
						'position': null,
						'shadow': true
					});
				} else if (state.prompt == 'button') {
					// or a button, clicking on it will cause facebook
					// login popup to appear
					var button = $('<button class="Q_main_button">' + state.promptText + '</button>');
					$te.empty().append(button);
					button.click(function()
					{
						Q.plugins.Users.login(
						{
							using: 'facebook',
							onSuccess: function()
							{
								onSuccessfulLogin($te);
							}
						});
					});
				} else {
					// or just hide photo selector, and wait for a login
					$te.hide();
					Q.plugins.Users.onLogin.set(function() {
						Q.plugins.Users.onLogin.remove('photo-selector-login');
						$te.show();
						onSuccessfulLogin($te);
					}, 'Streams/photoSelector');
				}
			}
		});
		break;
	}
},

{
	onSelect: new Q.Event(),
	beforePhotos: new Q.Event(),
	onPhotos: new Q.Event(),
	onPhotosLoaded: new Q.Event(),
	preprocessAlbums: function (albums, callback) {
		Q.each(albums, function (i) {
			if (this.type === 'profile') {
				albums.splice(i, 1);
				albums.unshift(this);
			}
		});
		callback();
	},
	uid: 'me',
	fetchBy: 'album',
	onLoad: new Q.Event(function() {}),
	onError: new Q.Event(function() {}),
	platform: 'facebook',
	prompt: false,
	promptTitle: 'Login required',
	promptText: 'Please log into Facebook to to view photos.',
	oneLine: false,
	cache: false
}

);

})(Q, jQuery);
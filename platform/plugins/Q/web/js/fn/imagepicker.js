(function (Q, $, window, document, undefined) {

Q.setObject('Q.text.Q.imagepicker', {
	errorReadingFile: "Error reading file",
	cameraCommands: {
		prompt: "What would you like to do?",
		photo: "Take new photo",
		library: "Select from library"
	}
});
Q.setObject("Q.text_en.Q.imagepicker", Q.text.Q.imagepicker);

/**
 * Q Tools
 * @module Q-tools
 */

/**
 * jQuery plugin that allows to choose and upload an image to the server by clicking / tapping on it.
 * Works on various platforms (desktop and mobile etc) in similar way. On mobiles allows to choose picture
 * from photo library or take an instant camera photo if OS supports such functionality.
 * Should be applied to <img /> element like this $('#someimg').plugin('Q/imagepicker', options).
 * @class Q imagepicker
 * @constructor
 * @param {Object} [options] options is an Object that contains parameters for function
 * @param {Object} options.saveSizeName Required hash where key is the preferred image size and value is the image name. Several key-value pairs may be given and image will be generated and saved in different files.
*   Key may be just one number, e.g. '100' which means square image 100x100 or in format '<width>x<height>', e.g. '80x120' to make non-square image.
 *  You can have one of <width> or <height> be empty, and then it will automatically keep the proportions.
 *  Or you can pass 'x' and then it will keep the original width and height of the image.
 * @default {}
 * @param {String} [options.url] url is a url to post to.
 * @param {String} [options.path="uploads"] Can be a URL path or a function returning a URL path. It must exist on the server.
 * @param {String|Function} [options.subpath=""] A subpath which may be created on the server if it doesn't already exist. If this is a function, it is executed right before the request is sent.
 * @param {String} [options.showSize=null] showSize is a key in saveSizeName to show on success.
 * @param {String} [options.useAnySize=false] whether to tell the server to accept any size without complaining.
 * @param {Object} [options.crop] crop If provided, the image will be cropped according to the given parameters before it is saved on the server in the saveSizeName formats. If the browser supports it, the cropping will occur in the browser.
 *   @param {Number} [options.crop.x] left for cropping
 *   @param {Number} [options.crop.y] top for cropping
 *   @param {Number} [options.crop.w] width for cropping
 *   @param {Number} [options.crop.h] height value for cropping
 * @param {Boolean} [options.cropping=true] Whether to display an interface for selecting cropping images, before sending them to the server. If true, the cropping area overrides the crop option.
 * @default Q.action('Q/image')
 * @param {Q.Event} [options.preprocess] preprocess is a function which is triggering before image upload.
 * Its "this" object will be a jQuery of the imagepicker element
 * The first parameter is a callback, which should be called with an optional
 * hash of overrides, which can include "data", "path", "subpath", "save", "url", "loader" and "crop"
 * @param {Array} [options.cameraCommands] cameraCommands the commands that pop up to take a photo
 * @param {Array} [options.cameraCommands.photo]
 * @param {Array} [options.cameraCommands.library]
 * @param {Array} [options.cameraCommands.cancel]
 * @param {Q.Event} [options.onClick] onClick is an event to execute during the click, which may cancel the click
 * @param {Q.Event} [options.onSuccess] onSuccess is Q.Event which is called on successful upload. First parameter will be the server response with
 * an object in a format similar to the 'saveSizeName' field.
 * @param {Q.Event} [options.onError] onError Q.Event which is called if upload failed.
 * @param {Q.Event} [options.onTooSmall] onError Q.Event which is called if an image is selected that's too small for one of the sizes in saveSizeName. Return false to abort.
 * @param {Q.Event} [options.onFinish] onError Q.Event which is called at the end, whatever the outcome.
 * @param {Q.Event} [options.onCropping] Happens when the cropping dialog appears, in case you want to display hints or something.
 */
Q.Tool.jQuery('Q/imagepicker', function _Q_imagepicker(o) {
	var $this = this;
	var state = $this.state('Q/imagepicker');
	if (Q.isEmpty(o.saveSizeName)) {
		throw new Q.Error("Q/imagepicker: saveSizeName is required");
	}
	state.input = $('<input type="file" accept="image/gif, image/jpeg, image/png" class="Q_imagepicker_file" />');
	state.input.css({
		'visibility': 'hidden',
		'height': '0',
		'width': '0',
		'top': '0',
		'left': '0',
		'position': 'absolute'
	});
	var originalSrc = $this.attr('src');
	if (originalSrc && originalSrc.indexOf('?') < 0) {
		// cache busting
		$this.attr('src', Q.url(originalSrc, null, {cacheBust: state.cacheBust}));
	}
	$this.before(state.input);
	$this.addClass('Q_imagepicker');
	Q.addStylesheet('{{Q}}/css/imagepicker.css', { slotName: 'Q' });
	
	function _process() {
		var state = $this.state('Q/imagepicker');
		state.oldSrc = $this.attr('src');
		if (state.throbber) {
			$this.attr('src', Q.url(state.throbber));
		}
		$this.addClass('Q_uploading');
		if (!window.FileReader) {
			// make it work in IE8 and IE9
			return _doUpload(null, null);
		}
		var reader = new FileReader();
		reader.onload = function(event) {
			$this.plugin('Q/imagepicker', 'pick', this.result);
		};
		reader.onerror = function () { 
			setTimeout(function() { 
				Q.alert(Q.text.Q.imagepicker.errorReadingFile);
			}, 0);
		};
		state.file = this.files[0];
		reader.readAsDataURL(state.file);

		// clear the input, see http://stackoverflow.com/a/13351234/467460
		state.input.wrap('<form>').closest('form').get(0).reset();
		state.input.unwrap();
	}

	if (navigator.camera) {
		// "file" input type is not supported
		$this.on([Q.Pointer.click, '.Q_imagepicker'], function(e) {
			var state = $this.state('Q/imagepicker');
			if (false === Q.handle(state.onClick, $this, [])) {
				return false;
			}
			Q.confirm(state.cameraCommands.prompt, function(result) {
				if (result == null) return;
				var source = Camera.PictureSourceType[result ? "CAMERA" : "PHOTOLIBRARY"];
				navigator.camera.getPicture(function(data){
					$this.plugin('Q/imagepicker', 'pick', "data:image/jpeg;base64," + data);
				}, function(msg){
					alert(msg);
				}, { quality: 50,
					sourceType: source,
					destinationType: Camera.DestinationType.DATA_URL
				});
			}, {
				ok: state.cameraCommands.photo,
				cancel: state.cameraCommands.library,
				noClose: false
			});
			e.preventDefault();
			e.stopPropagation();
			Q.Pointer.ended();
		});
	} else {
		// natively support "file" input
		$this.on([Q.Pointer.click, '.Q_imagepicker'], function(e) {
			state.input.click();
			e.preventDefault();
			e.stopPropagation();
		});
		state.input.click(function (e) {
			var state = $this.state('Q/imagepicker');
			if (false === Q.handle(state.onClick, $this, [])) {
				return false;
			}
			Q.Pointer.stopHints();
			e.stopPropagation();
		});
		state.input.change(function () {
			if (!this.value) {
				return; // it was canceled
			}
			Q.Pointer.stopHints();
			_process.call(this);
		});
		function _cancel(e) {
			e.preventDefault();
		}
		$this.on({
			 "dragover.Q_imagepicker": _cancel,
			 "dragenter.Q_imagepicker": _cancel,
			 "drop.Q_imagepicker": function _Q_imagepicker_drop(e) {
				 _process.call(e.originalEvent.dataTransfer);
				 e.preventDefault();
			 }
		});
	}
	$this.on([Q.Pointer.fastclick, '.Q_imagepicker'], function (e) {
		e.stopPropagation();
	});
},

{
	path: 'Q/uploads',
	subpath: '',
	saveSizeName: {},
	showSize: null,
	useAnySize: false,
	crop: null,
	cropping: true,
	croppingTitle: 'Adjust size and position',
	croppingTouchscreen: 'Use your fingers to zoom and drag',
	croppingNotTouchscreen: 'Use your mouse & wheel to zoom and drag',
	url: Q.action("Q/image"),
	cacheBust: 1000,
	throbber: null,
	preprocess: null,
	cameraCommands: Q.text.Q.imagepicker.cameraCommands,
	onClick: new Q.Event(),
	onSuccess: new Q.Event(function() {}, 'Q/imagepicker'),
	onError: new Q.Event(function(message) {
		alert('Image upload error' + (message ? ': ' + message : '') + '.');
	}, 'Q/imagepicker'),
	onTooSmall: new Q.Event(function (requiredSize, imageSize) {
		alert('Please choose a larger image.');
		return false;
	}, 'Q/imagepicker'),
	onFinish: new Q.Event(),
	onCropping: new Q.Event()
},

{
	/**
	 * Set the image in the imagepicker
	 * @method pick
	 */
	pick: function (src, callback) {
		
		var $this = this;
		var state = $this.state('Q/imagepicker');
		_upload.call(this, src);
		
		function _callback (err, res) {
			var state = $this.state('Q/imagepicker');
			var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(res && res.errors);
			if (msg) {
				$this.attr('src', state.oldSrc).stop().removeClass('Q_uploading');
				return Q.handle([state.onError, state.onFinish], $this, [msg]);
			}
			var key = state.showSize;
			if (!key) {
				// by default set src equal to first element of the response
				key = Q.firstKey(res.slots.data, {nonEmpty: true});
			}
			var c = Q.handle([state.onSuccess, state.onFinish], $this, 
				[res.slots.data, key, state.file || null]
			);
			if (c !== false && key) {
				$this.attr('src', 
					Q.url(res.slots.data[key], null, {cacheBust: state.cacheBust})
				);
			}
			$this.removeClass('Q_uploading');
		}
	
		function _upload(data) {
			if (state.preprocess) {
				state.preprocess.call($this, _doCropping);
			} else {
				_doCropping();
			}
		
			function _doCropping(override) {
			
				function _calculateRequiredSize (saveSizeName, imageSize, rotated) {
			        var widths = [], heights = [];
			        Q.each(saveSizeName, function(key, size) {
			            var parts = key.split('x');
						var w = parseInt(parts[0] || 0);
						var h = (parts.length === 2) ? parseInt(parts[1] || 0) : w;
						var r = imageSize.width / imageSize.height;
						widths.push(w || h * r || imageSize.width);
						heights.push(h || w / r || imageSize.height);
			        });
					var width = Math.max.apply( Math, widths );
					var height = Math.max.apply( Math, heights );

			        return { width: width, height: height };
			    };
	
				function _checkRequiredSize(requiredSize, imageSize) {
					if (state.useAnySize) {
						return true;
					}
					if (requiredSize.width > imageSize.width
					 || requiredSize.height > imageSize.height) {
						var result = Q.handle(
							[state.onTooSmall, state.onFinish], state, 
							[requiredSize, imageSize]
						);
						if (result === false) {
							return false;
						}
					}
					return true;
			    }
			
		        function _selectionInfo(requiredSize, imageSize) {
		            if (!_checkRequiredSize(requiredSize, imageSize)) {
		            	return _revert();
		            }
		            var result = {};
		            if ( requiredSize.width && requiredSize.height ) {
		//              if specified two dimensions - we should remove small size to avoid double reductions
		                if ( requiredSize.width > requiredSize.height ) {
		                    requiredSize.height = null;
		                } else {
		                    requiredSize.width = null;
		                }

		            }
					var rqw = requiredSize.width;
					var rqh = requiredSize.height;
					var iw = imageSize.width;
					var ih = imageSize.height;
		            if (rqw) {
		                result.width = rqw;
		                result.height = Math.ceil(imageSize.height * rqw/imageSize.width);
		            }
		            if (rqh) {
		                result.height = rqh;
		                result.width = Math.ceil(imageSize.width * rqh/imageSize.height);
		            }
					result.left = (iw-result.width)/2;
					result.top = (ih-result.height)/2;
		            return result;
		        };
			
	            function _doCanvasCrop (src, bounds, orientation, callback) {
					// nothing to crop
					if ( ! src || ! bounds ) {
					    throw new Q.Exception('Q/imagepicker: src and bounds are required!');
					}
				
					var canvas = $('<canvas style="display:none"></canvas>').appendTo('body')[0];
				
					if (!( canvas && canvas.getContext('2d') )) {
						return callback.call(this, src, params.crop);
					}
				
					canvas.width = bounds.requiredSize.width;
					canvas.height = bounds.requiredSize.height;
		
					var $img = $('<img />').on('load', function() {
					    // draw cropped image
					    var sourceLeft = bounds.left;
					    var sourceTop = bounds.top;
					    var sourceWidth = bounds.width;
					    var sourceHeight = bounds.height;
					    var destLeft = 0;
					    var destTop = 0;
					    var destWidth = bounds.requiredSize.width;
					    var destHeight = bounds.requiredSize.height;
						var context = canvas.getContext('2d');
						switch (orientation) {
						case 8:
							context.translate(-canvas.width, 0); 
							context.rotate(-90*Math.PI/180);
							break;
						case 3:
							context.translate(canvas.width, canvas.height); 
							context.rotate(180*Math.PI/180);
							break;
						case 6:
							context.translate(canvas.width, 0); 
							context.rotate(90*Math.PI/180);
							break;
					    }
						var rotated = (orientation === 8 || orientation === 6);
						var dw = rotated ? destHeight : destWidth;
						var dh = rotated ? destWidth : destHeight;
					    drawImageIOSFix(
							context, $img[0],
							sourceLeft, sourceTop, sourceWidth, sourceHeight,
							destLeft, destTop, dw, dh
						);
					    var imageData = canvas.toDataURL();
					    $(canvas).remove();
						$img.remove();
					    callback.call(this, imageData, null);
					}).attr('src', src)
					.css('display', 'none')
					.appendTo('body');
				};
			
				function _onImgLoad() {

					Q.addScript(EXIFjslib, function () {
						EXIF.getData(img, function () {
							var orientation = this.exifdata.Orientation;
							var rotated = (orientation === 8 || orientation === 6);
							var isw = img.width;
							var ish = img.height;
							var temp = null;
							if (rotated) {
								temp = isw;
								isw = ish;
								ish = temp;
							}
							imageSize = {
								width: isw,
								height: ish
							};
							var requiredSize  = _calculateRequiredSize(
								state.saveSizeName, {width: isw, height: ish}, rotated
							);
							if (!_checkRequiredSize(requiredSize, imageSize)) {
								return _revert();
							}
						
							if (state.cropping && !state.saveSizeName.x) {
			                    var $croppingElement = $('<img />').attr({ src: img.src })
									.css({'visibility': 'hidden'});
								var $title = $('<div />')
									.addClass('Q_imagepicker_cropping_title')
									.html(state.croppingTitle);
								var $explanation = $('<div />')
									.addClass('Q_imagepicker_cropping_explanation')
									.html(Q.info.isTouchscreen
										? state.croppingTouchscreen
										: state.croppingNotTouchscreen
									);
								var $croppingTitle = $('<div />').append(
									$title, $explanation
								);
			                    Q.Dialogs.push({
			                        className: 'Q_dialog_imagepicker',
			                        title: $croppingTitle,
			                        content: $croppingElement,
			                        destroyOnClose: true,
									apply: true,
			                        onActivate : {
			                            "Q/imagepicker": function ($dialog) {
											var w = requiredSize.width / isw;
											var h = requiredSize.height / ish;
											var rsw1 = rsw2 = requiredSize.width;
											var rsh1 = rsh2 = requiredSize.height;
											var dw = this.width();
											var dh = this.height();
											if (rsw2 != dw) {
												rsh2 *= dw / rsw1;
												rsw2 = dw;
											}
											// if (rsh2 > dh) {
											// 	rsw2 *= dh / rsh2;
											// 	rsh2 = dh;
											// }
											var maxScale = Math.min(rsw2 / rsw1, rsh2 / rsh1);
				                            $croppingElement.plugin('Q/viewport', {
			                                    initial: {
													x: 0.5, 
													y: 0.5, 
													scale: Math.max(rsw2 / isw, rsh2 / ish)
												},
												width: rsw2,
												height: rsh2,
												maxScale: maxScale
			                                }, function () {
			                                	$croppingElement.css({'visibility': 'visible'});
												Q.handle(state.onCropping, $this, [
													$dialog,
													$croppingTitle,
													$croppingElement
												]);
			                                });
			                            }
			                        },
			                        beforeClose: function(dialog) {
										var state = $('.Q_viewport', dialog).state('Q/viewport');
					                    var result = state.selection;
					                    var bounds = {
					                        requiredSize: requiredSize,
					                        left: result.left * isw,
					                        top: result.top * ish,
					                        width: Math.max(
												result.width * isw, requiredSize.width
											),
					                        height: Math.max(
												result.height * ish, requiredSize.height
											)
					                    };
					                    if (!_checkRequiredSize(requiredSize, bounds)) {
					                    	return _revert();
					                    }
										var temp;
										if (orientation === 6) {
											temp = bounds.width;
											bounds.width = bounds.height;
											bounds.height = temp;
											temp = bounds.left;
											bounds.left = bounds.top;
											bounds.top = isw - temp - bounds.height;
										} else if (orientation === 8) {
											temp = bounds.height;
											bounds.height = bounds.width;
											bounds.width = temp;
											temp = bounds.top;
											bounds.top = bounds.left;
											bounds.left = ish - temp - bounds.width;
										} else if (orientation === 3) {
											bounds.top = ish - bounds.top - bounds.height;
											bounds.left = isw - bounds.left - bounds.width;
										}
										if (!bounds) return;
					                    _doCanvasCrop(img.src, bounds, orientation,
										function(data, crop) {
											params.data = data;
											params.crop = crop;
											_doUpload(params, data);
					                    });
			                        }
			                    });
							} else {
								var bounds = _selectionInfo(requiredSize, imageSize);
								bounds.requiredSize = requiredSize;
			                    _doCanvasCrop(img.src, bounds, orientation,
								function(data, crop) {
									params.data = data;
									params.crop = crop;
									_doUpload(params, data);
			                    });
							}
						});
					});
				}
			
				var EXIFjslib = '{{Q}}/js/exif.js';
				Q.addScript(EXIFjslib); // start loading it
			
				var params = {
					data: data
				};
				Q.extend(params, override);
			
				if ((!state.cropping && !state.crop)
				|| state.saveSizeName.x) {
					_doUpload(override, data);
					return;
				}
			
				var img = new Image;
				img.onload = _onImgLoad;
				img.src = params.data;
			}
		}
	
		function _doUpload(override, data) {
			var state = $this.state('Q/imagepicker');
			if (override === false || (override && override.cancel)) {
				return _revert();
			}
			var path = state.path;
			path = (typeof path === 'function') ? path() : path;
			var subpath = state.subpath;
			subpath = (typeof subpath === 'function') ? subpath() : subpath;
			var params = {
				'data': data,
				'path': path,
				'subpath': subpath,
				'save': state.saveSizeName,
				'url': state.url,
				'loader': state.loader,
				'crop': null
			};
			Q.extend(params, override);
			if (Q.isEmpty(params.crop)) {
				delete params.crop;
			}
			if (params.save && !params.save[state.showSize]) {
				throw new Q.Error("Q/imagepicker tool: no size found corresponding to showSize");
			}
		
			if (params.loader) {
				var callable = params.loader;
				delete params.loader;
				Q.handle(callable, null, [params, _callback]);
			} else {
				var url = params.url;
				delete params.url;
				if (window.FileReader) {
					Q.request(url, 'data', _callback, {
						fields: params,
						method: 'POST'
					});
				} else {
					delete params.data;
					state.input.wrap('<form />', {
						method: 'POST',
						action: Q.url(url, params)
					}).parent().submit();
					state.input.unwrap();
				}
			}
		}
	
		function _revert() {
			var state = $this.state('Q/imagepicker');
			$this.attr('src', state.oldSrc)
				.stop()
				.removeClass('Q_uploading');
		}
	
	   function detectVerticalSquash(img) {
	       var iw = img.naturalWidth, ih = img.naturalHeight;
	       var canvas = document.createElement('canvas');
	       canvas.width = 1;
	       canvas.height = ih;
	       var ctx = canvas.getContext('2d');
	       ctx.drawImage(img, 0, 0);
	       var data = ctx.getImageData(0, 0, 1, ih).data;
	       // search image edge pixel position in case it is squashed vertically.
	       var sy = 0;
	       var ey = ih;
	       var py = ih;
	       while (py > sy) {
	           var alpha = data[(py - 1) * 4 + 3];
	           if (alpha === 0) {
	               ey = py;
	           } else {
	               sy = py;
	           }
	           py = (ey + sy) >> 1;
	       }
	       var ratio = (py / ih);
	       return (ratio===0)?1:ratio;
	   }

	   function drawImageIOSFix(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh) {
	       var vertSquashRatio = detectVerticalSquash(img);
	    // Works only if whole image is displayed:
	    // ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh / vertSquashRatio);
	    // The following works correct also when only a part of the image is displayed:
	       ctx.drawImage(img, sx * vertSquashRatio, sy * vertSquashRatio, 
	                          sw * vertSquashRatio, sh * vertSquashRatio, 
	                          dx, dy, dw, dh );
	   }
	},
	
	/**
	 * Removes the imagepicker functionality from the element
	 * @method remove
	 */
	remove: function () {
		return this.each(function() {
			var $this = $(this);
			$this.off('.Q_imagepicker');
			if ($this.next().hasClass('Q_imagepicker_file')) {
				$this.next().remove();
			}
		});
	}
});

})(Q, jQuery, window, document);
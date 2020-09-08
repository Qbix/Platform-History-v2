(function (window, Q, $, undefined) {

/**
 * @module Q
 */

/**
 * @class Q audio
 * @constructor
 * @param {Object} [options] Override various options for this tool
 *  @param {String} [options.url] URL of audio stream
 *  @param {boolean} [options.autoplay=false] If true - start play on load
 */

Q.Tool.define("Q/audio", function (options) {
	var tool = this;
	var state = tool.state;

	if (state.url) {
		state.url = state.url.interpolate({ "baseUrl": Q.info.baseUrl });
	}

	// convert to milliseconds, as we use milliseconds everywhere for calculations
	state.maxRecordTime *= 1000;

	tool.adapters = {
		"soundcloud": {
			implement: function () {
				var url = 'https://w.soundcloud.com/player/?' + $.param({
					url: state.url,
					auto_start: state.autoplay,
					buying: false,
					sharing: false,
					download: false
				});

				Q.Template.render('Q/audio/soundcloud', {
					url: url
				}, function (err, html) {
					tool.element.innerHTML = html;
				});

				Q.addScript('https://w.soundcloud.com/player/api.js', function () {
					state.audio = SC.Widget(tool.$("iframe[name=soundcloud]")[0]);
					var onPlay = Q.throttle(function (position) {
						console.log("Started at position " + position + " milliseconds");
						Q.handle(state.onPlay, tool, [position]);
					}, 100);
					var onPause = Q.throttle(function (position) {
						console.log("Paused at position " + position + " milliseconds");
						Q.handle(state.onPause, tool, [position]);
					}, 100);
					var onFinish = Q.throttle(function (position) {
						console.log("Finished at position " + position + " milliseconds");
						Q.handle(state.onEnded, tool, [position]);
					}, 100);
					state.audio.bind(SC.Widget.Events.READY, function() {
						state.audio.bind(SC.Widget.Events.PLAY, function() {
							// get current sound position in milliseconds
							state.audio.getPosition(onPlay);
						});
						state.audio.bind(SC.Widget.Events.PAUSE, function() {
							// get current sound position in milliseconds
							state.audio.getPosition(onPause);
						});
						state.audio.bind(SC.Widget.Events.FINISH, function() {
							onPause(state.currentPosition);
							// get current sound position in milliseconds
							state.audio.getPosition(onFinish);
						});
						/*state.audio.bind(SC.Widget.Events.SEEK, function() {
							onPause(state.currentPosition);
							// get current sound position in milliseconds
							console.log("onSeek");
							state.audio.getPosition(onPlay);
						});*/
						state.audio.bind(SC.Widget.Events.PLAY_PROGRESS, function() {
							state.audio.getPosition(function (position) {
								state.currentPosition = position;
								Q.handle(state.onPlaying, tool, [position]);
							});
						});
						state.audio.getDuration(function(duration) {
							state.duration = duration;

							Q.handle(state.onLoad, tool);
						});
					});
				});
			},
			renderPlayer: function () {
				tool.$("iframe[name=soundcloud]").show();
			},
			play: function () {
				state.audio.play();
			},
			pause: function () {
				state.audio.pause();
			},
			setCurrentPosition: function (position) {
				state.audio.seekTo(position);
			}
		},
		"general": {
			implement: function () {
				tool.implementNativeAudio();

				tool.audioElement.addEventListener("canplay", function(){
					if (state.autoplay) {
						tool.play();
					}
				});
			},
			renderPlayer: function () {
				tool.audioElement.setAttribute('controls', true);
				$(tool.element).append(tool.audioElement);
			},
			play: function () {
				tool.implementNativeAudio();

				var promise = tool.audioElement.play();

				if(typeof promise === 'undefined') {
					return;
				}

				tool.userGesture("play", promise);
			},
			pause: function () {
				tool.implementNativeAudio();

				var promise = tool.audioElement.pause();

				if (typeof promise === 'undefined') {
					return;
				}

				tool.userGesture("pause", promise);
			},
			setCurrentPosition: function (position) {
				tool.audioElement.currentTime = position/1000;
			}
		}
	};

	var p = Q.pipe(['stylesheet', 'text', 'stream'], function (params, subjects) {
		tool.text = params.text[1].audio;

		tool.implement();

		// run action
		Q.handle(tool[state.action], tool);
	});

	Q.addStylesheet("{{Q}}/css/audio.css", p.fill('stylesheet'), { slotName: 'Q' });
	Q.Text.get('Q/content', p.fill('text'));

	tool.stream = null;
	if (state.publisherId && state.streamName) {
		Q.Streams.get(state.publisherId, state.streamName, function () {
			tool.stream = this;
			p.fill('stream')();
		});
	} else {
		p.fill('stream')();
	}
},

{
	action: "recorder",
	url: null,
	autoplay: false,
	display: "classic", // "compact" | "soundcloud"
	/* <Q/audio jquery plugin states> */
	publisherId: null,
	streamName: null, // create stream or edit
	pie: { // default Q/pie options
		fraction: 0,
		borderSize: 5,
		size: null
	},
	maxRecordTime: 10, // seconds
	fileUploadUHandler: Q.action("Q/file"),
	preprocess: null,
	duration: 0,
	currentPosition: 0,
	clipStart: null,
	clipEnd: null,
	onSuccess: new Q.Event(),
	onError: new Q.Event(function (message) {
		alert('Flie upload error' + (message ? ': ' + message : '') + '.');
	}, 'Q/audio'),
	onFinish: new Q.Event(),
	/* </Q/audio jquery plugin states> */
	onLoad: new Q.Event(),
	onPlay: new Q.Event(function () {
		// set box attribute to apply valid styles
		this.pieBox && this.pieBox.attr("data-state", "pause");
	}),
	onPlaying: new Q.Event(function () {
		var tool = this;
		var state = this.state;

		if(state.action === "recorder"){
			state.recordTimeElement.html(tool.formatRecordTime(state.duration - state.currentPosition) + '/' + tool.formatRecordTime(state.duration));
		}

		if (tool.pieTool) {
			tool.pieTool.state.fraction = 100 * state.currentPosition / state.duration;
			tool.pieTool.stateChanged('fraction');
		}

		// clipStart handler
		if (state.clipStart && state.currentPosition < state.clipStart) {
			tool.setCurrentPosition(state.clipStart);
		}
		// clipStart handler
		if (state.clipEnd && state.currentPosition > state.clipEnd) {
			tool.setCurrentPosition(state.clipEnd);
			tool.pause();
		}
	}),
	onPause: new Q.Event(function () {
		// stop timer if exist
		if(this.state.playIntervalID) {
			clearInterval(this.state.playIntervalID);
			this.state.playIntervalID = false;
		}

		// set box attribute to apply valid styles
		this.pieBox && this.pieBox.attr("data-state", "play");
	}),
	onSeek: new Q.Event(),
	onEnded: new Q.Event()
},

{
	/**
	 * Refreshes the appearance of the tool completely
	 * @method implement
	 */
	implement: function () {
		var adapterName = this.adapterNameFromUrl();
		this.adapters[adapterName].implement();
	},
	/**
	 * Start audio creation dialog
	 * @method start
	 */
	recorder: function () {
		var tool = this;
		var state = this.state;
		var hasUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
		var isComposer = !tool.stream;

		tool.implementNativeAudio();

		/**
		 * Process composer submitting
		 * @method _process
		 */
		var _process = function() {
			var $clipStart = $("input[name=clipStart]", state.mainDialog);
			var $clipEnd = $("input[name=clipEnd]", state.mainDialog);

			state.mainDialog.addClass('Q_uploading');

			// url defined
			var url = $("input[name=url]", state.mainDialog).val();
			if (url) {
				Q.req('Websites/scrape', ['result'], function (err, response) {
					var msg = Q.firstErrorMessage(err, response && response.errors);
					if (msg) {
						Q.Dialogs.pop();
						return console.warn("Q/audio: " + msg);
					}

					var siteData = response.slots.result;

					var params = {
						title: siteData.title,
						content: siteData.description,
						icon: siteData.bigIcon,
						attributes: {
							host: siteData.host,
							smallIcon: siteData.smallIcon,
							url: url,
							'Q.file.url': "",
							'file.url': "",
							clipStart: state.clipStart,
							clipEnd: state.clipEnd
						}
					};

					// edit stream
					if (tool.stream) {
						Q.each(params, function (name, value) {
							tool.stream.pendingFields[name] = value;
						});
						tool.stream.save({
							onSave: function () {
								Q.handle([state.onSuccess, state.onFinish], tool, [params]);
								Q.Dialogs.pop();
							}
						});
					} else {
						// new stream
						Q.handle([state.onSuccess, state.onFinish], tool, [params]);
						Q.Dialogs.pop();
					}
				}, {
					method: 'post',
					fields: {url: url}
				});

				return;
			}

			var $file = $("input[type=file]", state.mainDialog);
			// state.file set in recorder OR html file element
			var file = state.file || $file[0].files[0];
			if (file) {
				var reader = new FileReader();
				reader.onload = function (event) {
					if (state.preprocess) {
						Q.handle(state.preprocess, tool);
					}

					var params = {
						title: file.name,
						attributes: {
							clipStart: state.clipStart,
							clipEnd: state.clipEnd
						},
						file: {
							data: this.result,
							audio: true
						}
					};

					if(state.publisherId && state.streamName) { // if edit existent stream
						params.publisherId = state.publisherId;
						params.streamName = state.streamName;
						params.file.name = file.name;

						if (window.FileReader) {
							Q.request(state.fileUploadUHandler, 'data', function (err, res) {
								//console.log(this);
								var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(res && res.errors);
								if (msg) {
									if(state.mainDialog) state.mainDialog.removeClass('Q_uploading');
									return Q.handle([state.onError, state.onFinish], tool, [msg]);
								}

								// by default set src equal to first element of the response
								var key = Q.firstKey(res.slots.data, {nonEmpty: true});

								var c = Q.handle([state.onSuccess, state.onFinish], tool, [res.slots.data, key, file || null]);

								Q.Dialogs.pop();
							}, {
								fields: params,
								method: "put"
							});
						} else {
							Q.alert('FileReader undefined');
							/*
                            delete params.data;
                            state.input.wrap('<form />', {
                                method: "put",
                                action: Q.url(state.fileUploadUHandler, params)
                            }).parent().submit();
                            state.input.unwrap();
                            */
						}
					} else { // if new stream
						Q.handle([state.onSuccess, state.onFinish], tool, [params]);
						Q.Dialogs.pop();
					}
				};
				reader.onerror = function () {
					setTimeout(function () {
						callback("Error reading file", res);
					}, 0);
				};

				reader.readAsDataURL(file);
				return;
			}

			// edit stream
			if (tool.stream) {
				tool.stream.setAttribute("clipStart", state.clipStart);
				tool.stream.setAttribute("clipEnd", state.clipEnd);
				tool.stream.save({
					onSave: function () {
						Q.handle([state.onSuccess, state.onFinish], tool);
						Q.Dialogs.pop();
					}
				});
			}
		};

		Q.Dialogs.push({
			className: 'Q_dialog_audio',
			title: "Audio",
			template: {
				name: 'Q/audio/composer',
				fields: {
					maxRecordTime: tool.formatRecordTime(state.maxRecordTime),
					textAllowMicrophoneAccess: tool.text.allowMicrophoneAccess,
					isComposer: isComposer,
					text: tool.text
				}
			},
			destroyOnClose: true,
			onActivate : function (mainDialog) {
				state.mainDialog = mainDialog;

				var pieBox = tool.pieBox = $(".Q_audio_pie", mainDialog);
				var pieElement = Q.Tool.setUpElement('div', 'Q/pie');
				var $pieElement = $(pieElement);

				// set some elements
				state.recordTimeElement = $(".Q_audio_record_recordTime", mainDialog);
				state.recordTextElement = $(".Q_audio_record_recordText", mainDialog);
				state.recordElapsedElement = $(".Q_audio_record_elapsed", mainDialog);
				state.recordEncodingElement = $(".Q_audio_encoding", mainDialog);

				// add Q/pie tool
				pieBox.append(pieElement).activate(function(){
					tool.pieTool = this;
				});

				// set Q/pie tool handler
				$pieElement.on(Q.Pointer.fastclick, function(event){
					event.stopPropagation();
					event.preventDefault();

					var pieTool = tool.pieTool;
					var recorderState = state.recorderState;

					// click on arc border - means change play position
					if(!pieTool.state.clickPos.inside && recorderState === "playing"){
						tool.audioElement.currentTime = tool.audioElement.duration/100*pieTool.state.clickPos.anglePercent;
						return;
					}

					// set pie state
					if(!recorderState) recorderState = "init";
					else if(recorderState === "ready") recorderState = "recording";
					else if(recorderState === "recording") recorderState = "recorded";
					else if(recorderState === "playing") recorderState = "play";
					else if(recorderState === "play") recorderState = "playing";

					tool.recorderStateChange(recorderState);
				});

				var clipFields = {
					mode: "composer",
					onStart: function (time) {
						state.clipStart = time;
					},
					onEnd: function (time) {
						state.clipEnd = time;
					}
				};

				// if stream defined, render player
				if (tool.stream) {
					$(".Q_audio_player", mainDialog).tool("Q/audio", {
						action: "renderPlayer",
						url: tool.stream.fileUrl(),
						onPlaying: function () {
							if (tool.clipTool) {
								tool.clipTool.setTime(this.state.currentPosition, 'start');
								tool.clipTool.setTime(this.state.currentPosition, 'end');
							}
						}
					}).activate();

					clipFields.mode = "editor";
					clipFields.start = tool.stream.getAttribute('clipStart');
					clipFields.end = tool.stream.getAttribute('clipEnd');
				}

				$(".Q_audio_clip", mainDialog).tool("Q/clip", clipFields).activate(function () {
					tool.clipTool = this;
				});

				// save by URL
				$("button[name=save]", mainDialog).on(Q.Pointer.click, function (e) {
					e.preventDefault();
					e.stopPropagation();

					mainDialog.addClass('Q_uploading');

					var _error = function (err) {
						mainDialog.removeClass('Q_uploading');
						Q.alert(err);
					};
					var action = mainDialog.attr("data-action");

					if (action === 'record') {
						// wait while track encoded
						if(typeof state.dataBlob === 'undefined') {
							return _error(tool.text.errorNoSource);
						}

						state.file = state.dataBlob;
						state.file.name = "audio.mp3";
					} else if (action === 'upload') {
						if (!$("input[type=file]", mainDialog).val()) {
							return _error(tool.text.invalidFile);
						}

						Q.handle(_process, mainDialog);
					} else if (action === 'link') {
						var url = $("input[name=url]", mainDialog).val();
						if (!url.matchTypes('url').length) {
							return _error(tool.text.invalidURL);
						}
					} else if (isComposer) {
						return _error(tool.text.errorNoSource);
					}

					Q.handle(_process, mainDialog);
				});

				// custom tabs implementation
				$(".Q_audio_record_select button", mainDialog).on(Q.Pointer.click, function (e) {
					var $this = $(this);
					var action = $this.prop('name');

					if (action === "record") {
						tool.recorderStateChange("init");
					}

					mainDialog.attr("data-action", action);
					$this.addClass('Q_selected').siblings().removeClass('Q_selected');
					$(".Q_audio_record_content [data-content=" + action + "]", mainDialog).addClass('Q_selected').siblings().removeClass('Q_selected');
				});

				// Reset button
				$("button[name=reset]", mainDialog).on(Q.Pointer.click, function (e) {
					state.dataBlob = undefined;
					tool.recorderStateChange("init");
				});
			},
			beforeClose: function(mainDialog) {
				// clear recorder stream when dialog close.
				// In this case every time dialog opened - user should allow to use microphone
				if(state.recorder && state.recorder.stream) state.recorder.clearStream();
			}
		});
	},
	/**
	 * Handle recorder states
	 * @method recorderStateChange
	 * @param {string} newState New recorder state
	 */
	recorderStateChange: function(newState){
		var tool = this;
		var state = this.state;

		tool.implementNativeAudio();

		state.recorderState = newState;

		// set dialog attribute to style dialog according to newState
		state.mainDialog.attr("data-state", newState);

		// set pieBox attribute to style player according to newState
		tool.pieBox.attr("data-state", newState);

		// init recorder
		if(newState === "init"){
			// reset pie tool to start point
			if(tool.pieTool){
				state.currentRecordTime = state.maxRecordTime;

				state.recordTextElement.html(tool.text.record);
				state.recordElapsedElement.html(tool.text.maximum);
				//state.recordTimeElement.show();
				state.recordTimeElement.html(tool.formatRecordTime(state.currentRecordTime));
				tool.pieTool.initPos();
			}

			// if recorder exists - just change state to "ready"
			if(state.recorder && state.recorder.stream){
				tool.recorderStateChange("ready");
				return;
			}

			//if recorder don't exist - create one
			tool.audio.recorderInit({
				onStreamReady: function(){
					state.recorder = tool.audio.recorder;

					// when recorder created - change state to "ready"
					tool.recorderStateChange("ready");
				},
				onDataAvailable: function(){
					var e = this;

					state.dataBlob = new Blob( [e.detail], { type: 'audio/mp3', name: "audio.mp3" } );
					tool.audioElement.src = URL.createObjectURL(state.dataBlob);
				}
			});
		}

		// play recorded track
		if(newState === "playing"){
			state.recordTextElement.html(tool.text.playing);
			tool.audioElement.play();
		}else{
			tool.audioElement.pause();
		}

		// ready to play
		if(newState === "play"){
			state.recordTextElement.html(tool.text.recorded);
			state.recordElapsedElement.html(tool.text.clip);
			state.recordTimeElement.html(tool.formatRecordTime(tool.audioElement.duration));
		}

		// recorder stoped
		if(newState === "recorded"){
			tool.pieTool.initPos();
		}

		// stop recording
		if(newState !== "recording"){
			// stop recording if recorder exist
			if(state.recorder){ state.recorder.stop(); }

			// stop recorder timer if exist
			if(state.recordIntervalID){
				clearInterval(state.recordIntervalID);
				state.recordIntervalID = false;
			}
			return;
		}

		// start record
		state.recorder.start();

		// set some elements text
		state.recordTextElement.html(tool.text.recording);
		state.recordElapsedElement.html(tool.text.remains);
		state.recordTimeElement.html(tool.formatRecordTime(state.maxRecordTime) + '/' + tool.formatRecordTime(state.maxRecordTime));

		// start recorder timer to handle all recorder interface actions
		state.recordIntervalID = setInterval(function(){
			// set currentRecordTime to maxRecordTime if undefined
			if(typeof state.currentRecordTime === 'undefined') state.currentRecordTime = state.maxRecordTime - 1000;

			// decrease currentRecordTime to 100 milliseconds
			state.currentRecordTime -= 100;

			// set time element text
			state.recordTimeElement.html(tool.formatRecordTime(state.currentRecordTime) + '/' + tool.formatRecordTime(state.maxRecordTime));

			// set Q/pie tool position (percents of currentRecordTime time from max maxRecordTime)
			tool.pieTool.state.fraction = 100*(state.maxRecordTime - state.currentRecordTime)/state.maxRecordTime;
			tool.pieTool.stateChanged('fraction');

			// max record time spent
			if(state.currentRecordTime <= 1){ tool.recorderStateChange("recorded"); }
		}, 100);
		//--------------------//
	},
	/**
	 * @method playAudio
	 * Play audio and detect promise event on mobile devices
	 */
	play: function(){
		var adapterName = this.adapterNameFromUrl();
		var adapter = this.adapters[adapterName];

		adapter.play();
	},
	renderPlayer: function () {
		var adapterName = this.adapterNameFromUrl();
		var adapter = this.adapters[adapterName];

		adapter.renderPlayer();
	},
	/**
	 * @method pauseAudio
	 * Pause audio and detect promise event on mobile devices
	 */
	pause: function(){
		var adapterName = this.adapterNameFromUrl();
		this.adapters[adapterName].pause();
	},
	/**
	 * @method userGesture
	 * User gesture handler for audio actions if promise != undefined (mobile devices)
	 * @param {string} action Player action (play, pause, ...)
	 * @param {object} promise Promise returned
	 */
	userGesture: function(action, promise){
		var tool = this;
		var pieTool = tool.$pieElement.clone().removeAttr("id");

		// we have promise on mobile device which need user gesture
		promise.then(function() {
			console.log('The play() Promise fulfilled!');
		}).catch(function(error) {
			console.log('The play() Promise rejected!');
			Q.Dialogs.push({
				className: 'Streams_audio_preview_dialog_promisePlay',
				content: pieTool,
				destroyOnClose: true,
				noClose: true,
				onActivate: function (dialog) {
					$(".Q_mask").on(Q.Pointer.fastclick, Q.Dialogs.pop);
					dialog.attr("data-state", tool.$playerBox.attr("data-state"));

					$(".Q_tool.Q_pie_tool", dialog).on(Q.Pointer.fastclick, function(event){
						event.stopPropagation();
						event.preventDefault();

						if(action === "play") {
							tool.audioElement.play();
						}

						if(action === "pause") {
							tool.audioElement.pause();
						}

						Q.Dialogs.pop();
					})
				},
				beforeClose: function(dialog){
					$(".Q_mask").off(Q.Pointer.fastclick, Q.Dialogs.pop);
				}
			});
		});
	},
	setCurrentPosition: function (position) {
		var adapterName = this.adapterNameFromUrl();
		this.adapters[adapterName].setCurrentPosition(position);
	},
	/**
	 * Audio player
	 * @method player
	 */
	player: function(){
		var tool = this;
		var state = this.state;
		tool.pieBox = $(tool.element);
		tool.$playerBox = $("<div>").appendTo(tool.pieBox);

		// set player state if it didn't set yet
		tool.pieBox.attr("data-state", tool.pieBox.attr("data-state") || "play");

		// set up the pie options
		var pieOptions = state.pie;

		// set up Q/pie tool and activate
		tool.$playerBox.addClass("Q_disabled").tool("Q/pie", pieOptions).activate(function(){
			var pieTool = tool.pieTool = this;
			var $pieElement = tool.$pieElement = $(pieTool.element);

			state.onLoad.add(function () {
				tool.$playerBox.removeClass("Q_disabled")
			});

			$pieElement.on(Q.Pointer.fastclick, function (event) {
				event.stopPropagation();
				event.preventDefault();

				// click on arc border - means change play position
				if(!pieTool.state.clickPos.inside){
					var newPosition = state.duration/100*pieTool.state.clickPos.anglePercent;
					tool.setCurrentPosition(newPosition);
					tool.play();
					return;
				}

				if (tool.pieBox.attr("data-state") === "play") {
					tool.play();
				} else {
					tool.pause();
				}
			});
		});
	},
	/**
	 * Get or create new Q.Audio with needed events to use later in tool
	 * @method implementNativeAudio
	 */
	implementNativeAudio: function () {
		var tool = this;
		var state = this.state;

		if (tool.audio) {
			return tool.audio;
		}

		tool.audio = new Q.Audio(state.url);
		tool.audioElement = tool.audio.audio;
		$(tool.audioElement).appendTo(tool.element);

		tool.audioElement.addEventListener('play', function () {
			state.currentPosition = this.currentTime * 1000;
			console.log("Started at position " + state.currentPosition + " milliseconds");
			Q.handle(state.onPlay, tool, [state.currentPosition]);

			// clear timer if exist
			if(state.playIntervalID) {
				clearInterval(state.playIntervalID);
			}

			// start new timer to change needed layout params during play
			state.playIntervalID = setInterval(function(){
				state.currentPosition = tool.audioElement.currentTime * 1000;

				Q.handle(state.onPlaying, tool, [state.currentPosition]);
			}, 100);
		});

		tool.audioElement.addEventListener("canplay", function(){
			state.duration = tool.audioElement.duration * 1000;

			Q.handle(state.onLoad, tool);

			if(state.action === "recorder"){
				tool.recorderStateChange("play");
			}
		});
		tool.audioElement.addEventListener("ended", function(){
			var duration = this.duration;

			// stop timer if exist
			if(state.playIntervalID) { clearInterval(state.playIntervalID); state.playIntervalID = false; }

			// Q/pie tool reset position
			tool.pieTool.initPos();

			// set audio element to start
			this.currentTime = 0;

			// set box attribute to apply valid styles
			tool.pieBox.attr("data-state", "play");

			if(state.action === "player"){

			}else if(state.action === "recorder"){
				tool.recorderStateChange("play");
				state.recordTimeElement.html(tool.formatRecordTime(duration));
			}

			var time = this.currentTime * 1000;
			console.log("Ended at position " + time + " milliseconds");
			Q.handle(state.onEnded, tool, [time]);
		});
		tool.audioElement.addEventListener("pause", function(){
			var time = this.currentTime * 1000;
			console.log("Paused at position " + time + " milliseconds");
			Q.handle(state.onPause, tool, [time]);
		});
	},
	/**
	 * Detect adapter from url
	 * @method adapterNameFromUrl
	 */
	adapterNameFromUrl: function () {
		var url = this.state.url || "";

		if (url.includes("soundcloud.com")) {
			return 'soundcloud';
		}
		if (url.split('.').pop() === 'mp3') {
			return 'general';
		}
		if (url.split('.').pop() === 'ogg') {
			return 'general';
		}

		return "general";
	},
	/**
	 * Format record time elapsed
	 * @method formatRecordTime
	 * @param {int} time Time elapsed in miliseconds
	 * @return {string} formatted string
	 */
	formatRecordTime: function(time) {
		time = time/1000;
		var sec_num = parseInt(time, 10);
		var hours   = Math.floor(sec_num / 3600);
		var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
		var seconds = sec_num - (hours * 3600) - (minutes * 60);

		return (hours ? hours + 'h ' : '') + (minutes ? minutes + 'm ' : '') + seconds+'s';
	}
});

Q.Template.set('Q/audio/composer',
	'<div class="Q_audio_start" data-composer="{{isComposer}}"><form>'
	+ '  <div class="Q_audio_record_select">'
	+ '  	<button name="record" type="button">{{text.record}}</button>'
	+ '  	<button name="upload" type="button">{{text.upload}}</button>'
	+ '  	<button name="link" type="button">{{text.link}}</button>'
	+ '  </div>'
	+ '  <div class="Q_audio_record_content">'
	+ '	 	<div data-content="record">'
	+ '    		<div class="Q_audio_pie"></div>'
	+ '    		<div class="Q_audio_record_label"><p class="Q_audio_record_recordText">{{text.record}}</p><p><span class="Q_audio_record_recordTime">{{maxRecordTime}}</span> <span class="Q_audio_record_elapsed">{{text.maximum}}</span></p></div>'
	+ '    		<div class="Q_audio_allow">{{textAllowMicrophoneAccess}}</div>'
	+ '  	</div>'
	+ '  	<div data-content="upload">'
	+ '	   		<input type="file" accept="audio/*" class="Q_audio_file" />'
	+ '		</div>'
	+ '  	<div data-content="link">'
	+ '	   		<input name="url" placeholder="{{text.seturl}}" type="url">'
	+ '		</div>'
	+ '  </div>'
	+ '  <div class="Q_audio_actions" style="overflow: hidden">'
	+ '    <div class="Q_audio_player"></div>'
	+ '    <div class="Q_audio_clip"></div>'
	+ '  </div>'
	+ '  <div class="Q_audio_record_submit"><button name="save" class="Q_button" type="button">{{text.save}}</button><button name="reset" type="reset" class="Q_button">{{text.reset}}</button></div>'
	+ '  <div class="Q_audio_encoding">{{text.encoding}}</div>'
	+ '</form></div>'
);

Q.Template.set('Q/audio/general',
	'<audio src="{{url}}" preload="auto" controls {{autoplay}}/>'
	//'<div class="Q_audio_container"></div>'
);

Q.Template.set('Q/audio/soundcloud',
	'<iframe id="sc-widget" name="soundcloud" width="100%" height="166" allow=autoplay scrolling="no" frameborder="no" src="{{url}}"></iframe>'
);

})(window, Q, jQuery);
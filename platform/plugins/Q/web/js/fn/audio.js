(function (Q, $, window, document, undefined) {

	/**
	 * Q Tools
	 * @module Q-tools
	 */

	/**
	 * jQuery plugin that allows to create or upload an audio file to the server.
	 * Works on various platforms (desktop and mobile etc) in similar way.
	 * Should be applied to element like this $('#someimg').plugin('Q/audio', options).
	 * @class Q audiopicker
	 * @constructor
	 * @param {Object} [options] options is an Object that contains parameters for function
	 * @param {String} [options.url] url is a url to post to.
	 * @param {String} [options.path="uploads"] Can be a URL path or a function returning a URL path. It must exist on the server.
	 * @param {String|Function} [options.subpath=""] A subpath which may be created on the server if it doesn't already exist. If this is a function, it is executed right before the request is sent.
	 * @default Q.action('Q/audio')
	 * @param {Q.Event} [options.preprocess] preprocess is a function which is triggering before file upload.
	 * Its "this" object will be a jQuery of the audiopicker element
	 * The first parameter is a callback, which should be called with an optional
	 * hash of overrides, which can include "data", "path", "subpath", "save", "url", "loader"
	 * @param {Q.Event} [options.onSuccess] onSuccess is Q.Event which is called on successful upload. First parameter will be the server response.
	 * @param {Q.Event} [options.onError] onError Q.Event which is called if upload failed.
	 * @param {Q.Event} [options.onFinish] onFinish Q.Event which is called at the end, whatever the outcome.
	 */
	Q.Tool.jQuery('Q/audio', function _Q_audio(options) {
			var $this = this;
			var state = $this.state('Q/audio');

			state.input = $('<input type="file" accept="audio/*" class="Q_audio_file" />');
			state.input.change(function () {
				if (!this.value) {
					return; // it was canceled
				}
				Q.Pointer.stopHints();
			});
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
			$this.addClass('Q_audio');
			Q.addStylesheet('{{Q}}/css/audio.css');

			// set audio
			state.audio = new Q.Audio(state.audioUrl);
			$(state.audio.audio).appendTo($this);

			state.audio.audio.addEventListener("canplay", function(){
				state.duration = this.duration;

				// onAudioLoad hook
				if(typeof(state.onAudioLoad) === "function"){ state.onAudioLoad.call(state); }

				if(state.action === "recorder"){
					state.recorderStateChange("play");
				}
			});
			state.audio.audio.addEventListener("ended", function(){
				var duration = this.duration;

				// stop timer if exist
				if(state.playIntervalID) { clearInterval(state.playIntervalID); state.playIntervalID = false; }

				// Q/pie tool reset position
				state.pieTool.initPos();

				// set audio element to start
				state.audio.audio.currentTime = 0;

				// set box attribute to apply valid styles
				state.pieBox.attr("data-state", "play");

				if(state.action === "player"){

				}else if(state.action === "recorder"){
					state.recorderStateChange("play");
					state.recordTimeElement.html(state.formatRecordTime(duration));
				}

				// onEnded hook
				if(typeof(state.onEnded) === "function"){ state.onEnded.call(state); }
			});
			state.audio.audio.addEventListener("pause", function(){
				// stop timer if exist
				if(state.playIntervalID) { clearInterval(state.playIntervalID); state.playIntervalID = false; }

				// set box attribute to apply valid styles
				state.pieBox.attr("data-state", "play");

				//if(state.action == "player"){
				//}else if(state.action == "recorder"){
				//}

				// onPause hook
				if(typeof(state.onPause) === "function"){ state.onPause.call(state); }
			});
			state.audio.audio.addEventListener("playing", function(){
				// set box attribute to apply valid styles
				state.pieBox.attr("data-state", "pause");

				// clear timer if exist
				if(state.playIntervalID) clearInterval(state.playIntervalID);

				// start new timer to change needed layout params during play
				state.playIntervalID = setInterval(function(){
					var currentTime = state.audio.audio.currentTime;

					// onPlaying hook
					if(typeof(state.onPlaying) === "function"){ state.onPlaying.call(state); }

					state.pieTool.state.fraction = 100*currentTime/state.duration;
					state.pieTool.stateChanged('fraction');

					if(state.action === "recorder"){
						state.recordTimeElement.html(state.formatRecordTime(state.duration - currentTime) + '/' + state.formatRecordTime(state.duration));
					}
				}, 100);
			});

			/**
			 * Check whether browser support getUserMedia API
			 */
			state.hasUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

			/**
			 * Process file uploading
			 * @method _process
			 */
			state._process = function() {
				var state = $this.state('Q/audio');
				state.oldSrc = $this.attr('src');

				if(typeof this.addClass === 'function') this.addClass('Q_uploading');

				if (!window.FileReader) {
					// make it work in IE8 and IE9
					return _doUpload(null, null);
				}
				var reader = new FileReader();
				reader.onload = function (event) {
					$this.plugin('Q/audio', 'pick', this.result);
				};
				reader.onerror = function () {
					setTimeout(function () {
						callback("Error reading file", res);
					}, 0);
				};

				// state.file set in recorder OR html file element
				state.file = state.file || state.input[0].files[0];

				reader.readAsDataURL(state.file);

				// clear the input, see http://stackoverflow.com/a/13351234/467460
				state.input.wrap('<form>').closest('form').get(0).reset();
				state.input.unwrap();
			};
			/**
			 * Format record time elapsed
			 * @method formatRecordTime
			 * @param {int} time Time elapsed in seconds
			 * @return {string} formatted string
			 */
			state.formatRecordTime = function(time){
				var sec_num = parseInt(time, 10);
				var hours   = Math.floor(sec_num / 3600);
				var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
				var seconds = sec_num - (hours * 3600) - (minutes * 60);

				return (hours ? hours + 'h ' : '') + (minutes ? minutes + 'm ' : '') + seconds+'s';
			};

			/**
			 * Handle recorder states
			 * @method recorderStateChange
			 * @param {string} newState New recorder state
			 */
			state.recorderStateChange = function(newState){
				// state didn't changed
				//if(state.recorderState == newState) return;

				state.recorderState = newState;

				// set dialog attribute to style dialog according to newState
				state.mainDialog.attr("data-state", newState);

				// set pieBox attribute to style player according to newState
				state.pieBox.attr("data-state", newState);

				// init recorder
				if(newState === "init"){
					// reset pie tool to start point
					if(state.pieTool){
						state.currentRecordTime = state.maxRecordTime;

						state.recordTextElement.html(state.text.textRecord);
						state.recordElapsedElement.html(state.text.maximum);
						//state.recordTimeElement.show();
						state.recordTimeElement.html(state.formatRecordTime(state.currentRecordTime));
						state.pieTool.initPos();
					}

					// if recorder exists - just change state to "ready"
					if(state.recorder && state.recorder.stream){
						state.recorderStateChange("ready");
						return;
					}

					//if recorder don't exist - create one
					state.audio.recorderInit({
						onStreamReady: function(){
							state.recorder = state.audio.recorder;

							// when recorder created - change state to "ready"
							state.recorderStateChange("ready");
						},
						onDataAvailable: function(){
							var e = this;

							state.dataBlob = new Blob( [e.detail], { type: 'audio/mp3', name: "audio.mp3" } );
							var url = URL.createObjectURL(state.dataBlob);

							state.audio.audio.src = url;
						}
					});
				}

				// play recorded track
				if(newState === "playing"){
					state.recordTextElement.html(state.text.playing);
					state.audio.audio.play();
				}else{
					state.audio.audio.pause();
				}

				// ready to play
				if(newState === "play"){
					state.recordTextElement.html(state.text.recorded);
					state.recordElapsedElement.html(state.text.clip);
					state.recordTimeElement.html(state.formatRecordTime(state.duration));
				}

				// recorder stoped
				if(newState === "recorded"){
					state.pieTool.initPos();
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
				state.recordTextElement.html(state.text.recording);
				state.recordElapsedElement.html(state.text.remains);
				state.recordTimeElement.html(state.formatRecordTime(state.maxRecordTime) + '/' + state.formatRecordTime(state.maxRecordTime));

				// start recorder timer to handle all recorder interface actions
				state.recordIntervalID = setInterval(function(){
					// set currentRecordTime to maxRecordTime if undefined
					if(typeof state.currentRecordTime === 'undefined') state.currentRecordTime = state.maxRecordTime - 1;

					// decrease currentRecordTime to 100 milliseconds
					state.currentRecordTime -= 0.1;

					// set time element text
					state.recordTimeElement.html(state.formatRecordTime(state.currentRecordTime) + '/' + state.formatRecordTime(state.maxRecordTime));

					// set Q/pie tool position (percents of currentRecordTime time from max maxRecordTime)
					state.pieTool.state.fraction = 100*(state.maxRecordTime - state.currentRecordTime)/state.maxRecordTime;
					state.pieTool.stateChanged('fraction');

					// max record time spent
					if(state.currentRecordTime <= 1){ state.recorderStateChange("recorded"); }
				}, 100);
				//--------------------//
			};

			/**
			 * @method playAudio
			 * Play audio and detect promise event on mobile devices
			 */
			state.playAudio = function(){
				var promise = state.audio.audio.play();

				if(typeof promise === 'undefined') return;

				state.userGesture("play", promise);
			};

			/**
			 * @method pauseAudio
			 * Pause audio and detect promise event on mobile devices
			 */
			state.pauseAudio = function(){
				var promise = state.audio.audio.pause();

				if(typeof promise === 'undefined') return;

				state.userGesture("pause", promise);
			};
			/**
			 * @method userGesture
			 * User gesture handler for audio actions if promise != undefined (mobile devices)
			 * @param {string} action Player action (play, pause, ...)
			 * @param {object} promise Promise returned
			 */
			state.userGesture = function(action, promise){
				var pieTool = state.$pieElement.clone().removeAttr("id");

				function hideOnMaskClick() { 
					Q.Dialogs.pop();
				}

				// we have promise on mobile device which need user gesture
				promise.then(function() {

				}).catch(function(error) {
					Q.Dialogs.push({
						className: 'Q_audio_play_dialog',
						content: pieTool,
						destroyOnClose: true,
						noClose: true,
						onActivate: function (dialog) {
							$(".Q_mask").on(Q.Pointer.fastclick, hideOnMaskClick);
							dialog.attr("data-state", state.playerBox.attr("data-state"));

							$(".Q_tool.Q_pie_tool", dialog).on(Q.Pointer.fastclick, function(event){
								event.stopPropagation();
								event.preventDefault();

								if(action === "play") state.audio.audio.play();
								if(action === "pause") state.audio.audio.pause();

								Q.Dialogs.pop();
							})
						},
						beforeClose: function(dialog){
							$(".Q_mask").off(Q.Pointer.fastclick, hideOnMaskClick);
						}
					});
				});
			}

			// run action
			if(state.action) $this.plugin("Q/audio", state.action);
		},

		{
			publisherId: Q.Users.loggedInUserId(), // for new stream
			type: "Streams/audio", // for new stream
			streamName: undefined, // create stream or edit
			//path: 'uploads/Users', // path where new files will upload by default
			subpath: '', // subpath where new files will upload by default
			pie: { // default Q/pie options
				fraction: 0,
				borderSize: 5,
				size: null
			},
			maxRecordTime: 10, // seconds
			url: Q.action("Q/file"),
			cacheBust: 1000,
			preprocess: null,
			onSuccess: new Q.Event(function () {}, 'Q/audio'),
			onError: new Q.Event(function (message) {
				alert('File upload error' + (message ? ': ' + message : '') + '.');
			}, 'Q/audio'),
			onFinish: new Q.Event(),
			templates: {
				record: {
					name: 'Q/audio/record',
					fields: {}
				}
			},
			text: {
				allowMicrophoneAccess: Q.text.Q.audio.allowMicrophoneAccess,
				record: Q.text.Q.audio.record,
				recording: Q.text.Q.audio.recording,
				remains: Q.text.Q.audio.remains,
				maximum: Q.text.Q.audio.maximum,
				playing: Q.text.Q.audio.playing,
				recorded: Q.text.Q.audio.recorded,
				clip: Q.text.Q.audio.clip,
				orupload: Q.text.Q.audio.orupload,
				usethis: Q.text.Q.audio.usethis,
				discard: Q.text.Q.audio.discard,
				encoding: Q.text.Q.audio.encoding
			}
		},

		{
			/**
			 * Set the audio
			 * @method pick
			 */
			pick: function (src, callback) {
				var $this = this;
				var state = $this.state('Q/audio');

				_upload.call(this, src);

				function _callback(err, res) {
					//console.log(this);
					var state = $this.state('Q/audio');
					var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(res && res.errors);
					if (msg) {
						if(state.mainDialog) state.mainDialog.removeClass('Q_uploading');
						return Q.handle([state.onError, state.onFinish], $this, [msg]);
					}

					// by default set src equal to first element of the response
					var key = Q.firstKey(res.slots.data, {nonEmpty: true});

					var c = Q.handle([state.onSuccess, state.onFinish], $this, [res.slots.data, key, state.file || null]);

					Q.Dialogs.pop();
				}

				function _upload(data) {
					if (state.preprocess) {
						state.preprocess.call($this);
					}

					_doUpload(data);
				}

				function _doUpload(data) {
					var state = $this.state('Q/audio');
					var params = {
						title: state.file.name,
						file: {
							data: data,
							audio: true
						}
					};

					if(state.streamName){ // set params only for existent stream
						params.streamName = state.streamName;
						params.file.name = state.file.name;
					}

					if(!state.streamName) { // if new stream
						Q.handle([state.onSuccess, state.onFinish], $this, [params]);
						Q.Dialogs.pop();
					} else { // if edit existent stream
						if (window.FileReader) {
							Q.request(state.url, 'data', _callback, {
								fields: params,
								method: "put"
							});
						} else {
							delete params.data;
							state.input.wrap('<form />', {
								method: "put",
								action: Q.url(state.url, params)
							}).parent().submit();
							state.input.unwrap();
						}
					}
				}
			},

			/**
			 * Removes the Q/audio functionality from the element
			 * @method remove
			 */
			remove: function () {
				return this.each(function () {
					var $this = $(this);
					$this.off([Q.Pointer.click, '.Q_audio']);
					if ($this.next().hasClass('Q_audio_file')) {
						$this.next().remove();
					}
				});
			},
			/**
			 * Audio player
			 * @method player
			 */
			player: function(){
				var $this = this;
				var state = $this.state('Q/audio');
				state.pieBox = $this;
				var $playerBox = state.playerBox = $("<div>").appendTo(this);

				// set player state if it didn't set yet
				$this.attr("data-state", $this.attr("data-state") || "play");

				// set up the pie options
				var pieOptions = state.pie;

				// set up Q/pie tool and activate
				$(Q.Tool.setUpElement($playerBox[0], 'Q/pie', pieOptions)).activate(function(){
					var pieTool = state.pieTool = this;
					var $pieElement = state.$pieElement = $(pieTool.element);

					$pieElement.on(Q.Pointer.click, function (event) {
						// click on arc border - means change play position
						if(!pieTool.state.clickPos.inside){
							state.audio.audio.currentTime = state.duration/100*pieTool.state.clickPos.anglePercent;
							return;
						}

						if($this.attr("data-state") === "play"){
							state.playAudio();
						}else{
							state.pauseAudio();
						}
					});
				});
			},
			/**
			 * Start audio creation dialog
			 * @method start
			 */
			recorder: function () {
				var audioTool = this;
				var state = audioTool.state('Q/audio');

				// browser don't support getUserMedia API, provide just uploading
				if(!state.hasUserMedia){
					state.input.change(function () { state._process.call(this); });
					state.input.click();

					return;
				}

				// browser support getUserMedia API
				Q.Template.render(
					state.templates.record.name,
					{
						maxRecordTime: state.formatRecordTime(state.maxRecordTime),
						textAllowMicrophoneAccess: state.text.allowMicrophoneAccess,
						textEncoding: state.text.encoding,
						textRecord: state.text.record,
						textRemains: state.text.remains,
						textMaximum: state.text.maximum,
						textOrUpload: state.text.orupload,
						textUseThis: state.text.usethis,
						textDiscard: state.text.discard
					},
					function (err, html) {
						if (err) return;

						Q.Dialogs.push({
							className: 'Q_dialog_audio',
							title: "Audio",
							content: html,
							destroyOnClose: true,
							onActivate : function (mainDialog) {
								state.mainDialog = mainDialog;
								var pieBox = state.pieBox = $(".Q_audio_pie", mainDialog);
								var pieElement = Q.Tool.setUpElement('div', 'Q/pie');
								var $pieElement = $(pieElement);

								// set some elements
								state.recordTimeElement = $(".Q_audio_record_recordTime", mainDialog);
								state.recordTextElement = $(".Q_audio_record_recordText", mainDialog);
								state.recordElapsedElement = $(".Q_audio_record_elapsed", mainDialog);
								state.recordEncodingElement = $(".Q_audio_encoding", mainDialog);


								// add Q/pie tool
								pieBox.append(pieElement).activate(function(){ state.pieTool = this; });

								// set Q/pie tool handler
								$pieElement.on(Q.Pointer.fastclick, function(event){
									var pieTool = state.pieTool;
									var recorderState = state.recorderState;

									// click on arc border - means change play position
									if(!pieTool.state.clickPos.inside && recorderState === "playing"){
										state.audio.audio.currentTime = state.audio.audio.duration/100*pieTool.state.clickPos.anglePercent;
										return;
									}

									// set pie state
									if(!recorderState) recorderState = "init";
									else if(recorderState === "ready") recorderState = "recording";
									else if(recorderState === "recording") recorderState = "recorded";
									else if(recorderState === "playing") recorderState = "play";
									else if(recorderState === "play") recorderState = "playing";

									state.recorderStateChange(recorderState);
								});

								state.input.change(function () {
									state._process.call(mainDialog);
								});

								// natively support "file" input
								$("button[name=upload]", mainDialog).on(Q.Pointer.click, function (e) {
									state.input.click();
									e.preventDefault();
									e.stopPropagation();
									Q.Pointer.cancelClick(false, e);
								});

								// natively support "file" input
								$("button[name=usethis]", mainDialog).on(Q.Pointer.click, function (e) {
									// use blob as file
									mainDialog.addClass('Q_uploading');

									// wait while track encoded
									state.encodeIntervalID = setInterval(function(){
										if(typeof state.dataBlob === 'undefined') return;

										state.file = state.dataBlob;
										state.file.name = "audio.mp3";
										state._process.call(mainDialog);

										e.preventDefault();
										e.stopPropagation();
										Q.Pointer.cancelClick(false, e);

										clearInterval(state.encodeIntervalID);
									}, 1000);
								});

								// discard recorded track
								$("button[name=discard]", mainDialog).on(Q.Pointer.click, function (e) {
									state.recorderStateChange("init");

									e.preventDefault();
									e.stopPropagation();
									Q.Pointer.cancelClick(false, e);
								});
							},
							beforeClose: function(mainDialog) {
								// clear recorder stream when dialog close.
								// In this case every time dialog opened - user should allow to use microphone
								if(state.recorder && state.recorder.stream) state.recorder.clearStream();
							}
						});
					});
			}
		});

	Q.Template.set('Q/audio/record',
		'<div class="Q_audio_start">'
		+ '	 <div class="Q_audio_record">'
		+ '    <div class="Q_audio_pie"></div>'
		+ '    <div class="Q_audio_record_label"><p class="Q_audio_record_recordText">{{textRecord}}</p><p><span class="Q_audio_record_recordTime">{{maxRecordTime}}</span> <span class="Q_audio_record_elapsed">{{textMaximum}}</span></p></div>'
		+ '    <div class="Q_audio_allow">{{textAllowMicrophoneAccess}}</div>'
		+ '  </div>'
		+ '  <div class="Q_audio_actions">'
		+ '	   <button name="upload">{{textOrUpload}}</button>'
		+ '	   <button name="usethis">{{textUseThis}}</button>'
		+ '	   <button name="discard">{{textDiscard}}</button>'
		+ '  </div>'
		+ '  <audio class="play" controls="true"></audio>'
		+ '  <div class="Q_audio_encoding">{{textEncoding}}</div>'
		+ '</div>'
	);

})(Q, Q.$, window, document);
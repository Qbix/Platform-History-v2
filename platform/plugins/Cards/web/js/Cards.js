/**
 * Cards plugin's front end code
 * 
 * @module Cards
 * @class Cards
 */

(function (Q, $, undefined) {

	var Cards = Q.Cards = Q.plugins.Cards = {

		/**
		 *This is used for attach the getUserMedia with Perticular element like <div>.
		 *
		 * @method setCamera
		 * @param {String} options.videoPlayer element id
		 * @param {String} options.canvasElement element id
		 * @param {String} options.captureButton element id
		 * @param {object} options.tool tool object 
		 * @return {string} Returns attach the getUserMedia 
		 */
		scan: function (options) {
			if (!('mediaDevices' in navigator)) {
				navigator.mediaDevices = {};
			}

			if (!('getUserMedia' in navigator.mediaDevices)) {
				navigator.mediaDevices.getUserMedia = (constraints) => {
					const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

					if (!getUserMedia) {
						return Promise.reject(new Error('getUserMedia is not supported'));
					} else {
						return new Promise((resolve, reject) => getUserMedia.call(navigator, constraints, resolve, reject));
					}
				};
			}

			navigator.mediaDevices.getUserMedia({
					video: true
				})
				.then((stream) => {
					options.videoPlayer.srcObject = stream;
					options.videoPlayer.style.display = 'inline-block';
				})
				.catch((err) => {
					Q.alert(text.businessCard.error.notConnectedWebcam);
				});

			this.recognize(options);
		},

		/**
		 *This is used for capture picture using getUserMedia and return the data_uri and display as image format .
		 *
		 * @method recognize
		 * @param {String} options.videoPlayer element id
		 * @param {String} options.canvasElement element id
		 * @param {String} options.captureButton element id
		 * @param {object} options.tool tool object 
		 * @return {string} Returns append image card in perticular results <div>.
		 */
		recognize: function (options) {
			// Capture the image, save it and show it in the page
			options.captureButton.addEventListener('click', (event) => {
				// Draw the image from the video player on the canvas
				options.canvasElement.style.display = 'none';
				const context = options.canvasElement.getContext('2d');
				context.drawImage(options.videoPlayer, 0, 0, canvas.width, canvas.height);

				// Convert the data so it can be saved as a file
				let picture = options.canvasElement.toDataURL();

				var newNode = $('<div class="image-card"></div>').html($('<img />').attr('src', picture).attr('style', "width:100%").attr('class', 'image_source'));
				$(options.tool.element).append(newNode);
			});
		},

		/**
		 *This is used Validation for Email id in the contents.
		 *
		 * @method formFill
		 * @param {object} options.tool tool object 
		 * @param {string} sourceData image source data
		 * @return {string} Returns True or False for validate email addrees on the card details.
		 */
		formFill: function (tool, sourceData) {
			var text = sourceData.split(",");
			var data = '{ "requests": [{"image": {"content":"' + text[1] + '" },"features": [{"maxResults": 1,"type": "TEXT_DETECTION"}]}]}';
			// get the google vision API key from local app config file.
			var googleVisionKey = (Q.getObject("Q.Cards.keys.web") != undefined) ? Q.getObject("Q.Cards.keys.web") : Q.alert(tool.text.error.keyNotFound);

			var settings = {
				"async": true,
				"crossDomain": true,
				"url": "https://vision.googleapis.com/v1/images:annotate?key=" + googleVisionKey,
				"method": "POST",
				"headers": {
					"Content-Type": "application/json",
					"cache-control": "no-cache",
				},
				"processData": false,
				"data": data
			}

			$.ajax(settings).done(function (response) {
				var response = JSON.parse(JSON.stringify(response));

				var str = response.responses[0].fullTextAnnotation.text;
				var formData = null;
				formData = {
					"email": null,
					"phone": null,
					"twitter": null,
					"webSite": null,
					"extra": null
				};
				var form_html = "<table class='fillform'><form>";
				form_html += "<tr><td> Email : </td>";

				var emailaddress = Cards.validateExtraWithEmail(str, true);
				if (emailaddress != undefined) {
					form_html += "<td><input type='text' value='" + emailaddress + "'/></td></tr>";
					// save email address data in formData object;
					formData.email = emailaddress;
					str = str.replace(emailaddress, "");
				} else {
					form_html += "<td><input type='text'/></td></tr>";
				}
				form_html += "<tr><td> WebSite : </td>";

				var websiteurl = Cards.validateURLWithText(str, true);
				if (websiteurl != undefined) {
					form_html += "<td><input type='text' value='" + websiteurl + "'/></td></tr>";
					// save website data in formData object;
					formData.website = websiteurl;
					str = str.replace(websiteurl, "");
				} else {
					form_html += "<td><input type='text'/></td></tr>";
				}

				var phoneno = Cards.validatePhone(str, true);
				var obj = JSON.parse(phoneno);
				var countNum = 0;
				var phoneNos = {};

				$.each(obj, function (index, value) {
					if (Cards.validatePhoneRegex(value)) {
						form_html += "<tr><td> Phone no : </td>";
						form_html += "<td><input type='text' value='" + value + "'/></td></tr>";
						// save phone data in formData object;
						phoneNos[countNum] = value;
						formData.phone = phoneNos;
						countNum = countNum + 1;
						str = str.replace(value, "");
					}
				});

				form_html += "<tr><td> Twitter ID : </td>";
				var twitter = Cards.validateTwitterWithText(str, true);
				if (twitter != undefined) {
					form_html += "<td><input type='text' value='" + twitter + "'/></td></tr>";
					// save twitter Id data in formData object;
					formData.twitter = twitter;
					str = str.replace(twitter, "");
				} else {
					form_html += "<td><input type='text'/></td></tr>";
				}
				form_html += "<tr><td> Address : </td>";
				form_html += "<td><textarea rows='5' cols='30'></textarea></td></tr>";

				form_html += "<tr><td> Extra Label : </td>";
				form_html += "<td><textarea rows='5' cols='30'>" + str + "</textarea></td></tr>";
				// save Extra data in formData object;
				formData.extra = str;

				form_html += "</form></table>";
				form_html += "<div class='row'> <input type='button' class='invite_user' name='inviteUser' data-value='" + emailaddress + "' value='Invite User'/> </div>";

				Q.Text.get('Cards/content', function (err, text) {
					Q.Dialogs.push({
						title: text.businessCard.dialog.cardDetails,
						content: form_html,
						alignByParent: true,
						doNotRemove: true,
						placeholders: ['', ''],
						onActivate: function () {
							// Click on Invite User button to open Invitation popup.
							$('input[name="inviteUser"]').on(Q.Pointer.click, function () {
								// Register the new user and send them a activation email.
								console.log(tool);
								Q.req('Cards/businessCard', 'registeruser', function (err, data) {
									Q.Dialogs.pop();
									var fem = Q.firstErrorMessage(err, data);
									if (fem) {
										return Q.alert("Error posting event: " + fem);
									}
								}, {
									method: 'post',
									fields: {
										communityId: tool.state.communityId,
										publisherId: tool.state.publisherId,
										formData: formData
									}
								});
								// Extends the options of Streams.invite.option to update custom dialog template.
								// Q.Streams.invite(Q.Users.loggedInUser.id, "Cards/businessCard", {
								// 	followup: false,
								// 	defaultValue: $(this).attr("data-value") || null,
								// 	alwaysSend: true
								// }, function () {
								// 	Q.alert("Successfully invited the user");
								// });
							});
						},
						onClose: function () {
							console.log("Card Details Close");
						}
					});
				});

			});
		},

		/**
		 *This is used Validation for Email id in the contents.
		 *
		 * @method validateEmail
		 * @param {string} email email id string data
		 * @return {string} Returns True or False for validate email addrees on the card details.
		 */
		validateEmail: function (email) {
			var re = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9 ](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
			return re.test(String(email).toLowerCase())
		},

		/**
		 *This is used Validation for Extra Email id in the contents.
		 *
		 * @method validateExtraWithEmail
		 * @param {string} str content string data
		 * @param {string} flag flag string data
		 * @return {string} Returns Email-id in the card details.
		 */
		validateExtraWithEmail: function (str, flag = null) {
			var oldstr = str;

			if (Cards.validateEmail(str)) {
				//console.log("ok");
				var str = str.trim();

				var emailaddress = '';
				var arr1 = [];

				if (str.indexOf(" ") != -1) {
					arr1 = str.split(" ");

					if (arr1[0].substring(arr1[0].length, arr1[0].length - 1) == '@') {
						str = str.replace(/\s/g, "");

						if (Cards.validateEmail(str)) {
							emailaddress = str;
						} else {
							emailaddress = false;
						}
						return emailaddress;
					}

				} else if (str.indexOf("-") != -1) {
					arr1 = str.split("-");
				} else if (str.indexOf("=") != -1) {
					arr1 = str.split("=");
				} else if (str.indexOf(":") != -1) {
					arr1 = str.split(":");
				} else {
					arr1 = [];
				}

				if (Array.isArray(arr1) && arr1.length > 0) {
					$.each(arr1, function (i, v) {
						if (Cards.validateEmail(v)) {
							if (flag) {
								emailaddress = v;
							} else {
								emailaddress = str.trim();
							}
						}
					});
				} else if (Cards.validateEmail(str)) {
					emailaddress = str;
				} else {
					emailaddress = false;
				}
				return emailaddress;
			}
		},

		/**
		 *This is used Validation for phone number in the contents.
		 *
		 * @method validatePhoneRegex
		 * @param {String} strPhone content of string phone
		 * @return {string} Returns True or False for validate email addrees on the card details.
		 */
		validatePhoneRegex: function (strPhone) {
			var re = /((?:\+|00)[17](?: |\-)?|(?:\+|00)[1-9]\d{0,2}(?: |\-)?|(?:\+|00)1\-\d{3}(?: |\-)?)?(0\d|\([0-9]{3}\)|[1-9]{0,3})(?:((?: |\-)[0-9]{2}){4}|((?:[0-9]{2}){4})|((?: |\-)[0-9]{3}(?: |\-)[0-9]{4})|([0-9]{7}))/;
			return re.test(strPhone);
		},

		/**
		 *This is used Validation for phone in the contents.
		 *
		 * @method validatePhone content of string phone
		 * @param {String} strPhone content of string phone
		 * @param {String} flag content of string flag
		 * @return {string} Returns phone number in the card details content.
		 */
		validatePhone: function (strPhone, flag = null) {
			// var isString = 0;
			var isNumber = 0;
			var validNumbers = [];
			var onlyString = '';
			var num = '';
			var f = 0;
			var arr = strPhone.split(" ");
			$.each(arr, function (i, v) {
				if (!isNaN(parseInt(v)) || v == '+' || v == '(' || v == ')' || v == '-' || v == ':' && f == 0) {
					isNumber = isNumber + 1;
					num = num + v;
					f = 1;
					if (num.length >= 10) {
						validNumbers.push(num);
						num = '';
						console.log(validNumbers);
						return JSON.stringify(validNumbers);
					}
				} else {
					var arr1 = v.split("");
					$.each(arr1, function (i1, v1) {
						if (!isNaN(parseInt(v1)) || v1 == '+' || v1 == '(' || v1 == ')' || v1 == '-' && f == 1) {
							num = num + v1;
							if (Cards.validatePhoneRegex(num) && num.length >= 10) {
								validNumbers.push(num);
								num = '';
								isNumber = 0;
							}
						} else {
							if (num.length > 0) {
								num = '';
							}
							onlyString = onlyString + v1;
						}
					});
				}
			});
			if (validNumbers.length > 0) {
				validNumbers.push(onlyString);
				return JSON.stringify(validNumbers);
			}
			return false;
		},

		/**
		 *This is used Validation for Website URL in the contents.
		 *
		 * @method validateURL content of string url
		 * @param {String} URL string of cards contents
		 * @return {string} Returns True or False in the card details content.
		 */
		validateURL: function (URL) {
			if (URL.toLowerCase().indexOf('www') != -1 || URL.toLowerCase().indexOf('http') != -1) {
				return true;
			}
			return false;
		},

		/**
		 *This is used Validation for Website URL Text- in the contents.
		 *
		 * @method validateURLWithText
		 * @param {String} url content of string url
		 * @param {String} flag content of string flag
		 * @return {string} Returns Website url in the card details content.
		 */
		validateURLWithText: function (url, flag = null) {
			if (Cards.validateURL(url)) {
				var url = url.trim();
				var websiteurl = '';
				var arr1 = [];
				if (url.indexOf(" ") != -1) {
					arr1 = url.split(" ");
				} else if (url.indexOf("=") != -1) {
					arr1 = url.split("=");
				} else if (url.indexOf(":") != -1) {
					arr1 = url.split(":");
				} else {
					arr1 = [];
				}

				if (Array.isArray(arr1) && arr1.length > 0) {
					$.each(arr1, function (i, v) {
						if (Cards.validateURL(v)) {
							if (flag) {
								websiteurl = v;
							} else {
								websiteurl = url.trim();
							}
						}
					});
				} else {
					websiteurl = url;
				}

				return websiteurl;
			}
		},

		/**
		 *This is used Validation for Address in the contents.
		 *
		 * @method checkAddress
		 * @param {String} str cards contents
		 * @return {string} Returns True or False in the card details content.
		 */
		checkAddress: function (str) {
			var flag = 0;
			var n = false;
			var f = 0;
			var t = 0;
			var checkingPoints = ["road", ","];
			$.each(checkingPoints, function (i, v) {
				n = str.toLowerCase();
				n = n.includes(v);
				if (n == true) {
					t = t + 1;
				}
				if (f == true) {
					f = f + 1;
				}
			});
			if (t > f) {
				return true;
			} else {
				return false;
			}
		},

		/**
		 *This is used Validation for Twitter Text- in the contents.
		 *
		 * @method validateTwitterWithText
		 * @param {String} twitter content of string as twitter
		 * @param {String} flag content of string flag
		 * @return {string} Returns Twitter Text in the card details content.
		 */
		validateTwitterWithText: function (twitter, flag = null) {
			if (Cards.validateTwitterId(twitter)) {
				var twitter = twitter.trim();
				var twitterId = '';
				var arr1 = [];
				if (twitter.indexOf(" ") != -1) {
					arr1 = twitter.split(" ");
				} else if (twitter.indexOf("-") != -1) {
					arr1 = twitter.split("-");
				} else if (twitter.indexOf("=") != -1) {
					arr1 = twitter.split("=");
				} else if (twitter.indexOf(":") != -1) {
					arr1 = twitter.split(":");
				} else {
					arr1 = [];
				}

				if (Array.isArray(arr1) && arr1.length > 0) {
					$.each(arr1, function (i, v) {
						if (Cards.validateTwitterId(v)) {
							if (flag) {
								twitterId = v;
							} else {
								twitterId = twitter.trim();
							}
						}
					});
				} else {
					twitterId = twitter;
				}
				return twitterId;
			}
		},

		/**
		 *This is used Validation for Twitter id in the contents.
		 *
		 * @method validateTwitterId
		 * @param {String} twitter content of string as twitter
		 * @return {string} Returns True or False in the card details content.
		 */
		validateTwitterId: function (twitter) {
			var re = /((?=[^\w!]) @\w+\b)/g;
			return re.test(String(twitter).toLowerCase())
		}
	};

	Q.text.Cards = {

	};

	Q.Tool.define({
		"Cards/businessCard": "Q/plugins/Cards/js/tools/businessCard.js"
	});

})(Q, Q.$, window);
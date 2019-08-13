(function (Q, $, window, document) {

	/**
	 * Cards Tools
	 * @module Cards-tools
	 */
	var Cards = Q.Cards;
	var Dialogs = Q.Dialogs;

	/**
	 * Allows the logged - in user to businessCards to a publisher and select among already added businessCards
	 * @class Cards businessCard
	 * @constructor
	 * @param {Object} [options] used to pass options
	 * @param {String} [options.publisherId=Q.Users.loggedInUserId()] Override the publisherId
	 * @param {String} [options.communityId=Q.Users.communityId] Override the publisherId
	 * @param {String} [options.photos=true] Override the publisherId
	 */
	Q.Tool.define("Cards/businessCard", function (options) {
		var tool = this;
		var state = this.state;
		var $te = $(tool.element);

		Q.Text.get('Cards/content', function (err, text) {
			tool.text = text.businessCard;
			if (!Q.getObject(Q.Users.loggedInUser)) {
				return Q.alert(tool.text.error.userLoginMust, function () {});
			}
			var msg = Q.firstErrorMessage(err);
			if (msg) {
				console.warn(msg);
			}
		});
		if (Q.getObject(Q.Users.loggedInUser)) {
			tool.refresh(options);
		}
	}, { // default options here
		publisherId: null,
		communityId: Q.Users.communityId,
		photos: true
	}, { // methods go here
		/**
		 * Refresh the display
		 * @method refresh
		 */
		refresh: function (options) {
			var tool = this;
			var state = tool.state;
			var $te = $(tool.element);

			Q.Text.get('Cards/content', function (err, text) {
				tool.text = text.businessCard;
				//call popup on dialog box
				Dialogs.push({
					title: text.businessCard.dialog.title,
					apply: true,
					alignByParent: true,
					doNotRemove: true,
					placeholders: ['', ''],
					template: {
						name: "Cards/businessCard",
						fields: {
							buttonText: text.businessCard.button.label,
							buttonTextScanBack: text.businessCard.button.label_scan_back,
							buttonTextPhotos: text.businessCard.button.label_photos
						}
					},
					onActivate: function () {
						const videoPlayer = document.querySelector('#player');
						const canvasElement = document.querySelector('#canvas');
						const captureButton = document.querySelector('#snapshot');
						var options = {
							videoPlayer,
							canvasElement,
							captureButton,
							tool
						};
						Cards.scan(options);
					},
					onClose: function () {
						console.log("closed Camera");
						//to using form fillup
						tool.$('img.image_source').on(Q.Pointer.click, function () {
							Cards.formFill(tool, $(this).attr('src'));
						});
					}
				});

				$te.html($("<h1></h1>").html(text.businessCard.pageTitle)).append(Dialogs);
			});
		}
	});

	Q.Template.set('Cards/businessCard',
		'<div class="Cards_businessCard_block">' +
		'<video id="player" autoplay></video><canvas id="canvas" width="320px" height="240px"></canvas>' +
		'<input type="button" class="btn" name="snapshot" value="{{buttonText}}" id="snapshot" >' +
		'</div>'
	);
})(Q, Q.$, window, document);
(function (Q, $, window, document, undefined) {

	/**
	 * Places Tools
	 * @module Places-tools
	 */

	var Cards = Q.Cards;
	var Dialogs = Q.Dialogs;

	/**
	 * Allows the logged - in user to businessCards to a publisher and select among already added businessCards
	 * @class Cards businessCard
	 * @constructor
	 * @param {Object} [options] used to pass options
	 * @param {String} [options.publisherId=Q.Users.loggedInUserId()] Override the publisherId
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
				tool.refresh();
				options.result = {};
			}
		},

		{ // default options here
			publisherId: Q.getObject(Q.Users.loggedInUser.id)
		},

		{ // methods go here
			/**
			 * Refresh the display
			 * @method refresh
			 */
			refresh: function () {
				console.log(Cards);
				var tool = this;
				var state = tool.state;
				var $te = $(tool.element);

				Cards.businessCard();
				Q.Text.get('Cards/content', function (err, text) {
					$te.html($("<h1></h1>").html(text.businessCard.pageTitle));
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
								buttontext: text.businessCard.button.label
							}
						},
						onActivate: function (dialog) {
							Cards.setCamera('#resultData');
						},
						onClose: function () {
							console.log("closed Camera");
							//to using form fillup
							tool.$('img.image_source').on(Q.Pointer.click, function () {
								Cards.formFill(tool, $(this).attr('src'));
								console.log(tool);
							});
						}
					});
					//get buttonID click Event
					$('input[name=bcs]').on(Q.Pointer.click, function (event) {
						console.log('bcs btn clicked');
						Cards.recognize(tool);
					});
				});
			}
		});

	Q.Template.set('Cards/businessCard',
		'<div id="resultData"></div>' +
		'<input type="button" name="bcs" value="{{buttontext}}" id="snapshot" >'
	);
})(Q, Q.$, window, document);
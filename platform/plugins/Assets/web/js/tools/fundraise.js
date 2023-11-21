(function (Q, $, window, undefined) {
/**
 * Assets/fundraise tool.
 * @class Assets/fundraise
 * @constructor
 * @param {Object} [options] options to pass
 */
Q.Tool.define("Assets/fundraise", function(options) {
	var tool = this;
	var state = this.state;

	Q.Streams.get(state.publisherId, state.streamName, function (err) {
		if (err) {
			return;
		}

		tool.refresh(this);
	});
},

{
	publisherId: null,
	streamName: null,
	icon: {
		defaultSize: 200
	}
},

{
	refresh: function (stream) {
		var tool = this;
		var state = this.state;
		var $toolElement = $(tool.element);


		Q.Template.render('Assets/fundraise', {

		}, function (err, html) {
			if (err) {
				return;
			}

			Q.replace(tool.element, html);

			if (stream.fields.content || stream.testWriteLevel("edit")) {
				$(".Assets_fundraise_description", tool.element).tool("Streams/html", {
					field: "content",
					editor: "ckeditor",
					publisherId: state.publisherId,
					streamName: state.streamName,
					placeholder: tool.text.fundrise.placeholder
				}).activate();
			}

			tool.element.forEachTool("Assets/web3/balance", function () {
				$("<button class='Q_button Assets_fundraise_buyCredits'>" + tool.text.credits.BuyCredits + "</button>").on(Q.Pointer.fastclick, function () {
					Q.Assets.Credits.buy();
				}).appendTo($(".Assets_web3_balance_select", this.element));
			});

			$(".Assets_fundraise_transfer", tool.element).tool("Assets/web3/transfer", {
				recipientUserId: state.publisherId,
				withHistory: true
			}).activate();
		});
	}
});

Q.Template.set('Assets/fundraise',
`<div class="Assets_fundraise_description"></div>
	<div class="Assets_fundraise_transfer"></div>`,
	{text: ["Assets/content"]}
);

})(Q, Q.jQuery, window);
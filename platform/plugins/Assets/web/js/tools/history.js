(function (window, Q, $, undefined) {

/**
 * @module Assets
 */

/**
 * UI for credits and charges
 * @class Assets
 * @constructor
 * @param {Object} options Override various options for this tool
 *  @param {String} options.type can be "credits" or "charges"
 *  @param {String} [options.userId=loggedUserId] id of user which history need to display
 *  @param {Q.Event} [options.onClient] Event occur when user click on client name link.
 *  Passed tool as context and userId, userName as arguments.
 *  @param {Q.Event} [options.onStream] Event occur when user click on stream title link.
 *  Passed tool as context and publisherId, streamName as arguments.
 */

Q.Tool.define("Assets/history", function (options) {
	var tool = this;

	if (!Q.Users.loggedInUser) {
		throw new Q.Error("Assets/history: Don't render tool when user is not logged in");
	}

	if (!this.state.type) {
		throw new Q.Error("Assets/history: type required");
	}

	var pipe = Q.pipe(['styles', 'texts'], tool.refresh.bind(tool));

	Q.addStylesheet('{{Assets}}/css/tools/AssetsHistory.css', pipe.fill("styles"), { slotName: 'Assets' });
	Q.Text.get('Assets/content', function (err, text) {
		var msg = Q.firstErrorMessage(err);
		if (msg) {
			return console.warn(msg);
		}

		tool.text = text.history;
		pipe.fill("texts")();
	});
},

{ // default options here
	type: null,
	userId: Q.Users.loggedInUserId(),
	onClient: new Q.Event(),
	onStream: new Q.Event()
},

{ // methods go here
	refresh: function () {
		var tool = this;
		var state = tool.state;
		var $te = $(tool.element);

		Q.req('Assets/history', ['tool'], function (err, data) {
			var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(data && data.errors);
			if (msg) {
				return console.error("Assets/history: "+ msg);
			}

			var rows = data.slots.tool;

			if (Q.typeOf(rows) !== 'array' || !rows.length) {
				$te.attr('data-empty', true);
				return $te.html(tool.text.HistoryEmpty);
			}

			Q.Template.render('Assets/history/' + state.type, {
				rows: rows,
				text: tool.text
			},
			function (err, html) {
					if (err) return;

					$te.html(html);

					$('.Assets_history_client a', $te).on(Q.Pointer.fastclick, function () {
						var $this = $(this);

						Q.handle(state.onClient, tool, [$this.attr('data-userId'), $this.text()]);
					});

					$('.Assets_history_description a[data-streamName]', $te).on(Q.Pointer.fastclick, function () {
						var $this = $(this);
						var publisherId = $this.attr('data-publisherId');
						var streamName = $this.attr('data-streamName');

						if (publisherId && streamName) {
							Q.handle(state.onStream, tool, [publisherId, streamName]);
						}
					});
				}
			);
		}, {
			fields: {
				type: state.type
			}
		});

	}
});

Q.Template.set('Assets/history/credits',
	'<table class="Assets_history" data-type="credits">' +
	'	<tr><th>{{text.Date}}</th><th>{{text.Amount}}</th><th>{{text.Client}}</th><th>{{text.Description}}</th></tr>' +
	'	{{#each rows}}' +
	'		<tr><td class="Assets_history_date">{{this.date}}</td>' +
	'		<td class="Assets_history_amount">{{this.operation}}</td>' +
	'		<td class="Assets_history_client">{{this.clientInfo.direction}} <a data-userId="{{this.clientInfo.id}}">{{this.clientInfo.name}}</a></td>' +
	'		<td class="Assets_history_description">{{& this.reason}}</td></tr>' +
	'	{{/each}}' +
	'</table>'
);
Q.Template.set('Assets/history/charges',
	'<table class="Assets_history" data-type="charges">' +
	'	<tr><th>{{text.Date}}</th><th>{{text.Amount}}</th><th>{{text.Description}}</th></tr>' +
	'	{{#each rows}}' +
	'		<tr><td class="Assets_history_date">{{this.date}}</td>' +
	'		<td class="Assets_history_amount">{{this.currency}} {{this.amount}}</td>' +
	'		<td class="Assets_history_description">{{this.description}}</td></tr>' +
	'	{{/each}}' +
	'</table>'
);

})(window, Q, jQuery);
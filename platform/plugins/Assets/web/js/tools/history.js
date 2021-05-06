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
	var state = this.state;

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

	// listen Assets/user/credits stream to update history online
	Q.Streams.get(Q.Users.loggedInUser.id, "Assets/user/credits", function () {
		this.onMessage('Assets/credits/bought').set(tool.refresh.bind(tool), tool);
		this.onMessage('Assets/credits/received').set(tool.refresh.bind(tool), tool);
		this.onMessage('Assets/credits/sent').set(tool.refresh.bind(tool), tool);
		this.onMessage('Assets/credits/spent').set(tool.refresh.bind(tool), tool);
		this.onMessage('Assets/credits/granted').set(tool.refresh.bind(tool), tool);
		this.onMessage('Assets/credits/bonus').set(tool.refresh.bind(tool), tool);
	});

	$(this.element).on(Q.Pointer.fastclick, "button[name=test]", function () {
		tool.updateHistory();
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
			});
		}, {
			fields: {
				type: state.type
			}
		});

	},
	/**
	 * Get message and add row to history
	 * @method updateHistory
	 */
	updateHistory: function (stream, message) {
		var tool = this;
		var tmpName = 'Assets/credits/row';
		var $table = $("table.Assets_history tbody", tool.element);
		var fields = {
			date: message.insertedTime,
		};
		var rowId = Q.normalize(message.publisherId + message.streamName + message.ordinal);

		// skip duplicated requests for same message
		if ($("tr#" + rowId, $table).length) {
			return;
		}

		if (message.type === "Assets/credits/bought") {
			tmpName = 'Assets/charge/row';
			var charge = message.getInstruction('charge');
			fields.currency = charge.currency;
			fields.amount = parseFloat(charge.amount).toFixed(2);
			fields.description = message.content;
		}

		Q.Template.render(tmpName, fields, function (err, html) {
			if (err) return;

			$table.prepend($(html).attr("id", rowId));
		});
	}
});

Q.Template.set('Assets/history/credits',
	'<table class="Assets_history" data-type="credits">' +
	'	<thead><tr><th>{{text.Date}}</th><th>{{text.Amount}}</th><th>{{text.Client}}</th><th>{{text.Description}}</th></tr></thead>' +
	'	<tbody>' +
	'	{{#each rows}}' +
	'		{{> Assets/credits/row}}' +
	'	{{/each}}' +
	'	</tbody>' +
	'</table>'
);
Handlebars.registerPartial('Assets/credits/row',
	'<tr><td class="Assets_history_date">{{this.date}}</td>' +
	'<td class="Assets_history_amount">{{this.operation}}</td>' +
	'<td class="Assets_history_client">{{this.clientInfo.direction}} <a data-userId="{{this.clientInfo.id}}">{{this.clientInfo.name}}</a></td>' +
	'<td class="Assets_history_description">{{& this.reason}}</td></tr>'
);
Q.Template.set('Assets/credits/row',
	'{{> Assets/credits/row}}'
);

Q.Template.set('Assets/history/charges',
	'<table class="Assets_history" data-type="charges">' +
	'	<thead><tr><th>{{text.Date}}</th><th>{{text.Amount}}</th><th>{{text.Description}}</th></tr></thead>' +
	'	<tbody>' +
	'	{{#each rows}}' +
	'		{{> Assets/charge/row}}' +
	'	{{/each}}' +
	'	</tbody>' +
	'</table>'
);
Q.Template.set('Assets/charge/row',
	'{{> Assets/charge/row}}'
);
Handlebars.registerPartial('Assets/charge/row',
	'<tr><td class="Assets_history_date">{{this.date}}</td>' +
	'<td class="Assets_history_amount">{{this.currency}} {{this.amount}}</td>' +
	'<td class="Assets_history_description">{{this.description}}</td></tr>'
);

})(window, Q, jQuery);
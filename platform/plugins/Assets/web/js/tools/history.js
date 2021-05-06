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

	// generate table
	Q.Template.render('Assets/history/' + state.type, {
		text: tool.text
	},
	function (err, html) {
		if (err) return;

		$(tool.element).html(html);
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
		var $table = $("table.Assets_history tbody", tool.element);
		var operation = $table.is(':empty') ? "append" : "prepend";

		Q.req('Assets/history', ['tool'], function (err, data) {
			var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(data && data.errors);
			if (msg) {
				return console.error("Assets/history: "+ msg);
			}

			var rows = data.slots.tool;

			/*if (Q.typeOf(rows) !== 'array' || !rows.length) {
				$te.attr('data-empty', true);
				return $te.html(tool.text.HistoryEmpty);
			}*/

			Q.each(rows, function (i, row) {
				// skip duplicated requests for same message
				if ($("tr#" + row.id, $table).length) {
					return;
				}

				Q.Template.render("Assets/row/" + state.type, row,function (err, html) {
					if (err) return;

					var $tr = $(html).attr("id", row.id).addClass("Q_newsflash");

					$tr.on("webkitAnimationEnd oanimationend msAnimationEnd animationend transitionend MSTransitionEnd webkitTransitionEnd oTransitionEnd", function() {
						$tr.removeClass("Q_newsflash");
					});

					$('.Assets_history_client a', $tr).on(Q.Pointer.fastclick, function () {
						var $this = $(this);

						Q.handle(state.onClient, tool, [$this.attr('data-userId'), $this.text()]);
					});

					$('.Assets_history_description a[data-streamName]', $tr).on(Q.Pointer.fastclick, function () {
						var $this = $(this);
						var publisherId = $this.attr('data-publisherId');
						var streamName = $this.attr('data-streamName');

						if (publisherId && streamName) {
							Q.handle(state.onStream, tool, [publisherId, streamName]);
						}
					});

					$table[operation]($tr);
				});
			});
		}, {
			fields: {
				type: state.type
			}
		});
	}
});

Q.Template.set('Assets/history/credits',
	'<table class="Assets_history" data-type="credits">' +
	'	<thead><tr><th>{{text.Date}}</th><th>{{text.Amount}}</th><th>{{text.Client}}</th><th>{{text.Description}}</th></tr></thead>' +
	'	<tbody></tbody>' +
	'</table>'
);
Q.Template.set('Assets/row/credits',
	'<tr><td class="Assets_history_date">{{date}}</td>' +
	'<td class="Assets_history_amount">{{operation}}</td>' +
	'<td class="Assets_history_client">{{clientInfo.direction}} <a data-userId="{{clientInfo.id}}">{{clientInfo.name}}</a></td>' +
	'<td class="Assets_history_description">{{& reason}}</td></tr>'
);

Q.Template.set('Assets/history/charges',
	'<table class="Assets_history" data-type="charges">' +
	'	<thead><tr><th>{{text.Date}}</th><th>{{text.Amount}}</th><th>{{text.Description}}</th></tr></thead>' +
	'	<tbody></tbody>' +
	'</table>'
);
Q.Template.set('Assets/row/charges',
	'<tr><td class="Assets_history_date">{{date}}</td>' +
	'<td class="Assets_history_amount">{{currency}} {{amount}}</td>' +
	'<td class="Assets_history_description">{{description}}</td></tr>'
);

})(window, Q, jQuery);
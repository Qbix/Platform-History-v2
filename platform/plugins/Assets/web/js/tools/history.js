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
 *  @param {boolean} [options.mergeRows=false] If true merge rows with same "amount" field
 *  @param {String} [options.withUserId] - if defined, show only operations with this user
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

	var pipe = Q.pipe(['styles', 'texts', 'table'], tool.refresh.bind(tool));

	Q.addStylesheet('{{Assets}}/css/tools/AssetsHistory.css', pipe.fill("styles"), { slotName: 'Assets' });
	Q.Text.get('Assets/content', function (err, text) {
		var msg = Q.firstErrorMessage(err);
		if (msg) {
			return console.warn(msg);
		}

		tool.text = text;
		pipe.fill("texts")();
	});

	// listen Assets/user/credits stream to update history online
	Q.Streams.get(Q.Users.loggedInUser.id, "Assets/user/credits", function () {
		var refresh = tool.refresh.bind(tool);
		this.onMessage('Assets/credits/bought').set(refresh, tool);
		this.onMessage('Assets/credits/received').set(refresh, tool);
		this.onMessage('Assets/credits/sent').set(refresh, tool);
		this.onMessage('Assets/credits/spent').set(refresh, tool);
		this.onMessage('Assets/credits/granted').set(refresh, tool);
		this.onMessage('Assets/credits/bonus').set(refresh, tool);
	});

	// generate table
	Q.Template.render('Assets/history/' + state.type, {
		text: tool.text.history
	},
	function (err, html) {
		if (err) return;

		$(tool.element).html(html);
		pipe.fill("table")();
	});
},

{ // default options here
	type: null,
	mergeRows: false,
	withUserId: null,
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
		var $toolElement = $(tool.element);
		var _replaceAmount = function ($siblingAmount, newAmount) {
			$siblingAmount.html($siblingAmount.html().replace(/\d+(\.\d+)?/, newAmount));
		};

		Q.req('Assets/history', ['tool'], function (err, data) {
			var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(data && data.errors);
			if (msg) {
				return console.error("Assets/history: "+ msg);
			}

			var rows = data.slots.tool;

			if (Q.typeOf(rows) !== 'array' || !rows.length) {
				$toolElement.attr('data-empty', true);
				return $toolElement.html(tool.text.history.HistoryEmpty);
			}

			$toolElement.attr('data-empty', false);

			Q.each(rows, function (i, row) {
				// skip duplicated requests for same message
				if ($("tr#" + row.id, $table).length) {
					return;
				}

				row.amount = row.amount.toFixed(2);

				if (row.reason) {
					var rowOperation = Q.getObject(["history", row.reason, row.sign], tool.text) || Q.getObject(["history", row.reason], tool.text);
					if (rowOperation) {
						row.operation = rowOperation.interpolate(row);
					} else {
						row.operation = row.amount;
					}
					var rowReason = Q.getObject([state.type, row.reason], tool.text);
					if (rowReason) {
						row.reason = rowReason.interpolate(row);
					}
				}

				Q.Template.render("Assets/row/" + state.type, row, function (err, html) {
					if (err) return;

					var $tr = $(html).prop("id", row.id).attr("data-amount", row.amount).addClass("Q_newsflash");

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

					// merge rows with same amount field
					if (state.mergeRows) {
						var $rows = $("tr:not([data-category])", $table);
						var $sibling = operation === "append" ? $rows.last() : $rows.first();
						var $siblingAmount = $(".Assets_history_amount", $sibling);
						if ($sibling.length && $(".Assets_history_description", $sibling).html() === row.reason) {
							$sibling.attr("data-summ", (parseFloat($sibling.attr("data-summ") || $sibling.attr("data-amount")) + parseFloat(row.amount)).toFixed(2));
							_replaceAmount($siblingAmount, $sibling.attr("data-summ"));
							$tr.removeClass("Q_newsflash").attr("data-category", $sibling.prop("id")).hide();
							$sibling.addClass("Q_newsflash");

							var $bookmark = $(".bookmark div", $sibling);
							if (!$bookmark.length) {
								$("<td><div></div></td>")
								.addClass("bookmark")
								.attr("data-status", 0)
								.on(Q.Pointer.fastclick, function () {
									var $this = $(this);
									var status = $this.attr("data-status");

									$this.attr("data-status", status === "0" ? "1" : "0");

									var $nested = $("tr[data-category=" + $sibling.prop("id") + "]", $table);
									if (status === "0") {
										$nested.show();
										_replaceAmount($siblingAmount, $sibling.attr("data-amount"));
									} else {
										$nested.hide();
										_replaceAmount($siblingAmount, $sibling.attr("data-summ"));
									}
								})
								.appendTo($sibling);
								$bookmark = $(".bookmark div", $sibling);
							}
							$bookmark.html((parseInt($bookmark.html()) || 0) + 1);
						}
					}

					$table[operation]($tr);
				});
			});
		}, {
			fields: {
				type: state.type,
				withUserId: state.withUserId
			}
		});
	}
});

Q.Template.set('Assets/history/credits',
	'<table class="Assets_history" data-type="credits">' +
	'	<thead><tr><th data-type="date">{{text.Date}}</th><th data-type="amount">{{text.Amount}}</th><th data-type="user">{{text.User}}</th><th data-type="desc">{{text.Description}}</th><th></th></tr></thead>' +
	'	<tbody></tbody>' +
	'</table>'
);
Q.Template.set('Assets/row/credits',
	'<tr><td class="Assets_history_date">{{date}}</td>' +
	'<td class="Assets_history_amount">{{operation}}</td>' +
	'<td class="Assets_history_client">{{clientInfo.direction}} <a data-userId="{{clientInfo.id}}">{{clientInfo.name}}</a></td>' +
	'<td class="Assets_history_description">{{{reason}}}</td></tr>'
);

Q.Template.set('Assets/history/charges',
	'<table class="Assets_history" data-type="charges">' +
	'	<thead><tr><th data-type="date">{{text.Date}}</th><th data-type="amount">{{text.Amount}}</th><th data-type="desc">{{text.Description}}</th><th></th></tr></thead>' +
	'	<tbody></tbody>' +
	'</table>'
);
Q.Template.set('Assets/row/charges',
	'<tr><td class="Assets_history_date">{{date}}</td>' +
	'<td class="Assets_history_amount">{{currency}} {{amount}}</td>' +
	'<td class="Assets_history_description">{{description}}</td></tr>'
);

})(window, Q, jQuery);
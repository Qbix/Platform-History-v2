Q.page("Streams/participating", function () {
	var userId = Q.Users.loggedInUserId();

	$(".Streams_participating_stream_checkmark").on("change", function () {
		var $this = $(this);
		var publisherId = $this.attr('data-publisherId');
		var name = $this.prop('name');

		if ($this.prop('checked')) {
			Q.Streams.Stream.subscribe(publisherId, name);
		} else {
			Q.Streams.Stream.unsubscribe(publisherId, name);
		}
	});

	var _modIdentified = function () {
		var type = $(this).closest('.Streams_participating_item').attr('data-type');
		Q.Users.setIdentifier({
			identifierType: type,
			onSuccess: function () {
				Q.Text.get('Streams/content', function (err, text) {
					var msg = Q.firstErrorMessage(err);
					if (msg) {
						return console.warn(msg);
					}

					var text = Q.getObject('followup.'+type+'.CheckYour' + type.toCapitalized(), text);
					Q.alert(text);
				});
			}
		});
	};

	$('<div class="Streams_participating_item_actions">')
	.appendTo('.Streams_participating .Streams_participating_item')
	.plugin('Q/actions', {
		actions: {
			plus: _modIdentified,
			edit: _modIdentified,
			remove: function () {
				var $this = $(this);
				var $item = $this.closest('.Streams_participating_item');

				Q.Text.get('Streams/content', function (err, text) {
					var msg = Q.firstErrorMessage(err);
					if (msg) {
						return console.warn(msg);
					}

					var text = Q.getObject('followup.AreYouSureRemoveIdentifier', text);
					Q.confirm(text, function (res) {
						if (!res) {
							return;
						}

						$item.addClass('Q_working');
						var $identifier = $('span', $item);

						Q.req('Users/identifier', [], function (err, data) {
							$item.removeClass('Q_working');
							var fem = Q.firstErrorMessage(err, data && data.errors);
							if (fem) {
								return Q.alert(fem);
							}

							$item.attr('data-defined', 'false');
							$identifier.html('');
						}, {
							method: 'delete',
							fields: {
								identifier: $identifier.text()
							}
						});
					});
				});
			}
		},
		alwaysShow: true,
		clickable: false
	});

	return function () {

	};

}, 'Communities');

Q.Tool.onActivate("Q/expandable").set(function () {
	this.state.beforeExpand.set(function () {
		// create Streams/participants tools
		$(".Streams_participating_stream td[data-type=participants][data-processed=0]", this.element).each(function () {
			$("<div>").tool("Streams/participants", {
				'publisherId': this.getAttribute("data-publisherId"),
				'streamName': this.getAttribute("data-streamName"),
				'showSummary': true,
				'showBlanks': false,
				'showControls': true,
				'maxShow': 100
			}).appendTo(this).activate();

			this.setAttribute("data-processed", 1);
		});
	});
}, true);

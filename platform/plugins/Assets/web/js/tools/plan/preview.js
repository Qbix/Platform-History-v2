(function (Q, $, window, undefined) {
/**
 * Assets/plan/preview tool.
 * Renders a tool to preview assets plan
 * @class Assets/plan/preview
 * @constructor
 * @param {Object} [options] options to pass besides the ones to Streams/preview tool
 * @param {Boolean} [options.skipRelatedStreams] - if true skip loading and display streams related to this plan
 *
 */
Q.Tool.define("Assets/plan/preview", ["Streams/preview"], function(options, preview) {
	var tool = this;
	tool.preview = preview;

	var pipe = new Q.Pipe(["stream"], function () {
		preview.state.onRefresh.add(tool.refresh.bind(tool));
	});

	preview.state.creatable.preprocess = function (_proceed) {
		tool.openDialog(function (dialog) {
			var endDate = $("input[name=endDate]", dialog).val();
			endDate = endDate ? Date.parse(endDate) : null;
			endDate = Number.isInteger(endDate) ? endDate/1000 : null;
			var fields = {
				title: $("input[name=title]", dialog).val(),
				content: $("textarea[name=description]", dialog).val(),
				attributes: {
					amount: $("input[name=amount]", dialog).val(),
					currency: 'USD',
					period: $("select[name=period]", dialog).val(),
					endDate: endDate
				}
			};
			fields.readLevel = parseInt($("select[name=access]", dialog).val());
			Q.handle(_proceed, preview, [fields]);
		}, function () {
			Q.handle(_proceed, preview, [false]);
		});
	};
	preview.state.beforeClose = function (_delete) {
		Q.confirm(tool.text.subscriptions.plan.AreYouSureDeletePlan, function (result) {
			if (result){
				_delete();
			}
		});
	};


	$(tool.element).on(Q.Pointer.fastclick, function () {
		Q.handle(tool.state.onInvoke, tool);
	});

	if (preview.state.streamName) {
		Q.Streams.get(preview.state.publisherId, preview.state.streamName, function (err) {
			tool.stream = this;
			pipe.fill("stream")();
		});
	} else {
		pipe.fill("stream")();
	}
},

{
	icon: {
		defaultSize: '1000x'
	},
	periods: ["annually", "monthly", "weekly", "daily"],
	skipRelatedStreams: false,
	onInvoke: new Q.Event()
},

{
	refresh: function (stream, callback) {
		var tool = this;
		tool.stream = stream;
		var state = this.state;

		var publisherId = stream.fields.publisherId;
		var streamName = stream.fields.name;
		var isAdmin = stream.testAdminLevel(40);
		var previewState = tool.preview.state;
		var interrupted = stream.getAttribute("interrupted");

		if (interrupted && !stream.testWriteLevel(40)) {
			return Q.Tool.remove(tool.element, true, true);
		}

		// track stream changes online
		stream.retain(tool);

		$(tool.element).attr("data-interrupted", interrupted);

		Q.Template.render('Assets/plan/preview', {
			publisherId,
			streamName,
			title: stream.fields.title,
			description: stream.fields.content.encodeHTML(),
			price: '$' + parseFloat(stream.getAttribute('amount')).toFixed(2),
			periods: state.periods,
			period: stream.getAttribute('period'),
			isAdmin,
			showRelatedStreams: !state.skipRelatedStreams
		}, function (err, html) {
			if (err) return;
			Q.replace(tool.element, html);

			tool.preview.icon($("img.Streams_preview_icon", tool.element)[0], null, {
				overrideShowSize: {
					'': state.icon.defaultSize
				}
			});

			if (isAdmin) {
				$(".Assets_plan_participants", tool.element).tool("Streams/participants", {
					maxShow: 100,
					showSummary: false,
					showControls: false,
					publisherId,
					streamName,
					invite: {
						readLevel: 40,
						appUrl: Q.url("Assets/plan/" + publisherId + "/" + streamName.split("/").pop())
					}
				}).activate();
			}

			$(".Assets_plan_preview_description", tool.element).on(Q.Pointer.fastclick, function (e) {
				e.preventDefault();
				e.stopPropagation();
				var $this = $(this);
				if ($this.attr("data-state") === "minimised") {
					$this.attr("data-state", "maximised");
				} else {
					$this.attr("data-state", "minimised");
				}
				return false;
			});

			if (previewState.editable && stream.testWriteLevel('edit')) {
				previewState.actions.actions = previewState.actions.actions || {};
				previewState.actions.actions.edit = function () {
					var endDate = stream.getAttribute("endDate");
					endDate = Number.isInteger(endDate) ? new Date(endDate*1000).toISOString().split('T')[0] : null;
					tool.openDialog(function (dialog) {
						var endDate = $("input[name=endDate]", dialog).val();
						endDate = endDate ? Date.parse(endDate) : null;
						endDate = Number.isInteger(endDate) ? endDate/1000 : null;

						stream.set('title', $("input[name=title]", dialog).val());
						stream.set('content', $("textarea[name=description]", dialog).val());
						stream.set('readLevel', parseInt($("select[name=access]", dialog).val()));
						stream.setAttribute("amount", $("input[name=amount]", dialog).val());
						stream.setAttribute("period", $("select[name=period]", dialog).val());
						stream.setAttribute("endDate", endDate);
						stream.save({
							onSave: function () {
								stream.refresh(function () {
									tool.refresh(this);
								}, {
									messages: true,
									evenIfNotRetained: true
								});
							}
						});
					}, null, {
						title: stream.fields.title,
						description: stream.fields.content,
						amount: stream.getAttribute("amount"),
						period: stream.getAttribute("period"),
						readLevel: stream.fields.readLevel,
						endDate: endDate,
						interrupted: stream.getAttribute("interrupted") || false
					});
				};
				tool.preview.actions();
			}

			$(".Assets_plan_related_streams", tool.element).tool("Streams/related", {
				publisherId,
				streamName,
				relationType: Q.Assets.Subscriptions.plan.relationType,
				editable: false,
				closeable: false,
				realtime: true,
				sortable: false,
				relatedOptions: {
					withParticipant: false,
					ascending: true
				}
			}).activate();
		});
	},
	openDialog: function (saveCallback, closeCallback, fields) {
		var tool = this;
		var $toolElement = $(this.element);
		var state = this.state;
		fields = fields || {};

		Q.Dialogs.push({
			title: "New Subscription Plan",
			template: {
				name: "Assets/plan/composer",
				fields: Q.extend({
					periods: state.periods,
					readLevel: fields.readLevel || Q.getObject("plan.defaults.readLevel", Q.Assets) || 40
				}, fields)
			},
			className: "Assets_plan_composer",
			onActivate: function (dialog) {
				if (typeof fields.interrupted !== 'undefined') {
					$(dialog).attr("data-interrupted", fields.interrupted.toString());
				}

				$("input,textarea", dialog).plugin('Q/placeholders');

				$("button[name=save]", dialog).on(Q.Pointer.fastclick, function () {
					var $form = $(this).closest("form");
					var valid = true;

					Q.each(['title', 'amount', 'description', 'endDate'], function (i, value) {
						var $item = $("input[name=" + value + "]", $form);

						if ($item.is(":visible") && $item.attr('required') && !$item.val()) {
							$item.addClass('Q_error');
							valid = false;
						} else {
							$item.removeClass('Q_error');
						}
					});

					if (!valid) {
						return false;
					}

					Q.handle(saveCallback, dialog, [dialog]);
					Q.Dialogs.pop();
					return false;
				});

				$("button[name=interrupt]", dialog).on(Q.Pointer.fastclick, function () {
					var $this = $(this);
					$this.addClass("Q_working");

					Q.req("Assets/plan", ["interrupt"],function (err, response) {
						$this.removeClass("Q_working");
						var result = response.slots.interrupt;
						if (err || !result) {
							return;
						}

						$toolElement.add(dialog).attr("data-interrupted", true);
						tool.stream.refresh(function () {
							tool.stream = this;
						}, {
							messages: true,
							evenIfNotRetained: true
						});

						Q.Dialogs.pop();
					}, {
						method: "put",
						fields: {
							publisherId: tool.stream.fields.publisherId,
							streamName: tool.stream.fields.name
						}
					});

					return false;
				});

				$("button[name=continue]", dialog).on(Q.Pointer.fastclick, function () {
					var $this = $(this);
					$this.addClass("Q_working");

					Q.req("Assets/plan", ["continue"],function (err, response) {
						$this.removeClass("Q_working");
						var result = response.slots.continue;
						if (err || !result) {
							return;
						}

						$toolElement.add(dialog).attr("data-interrupted", false);
						tool.stream.refresh(function () {
							tool.stream = this;
						}, {
							messages: true,
							evenIfNotRetained: true
						});

						Q.Dialogs.pop();
					}, {
						method: "put",
						fields: {
							publisherId: tool.stream.fields.publisherId,
							streamName: tool.stream.fields.name
						}
					});

					return false;
				});
			},
			onClose: function (dialog) {
				Q.handle(closeCallback, dialog, [dialog]);
			}
		});
	}
});

Q.Template.set('Assets/plan/preview',
`<div class="Streams_preview_container Streams_preview_view Q_clearfix">
	<img class="Streams_preview_icon Q_square">
	{{#if isAdmin}}
		<div class="Assets_plan_participants"></div>
	{{/if}}
	<h3 class="Streams_preview_title Streams_preview_view">{{title}}</h3>
	<span class="Assets_plan_preview_price">{{price}}</span>
	<span class="Assets_plan_preview_period">{{period}}</span>
	<div class="Assets_plan_preview_description" data-state="minimised"><span>{{{description}}}</span></div>
	{{#if showRelatedStreams}}
	<div class="Assets_plan_related_streams"></div>
	{{/if}}
</div>`, {text:["Assets/content"]}
);

Q.Template.set("Assets/plan/composer",
`<form>
	<input type="text" name="title" required placeholder="{{subscriptions.plan.TitlePlaceholder}}" value="{{title}}">
	<label for="price"><input type="text" name="amount" required placeholder="{{subscriptions.plan.PricePlaceholder}}" value="{{amount}}"></label>
	<select name="period">
	{{#each periods}}
		{{#option this this ../period}}{{/option}}
	{{/each}}
	</select>
	
	<label class="Assets_plan_endDate"><input name="endDate" type="date" value="{{endDate}}"> {{subscriptions.plan.EndDate}}</label>
	<textarea name="description" placeholder="{{subscriptions.plan.DescriptionPlaceholder}}">{{description}}</textarea>
	
	<label class="Assets_plan_access"><select name="access"><option value="40" {{#ifEquals readLevel 40}}selected{{/ifEquals}}>{{subscriptions.plan.Available}}</option><option value="0" {{#ifEquals readLevel 0}}selected{{/ifEquals}}>{{subscriptions.plan.Hidden}}</option><option value="25" {{#ifEquals readLevel 25}}selected{{/ifEquals}}>{{subscriptions.plan.InviteOnly}}</option></select></label>
	
	<div class="Assets_plan_composer_buttons">
		<button name="save" class="Q_button" type="button">{{subscriptions.plan.SavePlan}}</button>
		<button name="interrupt" class="Q_button" type="button">{{subscriptions.plan.Interrupt}}</button>
		<button name="continue" class="Q_button" type="button">{{subscriptions.plan.Continue}}</button>
	</div>
</form>`, {text:["Assets/content"]}
);

})(Q, Q.jQuery, window);
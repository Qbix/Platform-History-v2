(function (Q, $, window, undefined) {
/**
 * Assets/service/preview tool.
 * Renders a tool to preview services
 * @class Assets/service/preview
 * @constructor
 * @param {Object} [options] options to pass besides the ones to Streams/preview tool
 */
Q.Tool.define("Assets/service/preview", ["Streams/preview"], function(options, preview) {
	var tool = this;
	tool.preview = preview;

	Q.addStylesheet('{{Assets}}/css/tools/ServicePreview.css', { slotName: 'Assets' });

	preview.state.creatable.preprocess = function (_proceed) {
		tool.openDialog(function (dialog) {
			var requiredParticipants = $("select[name=requiredParticipants]", dialog).val() || null;
			if (typeof requiredParticipants === "string") {
				requiredParticipants = [requiredParticipants];
			}

			Q.handle(_proceed, preview, [{
				title: $("input[name=title]", dialog).val(),
				content: $("textarea[name=description]", dialog).val(),
				attributes: {
					price: $("input[name=price]", dialog).val(),
					link: $("input[name=link]", dialog).val(),
					payment: $("select[name=payment]", dialog).val(),
					requiredParticipants: requiredParticipants
				}
			}]);
		}, function () {
			Q.handle(_proceed, preview, [false]);
		});
	};

	// check for related services before delete
	preview.state.beforeClose = function (_delete) {
		tool.element.classList.add("Q_working");

		Q.req("Assets/services", "data", function (err, responce) {
			if (Q.firstErrorMessage(err, responce && responce.errors)) {
				return;
			}

			tool.element.classList.remove("Q_working");

			var relatedServices = Q.getObject("slots.data.relatedServices", responce) || [];

			if (relatedServices.length) {
				var message = tool.text.services.AreYouSureDelete;
				message += "<br>" + tool.text.services.AmountServicesRelated.interpolate({amount: relatedServices.length});

				Q.confirm(message, function (result) {
					if (!result){
						return;
					}

					_delete();
				});

				return;
			}

			_delete();
		}, {
			fields: {
				publisherId: preview.state.publisherId,
				streamName: preview.state.streamName
			}
		});
	};

	$(tool.element).on(Q.Pointer.fastclick, function () {
		Q.handle(tool.state.onInvoke, tool);
	});

	Q.Text.get('Assets/content', function (err, text) {
		var msg = Q.firstErrorMessage(err);
		if (msg) {
			return console.warn(msg);
		}

		tool.text = text;

		preview.state.onRefresh.add(tool.refresh.bind(tool));
	});
},

{
	editable: true,
	onInvoke: new Q.Event(function () {
		var tool = this;
		var state = this.state;
		var previewState = tool.preview.state;

		if (!previewState.publisherId || !previewState.streamName || !state.editable) {
			return;
		}

		Q.Streams.get(previewState.publisherId, previewState.streamName, function () {
			if (!this.testWriteLevel('edit')) {
				return;
			}

			tool.edit();
		});
	})
},

{
	refresh: function (stream, callback) {
		var tool = this;
		tool.stream = stream;
		var ps = tool.preview.state;
		var $toolElement = $(tool.element);
		var price = stream.getAttribute('price');

		Q.Template.render('Assets/service/preview', {
			title: stream.fields.title,
			price: price ? '($' + parseFloat(price).toFixed(2) + ')' : '',
		}, function (err, html) {
			if (err) return;
			tool.element.innerHTML = html;

			tool.preview.icon($("img.Streams_preview_icon", tool.element)[0]);
		});

		Q.Streams.Stream.onFieldChanged(ps.publisherId, ps.streamName)
		.set(function (fields, changed) {
			if (changed.title) {
				tool.$('.Streams_preview_title').html(changed.title);
			}
		}, tool);

		Q.Streams.Stream.onAttribute(ps.publisherId, ps.streamName, "price")
		.set(function (attributes, k) {
			var price = parseFloat(attributes[k]);
			price = price ? "($" + price.toFixed(2) + ")" : '';
			$("span.Assets_service_preview_price", tool.element).html(price);
		}, tool);
	},
	edit: function () {
		var tool = this;
		var previewState = this.preview.state;

		Q.Streams.get(previewState.publisherId, previewState.streamName, function () {
			var stream = this;
			if (!stream.testWriteLevel('edit')) {
				return;
			}

			tool.openDialog(function (dialog) {
				stream.pendingFields.title = $("input[name=title]", dialog).val();
				stream.pendingFields.content = $("textarea[name=description]", dialog).val();
				stream.setAttribute('payment', $("select[name=payment]", dialog).val());
				stream.setAttribute('price', $("input[name=price]", dialog).val());
				stream.setAttribute('link', $("input[name=link]", dialog).val());
				stream.save({
					onSave: function () {
						stream.refresh();
					}
				});
			}, null, {
				title: stream.fields.title,
				payment: stream.getAttribute('payment'),
				price: stream.getAttribute('price'),
				selectedParticipants: stream.getAttribute('requiredParticipants'),
				link: stream.getAttribute('link'),
				description: stream.fields.content
			});
		});
	},
	openDialog: function (saveCallback, closeCallback, fields) {
		var tool = this;
		var relatedParticipants = Q.getObject("Assets.service.relatedParticipants", Q);
		var selectedParticipants = Q.getObject("selectedParticipants", fields);
		if (selectedParticipants) {
			Q.each(relatedParticipants, function (index) {
				if (selectedParticipants.includes(index)) {
					relatedParticipants[index].selected = true;
				}
			});
		}

		Q.Dialogs.push({
			title: Q.getObject("services.NewServiceTemplate.Title", tool.text) || "New Service Template",
			template: {
				name: "Assets/service/composer",
				fields: Q.extend({
					relatedParticipants: relatedParticipants,
					text: tool.text
				}, fields)
			},
			className: "Assets_service_composer",
			onActivate: function (dialog) {
				$("input,textarea", dialog).plugin('Q/placeholders');

				var $price = $("label[for=price]", dialog);
				var payment = Q.getObject("payment", fields) || 'free';
				if (payment === 'free') {
					$price.hide();
				}

				var $payment = $("select[name=payment]", dialog).on('change', function () {
					if ($payment.val() === 'free') {
						$("input[name=price]", $price).val('');
						$price.hide();
					} else {
						$price.show();
					}
				});

				$payment.val(payment);

				$("button[name=save]", dialog).on(Q.Pointer.fastclick, function () {
					var $form = $(this).closest("form");
					var valid = true;

					Q.each(['title', 'price', 'description'], function (i, value) {
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
			},
			onClose: function (dialog) {
				Q.handle(closeCallback, dialog, [dialog]);
			}
		});
	}
});

Q.Template.set('Assets/service/preview',
	'<div class="Streams_preview_container Streams_preview_view Q_clearfix">'
	+ '<img class="Streams_preview_icon">'
	+ '<div class="Streams_preview_contents">'
	+ '<h3 class="Streams_preview_title Streams_preview_view">{{title}}</h3>'
	+ '<span class="Assets_service_preview_price">{{price}}</span>'
	+ '</div></div>'
);

Q.Template.set("Assets/service/composer",
	'<form>' +
	'	<input type="text" name="title" required placeholder="{{text.services.NewServiceTemplate.TitlePlaceholder}}" value="{{title}}">' +
	'	<select name="payment"><option value="free">{{text.services.Free}}</option><option value="optional">{{text.services.OptionalContribution}}</option><option value="required">{{text.services.RequiredPayment}}</option></select>' +
	'	<label for="price"><input type="text" name="price" required placeholder="{{text.services.NewServiceTemplate.PricePlaceholder}}" value="{{price}}"></label>' +
	'	{{#if relatedParticipants}}' +
	'		<label>{{text.services.NewServiceTemplate.SelectRequiredParticipants}}</label>' +
	'		<select name="requiredParticipants" multiple>' +
	'			{{#each relatedParticipants}}' +
	'				<option value="{{this.streamName}}" {{#if this.selected}}selected{{/if}}>{{this.streamName}}</option>' +
	'			{{/each}}' +
	'		</select>' +
	'	{{/if}}' +
	'	<input type="text" name="link" placeholder="{{text.services.NewServiceTemplate.LinkPlaceholder}}" value="{{link}}">' +
	'	<textarea name="description" placeholder="{{text.services.NewServiceTemplate.DescriptionPlaceholder}}">{{description}}</textarea>' +
	'	<button name="save" class="Q_button">{{text.services.NewServiceTemplate.SaveService}}</button>' +
	'</form>'
);

})(Q, Q.$, window);
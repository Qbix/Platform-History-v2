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
			Q.handle(_proceed, preview, [{
				title: $("input[name=title]", dialog).val(),
				content: $("textarea[name=description]", dialog).val(),
				attributes: {
					price: $("input[name=price]", dialog).val()
				}
			}]);
		}, function () {
			Q.handle(_proceed, preview, [false]);
		});
	};

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

},

{
	refresh: function (stream, callback) {
		var tool = this;
		tool.stream = stream;
		var ps = tool.preview.state;
		var $toolElement = $(tool.element);

		$toolElement.attr('data-writeLevel', stream.testWriteLevel('edit'));

		Q.Template.render('Assets/service/preview', {
			title: stream.fields.title,
			price: '($' + parseFloat(stream.getAttribute('price')).toFixed(2) + ')'
		}, function (err, html) {
			if (err) return;
			tool.element.innerHTML = html;

			tool.preview.icon($("img.Streams_preview_icon", tool.element)[0]);

			$("i.icon-edit", tool.element).on(Q.Pointer.fastclick, function (e) {
				e.stopImmediatePropagation();
				tool.edit();
				return false;
			});
		});

		Q.Streams.Stream.onFieldChanged(ps.publisherId, ps.streamName)
		.set(function (fields, changed) {
			if (changed.title) {
				tool.$('.Streams_preview_title').html(changed.title);
			}
		}, tool);

		Q.Streams.Stream.onAttribute(ps.publisherId, ps.streamName, "price")
		.set(function (attributes, k) {
			var price = parseFloat(attributes[k]).toFixed(2);
			$("span.Assets_service_preview_price", tool.element).html("($" + price + ")");
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
				stream.setAttribute('price', $("input[name=price]", dialog).val());
				stream.save({
					onSave: function () {
						stream.refresh();
					}
				});
			}, null, {
				title: stream.fields.title,
				price: stream.getAttribute('price'),
				description: stream.fields.content
			});
		});
	},
	openDialog: function (saveCallback, closeCallback, fields) {
		var tool = this;

		Q.Dialogs.push({
			title: Q.getObject("services.NewServiceTemplate.Title", tool.text) || "New Service Template",
			template: {
				name: "Assets/service/composer",
				fields: Q.extend({text: tool.text}, fields)
			},
			className: "Assets_service_composer",
			onActivate: function (dialog) {
				$("input,textarea", dialog).plugin('Q/placeholders');

				$("button[name=save]", dialog).on(Q.Pointer.fastclick, function () {
					var $form = $(this).closest("form");
					var valid = true;

					Q.each(['title', 'price', 'description'], function (i, value) {
						var $item = $("input[name=" + value + "]", $form);

						if ($item.attr('required') && !$item.val()) {
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
	+ '<i class="icon-edit"></i>'
	+ '</div></div>'
);

Q.Template.set("Assets/service/composer",
	'<form>' +
	'	<input type="text" name="title" required placeholder="{{text.services.NewServiceTemplate.TitlePlaceholder}}" value="{{title}}">' +
	'	<label for="price"><input type="text" name="price" required placeholder="{{text.services.NewServiceTemplate.PricePlaceholder}}" value="{{price}}"></label>' +
	'	<textarea name="description" placeholder="{{text.services.NewServiceTemplate.DescriptionPlaceholder}}">{{description}}</textarea>' +
	'	<button name="save" class="Q_button">{{text.services.NewServiceTemplate.SaveService}}</button>' +
	'</form>'
);

})(Q, Q.$, window);
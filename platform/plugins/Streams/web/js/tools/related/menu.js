(function (Q, $) {

/**
 * @module Streams-tools
 */

var Streams = Q.Streams;

/**
 * Apply additional actions to manage menu items with Q/tabs + Streams/related tools.
 * It add special icon to menu item, by clicking which launched modification UI.
 * Also it possible to add submenu items.
 * @class Streams related menu
 * @constructor
 * @param {Object} [options] options for the tool
 */
Q.Tool.define("Streams/related/menu", ["Streams/related", "Q/tabs"], function _Streams_related_menu_tool (options) {
	var tool = this;
	var state = this.state;

	tool.tabsTool = Q.Tool.from(tool.element, 'Q/tabs');

	Q.addStylesheet('{{Streams}}/css/tools/streamsRelatedMenu.css');

	Q.Text.get('Streams/content', function (err, text) {
		var msg = Q.firstErrorMessage(err, text);
		if (msg) {
			return console.error(msg);
		}

		tool.text = text.menu;
	});

	// observe dom elements for mutation
	tool.domObserver = new MutationObserver(function (mutations) {
		mutations.forEach(function(mutation) {
			if (mutation.type !== 'childList' || Q.isEmpty(mutation.removedNodes)) {
				return;
			}

			mutation.removedNodes.forEach(function(removedElement) {
				if (removedElement.tagName.toLowerCase() !== 'i' || !removedElement.classList.contains(state.editClass)) {
					return;
				}

				var previewTool = Q.Tool.from(mutation.target, 'Streams/preview');

				if (!previewTool) {
					return;
				}

				tool.makeEditable(previewTool);
			});
		});
	});

	// replace Q/inplace actions for tabs
	Q.Tool.onActivate('Streams/preview').set(function () {
		if (!$(tool.element).has(this.element).length) {
			return;
		}

		var previewTool = this;
		var $te = $(this.element);

		// observe preview tool element for DOM modifications
		tool.domObserver.observe(previewTool.element, {childList: true});

		if (!$te.hasClass('Streams_related_composer')) {
			tool.createSubMenu(previewTool);
			tool.makeEditable(previewTool);
			return ;
		}

		// rewrite Streams/preview composer
		previewTool.state.creatable.preprocess = function (_proceed) {
			Q.prompt(null, function (title) {
				if (!title) {
					return;
				}

				Q.handle(_proceed, previewTool, [{title: title}]);
			}, {
				placeholder: tool.text.placeholder
			});
		};

		previewTool.state.onCreate.set(function () {
			tool.makeEditable(previewTool);
		}, tool);
	}, 'School');
},

{
	editClass: 'icon-edit',
	relationType: 'articles'
},

{
	createSubMenu: function (previewTool) {
		var tool = this;
		var state = this.state;
		var previewState = previewTool.state;
		var $previewElement = $(previewTool.element);

		if (!previewState.publisherId || !previewState.streamName) {
			return;
		}

		Q.Streams.related(previewState.publisherId, previewState.streamName, state.relationType, true, function (err) {
			if (err) {
				return;
			}

			if (Q.isEmpty(this.relatedStreams)) {
				return $previewElement.plugin('Q/contextual', 'remove');
			}

			var elements = [];
			Q.each(this.relatedStreams, function () {
				elements.push($('<li data-action="' + this.url() + '">' + this.fields.title + '</li>')[0]);
			});

			$previewElement.plugin("Q/contextual", {
				elements: elements,
				defaultHandler: function (item) {
					Q.handle($(item).attr('data-action'));
				},
				onConstruct: function ($contextual) {
					$("li", $contextual).removeClass('Q_selected');

					if ($('li[data-action="' + Q.Page.currentUrl() + '"]', $contextual).addClass('Q_selected').length) {
						tool.tabsTool.indicateCurrent(this[0]);
					}
				}
			});
		});
	},
	makeEditable: function (previewTool) {
		var tool = this;
		var state = this.state;

		if ($("i." + state.editClass, previewTool.element).length) {
			return;
		}

		if (!previewTool.state.publisherId || !previewTool.state.streamName) {
			return;
		}

		Q.Streams.get(previewTool.state.publisherId, previewTool.state.streamName, function () {
			if (!this.testWriteLevel('edit')) {
				return;
			}

			$('<i class="' + state.editClass + '"></i>')
			.on(Q.Pointer.fastclick, function (e) {
				e.stopImmediatePropagation();
				tool.edit(previewTool);
				return false;
			})
			.appendTo(previewTool.element);

			previewTool.element.classList.add('Streams_related_menu_edit');
		});
	},
	edit: function (previewTool) {
		var tool = this;
		var state = this.state;
		var previewState = previewTool.state;

		if (!previewState.publisherId || !previewState.streamName) {
			return;
		}

		Q.Streams.get(previewState.publisherId, previewState.streamName, function () {
			var stream = this;
			if (!stream.testWriteLevel('edit')) {
				return;
			}

			Q.Dialogs.push({
				title: tool.text.ModTab,
				template: {
					name: 'Streams/related/menu/edit',
					fields: {
						title: stream.fields.title,
						text: tool.text
					}
				},
				className: 'Streams_related_menu_edit',
				onActivate: function (dialog) {
					$(".Streams_related_menu_edit_submenu", dialog).tool('Streams/related', {
						publisherId: previewState.publisherId,
						streamName: previewState.streamName,
						relationType: state.relationType,
						creatable: {
							'Websites/article': {
								title: ''
							}
						},
						closeable: true,
						editable: 'title'
					}).activate(function () {

					});

					$("button[name=save]", dialog).on(Q.Pointer.fastclick, function () {
						stream.pendingFields['title'] = $("input[name=title]", dialog).val();
						stream.save({
							onSave: function () {
								stream.refresh();
								previewTool.loading();
								previewTool.preview();
							}
						});
						Q.Dialogs.pop();
					});

					$("button[name=delete]", dialog).on(Q.Pointer.fastclick, function () {
						previewTool.delete();
						Q.Dialogs.pop();
					});
				},
				onClose: function () {
					tool.createSubMenu(previewTool);
				}
			});
		});

		return false;
	}
});

Q.Template.set('Streams/related/menu/edit',
	'<input type="text" name="title" value="{{title}}">' +
	'<fieldset class="section"><legend>{{text.Submenu}}</legend>' +
	'<div class="Streams_related_menu_edit_submenu"></div>' +
	'</fieldset>' +
	'<div class="Streams_related_menu_edit_buttons"><button name="save" class="Q_button">{{text.Save}}</button>' +
	'<button name="delete" class="Q_button">{{text.Delete}}</button></div>'
);
})(Q, Q.jQuery);
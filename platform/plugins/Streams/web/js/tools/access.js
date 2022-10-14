(function (Q, $) {

/**
 * Streams Tools
 * @module Streams-tools
 * @main
 */

/**
 * Interface for managing access to a given stream
 * @class Streams access
 * @constructor
 */
Q.Tool.define("Streams/access", function(options) {
	if (!options) {
		throw new Q.Exception("options required");
	}
	Q.addStylesheet('{{Streams}}/css/tools/access.css');

    /*Q.Text.get('Assets/content', function (err, text) {

    });*/

	if (!options.tab) {
		options.tab = 'read';
	}
	var tool = this, state = this.state,
		element, levelForEveryone, fieldName,
		actionText, tempSelect, onActivateHandler;

	function prepareSelect($select, criteria, value, action) {
		if (!state.stream) return;
		if (!action) {
			action = 'access';
		}
		console.log('prepareSelect', $select, criteria, value, action)

		if (typeof value !== 'undefined') {
			console.log('prepareSelect if1')

			$select.find('option').removeAttr('selected');
			$select.attr(
				'selectedIndex',
				$select.find('option[value='+value+']').attr('selected', 'selected').index()
			);
			$select.attr('name', 'cloned');

			$select.change(function () {
				console.log('changed')
				var fields = {
					publisherId: state.stream.fields.publisherId,
					streamName: state.stream.fields.name
				};
				fields[fieldName] = $(this).val();
				Q.extend(fields, criteria);
				Q.req('Streams/access', ['data'], function (err, response) {
					var msg;
					if (msg = Q.firstErrorMessage(err, response && response.errors)) {
						alert(msg);
					}
					state.stream.refresh();
				}, {
					method: 'put',
					fields: fields
				});
			});
		}
		return $select;
	}

	function newRemoveLink(criteria) {
		if (!state.stream) return;
		var link = $('<a href="#remove" />').click(function () {
			var $this = $(this);
			var fields = {
				publisherId: state.stream.fields.publisherId,
				streamName: state.stream.fields.name,
			};
			fields[fieldName] = -1;
			Q.extend(fields, criteria);
			
			Q.req('Streams/access', ['data'], function (err, response) {
				var msg;
				if (msg = Q.firstErrorMessage(err, response && response.errors)) {
					alert(msg);
				}
				$this.closest('.Streams_access_for_item').remove();
				if (criteria.ofUserId) {
					delete tool.child('Streams_userChooser').exclude[criteria.ofUserId];
				} else if (criteria.ofContactLabel) {
					$('option', tempSelect).each(function () {
						if ($(this).val() === criteria.ofContactLabel) {
							$(this).appendTo($('.Streams_access_levelAddLabel', element));
							return false;
						}
					});
				}
			}, {
				method: 'put',
				fields: fields
			});
			return false;
		})

		for (var k in criteria) {
			link.data(k, criteria[k]);
		}
		return link;
	}

	function addAccessRow(access, avatar) {
		var userId = access.ofUserId;
		var contactLabel = access.ofContactLabel;

		if ((!contactLabel && !userId) || access[fieldName] < 0) {
			return;
		}

		var clonedSelect = levelForEveryone.clone();
		var criteria;
		if (userId !== "") {
			if (!avatar) {
				avatar = new Q.Streams.Avatar(state.avatarArray[userId]);
				if (!avatar) {
					console.warn("Streams/access tool: avatar missing for user with id " + userId);
					return;
				}
			}
			criteria = { ofUserId: userId };
			tool.child('Streams_userChooser').exclude[userId] = true;
		} else if (contactLabel) {
			criteria = {ofContactLabel: contactLabel};
			$('.Streams_access_levelAddLabel option', element).each(function () {
				if ($(this).val() == contactLabel) {
					$(this).closest('select').val('');
					$(this).appendTo(tempSelect);
					return false;
				}
			});
		} else {
			return;
		}

		prepareSelect(clonedSelect, criteria, access[fieldName]);
		var labelAccessDiv = $('<div class="Streams_access_for_item"/>');
		if (userId !== "") {
			var label = state.labels[contactLabel];
			var icon = $('<img />').attr('src', avatar.iconUrl(true)).css('width', 20)

			labelAccessDiv.append(
				$('<div class="Streams_access_for_text"/>')
				.append($('<div class="Streams_access_for_icon"/>').append(icon))
				.append($('<div class="Streams_access_for_name"/>').append(label).append(avatar.displayName() + ' ' + actionText + ' '))
			).append(
				$('<div class="Streams_access_for_select"/>').append(clonedSelect)
			).append(
				$('<div class="Streams_access_for_remove"/>').append(newRemoveLink(criteria))
			).appendTo($('.Streams_access_user_array', element));

		} else {
			var label = state.labels[contactLabel];
			var icon = $('<img />').attr('src', 
				Q.Streams.iconUrl(state.icons[contactLabel], true)
			);
			labelAccessDiv.append(
				$('<div class="Streams_access_for_text"/>')
				.append($('<div class="Streams_access_for_icon"/>').append(icon))
				.append($('<div class="Streams_access_for_name"/>').append(label).append(' ' + actionText + ' '))
			).append(
				$('<div class="Streams_access_for_select"/>').append(clonedSelect)
			).append(
				$('<div class="Streams_access_for_remove"/>').append(newRemoveLink(criteria))
			).appendTo($('.Streams_access_label_array', element));
		}
		clonedSelect.focus();
	}

	if (!state.publisherId) {
		return;
	}
	
	function _initialize() {
		console.log('access _initialize', this)
		if(!tool) tool = this;
		var tabsTool = tool.child("Q_tabs");
		var ts = tabsTool.state;

		tabsTool.indicateCurrent = function(tab) {
			console.log('access indicateCurrent:', tab, ts.tab)
			if(!tab && ts.tab != null) {
				console.log('access indicateCurrent: if1')
				$tab = ts.tab;
				tab = $tab.data('name');
			} else {
				console.log('access indicateCurrent: if2')

				$tab = $('[data-name="'+tab+'"]', $(tabsTool.element));
			}
			
			console.log('access indicateCurrent: tab', $tab.get())

			tabsTool.$tabs.removeClass('Q_current Q_tabs_switchingTo Q_tabs_switchingFrom');
			$tab.addClass('Q_current');

			ts.tab = $tab;
			ts.tabName = tab;
			Q.handle(ts.onCurrent, tabsTool, [$tab, state.tabName]);
		}

		ts.loaderOptions = Q.extend({}, 10, Q.loadUrl.options, 10, ts.loaderOptions, {
			quiet: true,
			loadExtras: false,
			ignorePage: true,
			ignoreDialogs: true,
			slotNames: {replace: ['control', 'extra']},
			onActivate: ts.onActivate.handlers[onActivateHandler],
			loader: null,
			slotContainer: function (name, response) {
				console.log('TABS: switchTo access0', tabsTool.state.onActivate.keys.length)

				if (name === 'control') {
					console.log('tool', tool.$('.Streams_access_controls')[0])
					return tool.$('.Streams_access_controls')[0];
				}
				if (!response) return;
				console.log('TABS: switchTo access1', tabsTool.state.onActivate.keys.length)

				console.log('access: response.slots', response.slots.extra)
				var extra = response.slots.extra;
				Q.Streams.Stream.construct(extra.stream, {}, null);
				state.avatarArray = extra.avatarArray;
				state.accessArray = extra.accessArray;
				state.labels = extra.labels;
				state.icons = extra.icons;
				console.log('TABS: switchTo access2', tabsTool.state.onActivate.keys.length)

			}
		});
		
		var tabName = ts.tabName;
		element            = tool.element,
		levelForEveryone   = $('.Streams_access_levelForEveryone', element),
		fieldName          = (tabName != null ? tabName : 'read')+'Level',
		actionText         = (tabName === 'read' || tabName == null) ? 'can see' : 'can',
		tempSelect         = $('<select />');
		console.log('access element', ts.tabName, fieldName)
		tool.child('Streams_userChooser').exclude = state.avatarArray;
		Q.Streams.retainWith(tool)
		.get(tool.state.publisherId, tool.state.streamName, function (err, data) {
			var msg;
			if (msg = Q.firstErrorMessage(err, data && data.errors)) {
				alert(msg);
			}
			if (!data) return;
			state.stream = this;

			console.log('ACCESS: fieldName', fieldName, state.stream)
			var i, userId, access;

			prepareSelect(levelForEveryone, {ofUserId: ''}, state.stream.fields[fieldName], 'stream');

			for (i=0; i<state.accessArray.length; ++i) {
				access = state.accessArray[i];
				addAccessRow(access);
			}

			tool.child('Streams_userChooser').onChoose = function (userId, avatar) {
				var fields = {
					publisherId: state.stream.fields.publisherId,
					streamName: state.stream.fields.name,
					ofUserId: userId,
				};
				fields[fieldName] = levelForEveryone.val();

				Q.req('Streams/access', ['data'], function (err, response) {
					var msg;
					if (msg = Q.firstErrorMessage(err, response && response.errors)) {
						alert(msg);
					}
					addAccessRow(response.slots.data.access.fields, avatar);
				}, {
					method: 'put',
					fields: fields
				});
				
			};

			$('.Streams_access_levelAddLabel', element).change(function () {
				var fields = {
					publisherId: state.stream.fields.publisherId,
					streamName: state.stream.fields.name,
					ofContactLabel: $(this).val(),
					'Q.method': 'put'
				};
				fields[fieldName] = levelForEveryone.val();

				Q.req('Streams/access', ['data'], function (err, response) {
					var msg;
					if (msg = Q.firstErrorMessage(err, response && response.errors)) {
						alert(msg);
					}
					addAccessRow(response.slots.data.access.fields);
					state.stream.refresh();
				}, {
					method: 'put',
					fields: fields
				});
			});
		});
	}

	this.Q.onInit.set(function () {
		console.log('ACCES: ON INIT')
		_initialize();
		onActivateHandler = this.child('Q_tabs').state.onActivate.set(_initialize, this);
	}, this);
}, {
	beforeRemove: function () {
		console.log("ACCCESS: BEFORE REMOVE")
		try {
			var err = (new Error);
			console.log(err.stack);
		} catch (e) {

		}
	}
});
})(Q, jQuery);
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
	if (!options.tab) {
		options.tab = 'read';
	}
	var tool = this, state = this.state,
		element, levelForEveryone, fieldName,
		actionText, tempSelect;

	function prepareSelect($select, criteria, value, action) {
		if (!state.stream) return;
		if (!action) {
			action = 'access';
		}

		if (typeof value !== 'undefined') {
			$select.find('option').removeAttr('selected');
			$select.attr(
				'selectedIndex',
				$select.find('option[value='+value+']').attr('selected', 'selected').index()
			);
			$select.attr('name', 'cloned');

			$select.change(function () {
				var fields = {
					publisherId: state.stream.fields.publisherId,
					streamName: state.stream.fields.name,
					'Q.method': 'put'
				};
				fields[fieldName] = $(this).val();
				Q.extend(fields, criteria);
				Q.req(fields, "Streams/access", ['data'], function (err, data) {
					var msg;
					if (msg = Q.firstErrorMessage(err, data && data.errors)) {
						alert(msg);
					}
					state.stream.refresh();
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
				'Q.method': 'put'
			};
			fields[fieldName] = -1;
			Q.extend(fields, criteria);
			Q.req(fields, "Streams/access", ['data'], function (err, data) {
				var msg;
				if (msg = Q.firstErrorMessage(err, data && data.errors)) {
					alert(msg);
				}
				$this.closest('tr').remove();
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
			});
			return false;
		}).html('x');

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
		var tr = $('<tr />');
		if (userId !== "") {
			tr.append(
				$('<td style="vertical-align: middle;" />').append(
					$('<img />').attr('src', avatar.iconUrl(true)).css('width', 20)
				)
			).append(
				$('<td style="vertical-align: middle;" />')
				.append(
					$('<span class="access-tool-username">')
					.text(avatar.displayName() + ' ' + actionText + ' ')
				).append(clonedSelect).append($('<div class="clear">'))
			).append(
				$('<td style="vertical-align: middle;" />').append(newRemoveLink(criteria))
			).appendTo($('.Streams_access_user_array', element));
		} else {
			var label = state.labels[contactLabel];
			var icon = $('<img />').attr('src', 
				Q.Streams.iconUrl(state.icons[contactLabel], true)
			);
			tr.append(
				$('<td style="vertical-align: middle;" />')
				.text(label).prepend(icon).append(' ' + actionText + ' ')
				.append(clonedSelect)
			).append(
				$('<td style="vertical-align: middle;" />').append(newRemoveLink(criteria))
			).appendTo($('.Streams_access_label_array', element));
		}
		clonedSelect.focus();
	}

	if (!state.publisherId) {
		return;
	}
	
	function _initialize() {
		
		var ts = tool.child("Q_tabs").state;
		ts.loaderOptions = Q.extend({}, 10, Q.loadUrl.options, 10, ts.loaderOptions, {
			quiet: true,
			loadExtras: false,
			ignorePage: true,
			slotNames: {replace: ['controls', 'extra']},
			slotContainer: function (name, response) {
				if (name === 'controls') {
					return tool.$('.Streams_access_controls')[0];
				}
				if (!response) return;
				var extra = response.slots.extra;
				Q.Streams.Stream.construct(extra.stream, {}, null);
				state.avatarArray = extra.avatarArray;
				state.accessArray = extra.accessArray;
				state.labels = extra.labels;
				state.icons = extra.icons;
			}
		});
		
		var tabName = ts.tabName;
		element            = tool.element,
		levelForEveryone   = $('.Streams_access_levelForEveryone', element),
		fieldName          = tabName+'Level',
		actionText         = (tabName === 'read') ? 'can see' : 'can',
		tempSelect         = $('<select />');
		tool.child('Streams_userChooser').exclude = state.avatarArray;
		Q.Streams.retainWith(tool)
		.get(tool.state.publisherId, tool.state.streamName, function (err, data) {
			var msg;
			if (msg = Q.firstErrorMessage(err, data && data.errors)) {
				alert(msg);
			}
			if (!data) return;
			state.stream = this;

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
					'Q.method': 'put'
				};
				fields[fieldName] = levelForEveryone.val();
				Q.req(fields, "Streams/access", ['data'], function (err, data) {
					var msg;
					if (msg = Q.firstErrorMessage(err, data && data.errors)) {
						alert(msg);
					}
					addAccessRow(data.slots.data.access, avatar);
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
				Q.req(fields, "Streams/access", ['data'], function (err, data) {
					var msg;
					if (msg = Q.firstErrorMessage(err, data && data.errors)) {
						alert(msg);
					}
					addAccessRow(data.slots.data.access);
					state.stream.refresh();
				});
			});
		});
	}

	this.Q.onInit.set(function () {
		_initialize();
		this.child('Q_tabs').state.onActivate.set(_initialize, this);
	}, this);
});
})(Q, jQuery);
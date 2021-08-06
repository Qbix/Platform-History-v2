(function (window, Q, $, undefined) {

var Users = Q.Users;
var Streams = Q.Streams;
var Interests = Streams.Interests;

/**
 * Streams Tools
 * @module Streams-tools
 */

/**
 * Tool for user to manage their interests in a community
 * @class Streams interests
 * @constructor
 * @param {Object} [options] This is an object of parameters for this function
 *  @param {String} [options.communityId=Q.Users.communityId] The id of the user representing the community publishing the interests
 *  @param {String} [options.userId=Users.loggedInUserId()] The id of the user whose interests are to be displayed, defaults to the logged-in user
 *  @param {Boolean} [options.skipSelect=false] If true skip mark interests as selected
 *  @param {Array} [options.ordering=[]] To override what interest categories to show and in what order
 *  @param {String|null} [options.filter] You can override the placeholder text to show in the filter, or set this to null to hide the filter
 *  @param {String} [options.trySynonyms] You can override the "try synonyms" text using this option
 *  @param {Boolean|String} [options.canAdd=false] Pass true here to allow the user to add a new interest, or a string to override the title of the command.
 *  @param {String|Object} [options.all] To show "all interests" option, pass here its title or object with "title" and "icon" properties.
 *  @param {Object} [options.expandable={}] Any options to pass to the expandable tools
 *  @param {String} [options.cacheBust=1000*60*60*24] How often to reload the list of major community interests
 *  @param {Q.Event} [options.onReady] occurs when the tool interface is ready
 *  @param {Q.Event} [options.onClick] occurs when the user clicks or taps an interest. Is passed (element, normalizedTitle, category, interest, wasSelected). Handlers may return false to cancel the default behavior of toggling the interest. If the "All Interests" option was clicked, '*' is passed as the second parameter.
 */
Q.Tool.define("Streams/interests", function (options) {
	var tool = this;
	Q.Text.get('Streams/content', function (err, text) {
		var state = tool.state;
		tool.text = text;
		if (state.canAdd === true) {
			state.canAdd = text.interests.CanAdd;
		}
	
		var pipe = new Q.Pipe();
		var lastVal, lastImage;
		var revealingNewInterest = false;
		var $te = $(tool.element);
		var anotherUser = state.userId;
		if (anotherUser) {
			$te.addClass('Streams_interests_anotherUser');
		}
	
		var all = state.all;
		if (typeof all === 'string') {
			all = {
				title: all,
				icon: Q.url("{{Streams}}/img/icons/interests/categories/white/all.png")
			};
		}
	
		if (!$te.children().length) {
			Q.Template.render('Streams/interests', {
				filter: (state.filter !== null),
				placeholder: state.filter || text.interests.Filter || '',
				all: all
			}, function (err, html) {
				$te.html(html);
			});
		}
	
		tool.container = $(tool.element).find('.Streams_interests_container');
		state.communityId = state.communityId || Q.Users.communityId;
	
		function addExpandable(category, interests) {
			var info = Q.getObject([state.communityId, category], Streams.Interests.info);
			var content = '';
			var count = 0;
			Q.each(interests, function (subcategory, interests) {
				var h3 = subcategory
					? "<h3 class='Streams_interests_subcategory'>"+subcategory+"</h3>"
					: '';
				content += h3 + _listInterests(category, interests);
				count += Object.keys(interests).length;
			});
			var title = "<span class='Streams_interests_category_title'>"+category+"</span>";
			if (info.white) {
				title = "<img src='"+Q.url(info.white)+"'>" + title;
			}
			var expandableOptions = Q.extend({
				title: title,
				content: content,
	            count: '',
				category: category
			}, state.expandable);
			var nc = Q.normalize(category);
			var $expandable = $(Q.Tool.setUpElement(
				'div', 'Q/expandable', expandableOptions, 
				'Q_expandable_' + nc,
				tool.prefix
			));
			if (info.drilldown) {
				$expandable.attr({
					'drilldown': info.drilldown,
					'category': nc
				}).addClass('Streams_interests_drilldown Q_expandable_'+nc);
			}
			$expandable.appendTo(tool.container).activate(pipe.fill(category));
		}

		Streams.Interests.load(state.communityId, function () {
			var categories = Object.keys(Interests.all[state.communityId]) || [];
			state.ordering = state.ordering || Q.getObject(['Interests', 'ordering', state.communityId], Streams) || categories;

			Q.each(state.ordering, function (i, category) {
				if (categories.indexOf(category) < 0) {
					return;
				}

				addExpandable(
					category, 
					Interests.all[state.communityId][category], 
					{ascending: true}
				);
			});
			var waitFor = Q.copy(state.ordering);
			if (!state.skipSelect) {
				waitFor.concat(anotherUser ? ['my', 'anotherUser'] : ['my']);
			}
			pipe.add(waitFor, 1, function (params, subjects) {
				tool.$('.Streams_interest_title').removeClass('Q_selected');
				var $jq;
				var otherInterests = {};
				var normalized, expandable;
				var myInterests = Q.getObject(["my", 0], params) || [];
				var interests = anotherUser ? params.anotherUser[0] : myInterests;
				for (normalized in interests) {
					$jq = tool.$('#Streams_interest_title_' + normalized)
					.addClass('Streams_interests_anotherUser');
					if ($jq.length) {
						if (normalized in myInterests) {
							$jq.addClass('Q_selected');
							expandable = $jq.closest('.Q_expandable_tool')[0].Q('Q/expandable');
							if (expandable && expandable.state) {
								expandable.state.count++;
								expandable.stateChanged(['count']);
							}
						}
					} else {
						otherInterests[normalized] = interests[normalized];
					}
				}
				if (!Q.isEmpty(otherInterests)) {
					for (normalized in otherInterests ) {
						var interestTitle = otherInterests[normalized];
						var parts = interestTitle.split(': ');
						var category = parts[0];
						var title = parts[1];
						var $expandable = tool.$('#' + tool.prefix + 'Q_expandable_'+Q.normalize(category) + '_tool');
						var $content = $expandable.find('.Q_expandable_content');
						if (!$expandable.length) {
							continue;
						}
						var $other = $expandable.find('.Streams_interests_other');
						if (!$other.length) {
							var otherText = text.interests.Other;
							$other = $('<h3 class="Streams_interests_other"></h3>')
								.html(otherText)
								.appendTo($content);
						}
						var id = 'Streams_interest_title_' + normalized;
						var $span = $('<span />', {
							'id': id,
							'data-interest': title,
							'data-category': category,
							'class': 'Streams_interest_title'
						}).text(title)
						if (anotherUser) {
							$span.addClass('Streams_interests_anotherUser');
						}
						var $span2 = $('<span class="Streams_interest_sep">, </span>');
						$content.append($span, $span2);
						if (normalized in myInterests) {
							$span.addClass('Q_selected');
							expandable = $expandable[0].Q('Q/expandable');
							expandable.state.count++;
							expandable.stateChanged(['count']);
						}
						Q.setObject([title, id], true, allInterests);
					}
					tool.$('.Q_expandable_content .Streams_interests_other').each(function () {
						$(this).nextAll('.Streams_interest_sep').last().remove(); // the last separator	
					});
				}
				if (anotherUser) {
					$te.find('.Q_expandable_tool.Q_tool').each(function () {
						var $this = $(this);
						if (!$this.find('.Streams_interests_anotherUser').length) {
							$(this).addClass('Streams_interests_anotherUserNone');
						}
					});
					$te.find('h3').each(function () {
						var $this = $(this);
						if (!$this.nextUntil('h3')
						.filter('.Streams_interests_anotherUser').length) {
							$(this).addClass('Streams_interests_anotherUserNone');
						}
					});
					tool.$('.Streams_interest_sep').html(' ');
				}
				state.interests = interests;
				state.otherInterests = otherInterests;
				Q.handle(state.onReady, tool);
			});
		
			var trySynonyms = state.trySynonyms || text.interests.trySynonyms;
			var $unlistedTitle;
			var $unlisted1 = $("<div />").html(trySynonyms);
			var $unlisted = $('<div />').addClass("Streams_interests_unlisted")
			.append($unlisted1)
			.appendTo(tool.container)
			.hide();
			if (state.canAdd) {
				$unlistedTitle = $('<span id="Streams_new_interest_title" />')
				.addClass('Streams_new_interest_title');
				var $select = $('<select class="Streams_new_interest_categories" />')
				.on('change', function () {
					if (!Users.loggedInUser) {
						return;
					}
					$select.addClass('Q_loading');
					var $this = $(this);
					var category = $this.val();
					var interestTitle = category + ': ' + $unlistedTitle.text();
					var normalized = Q.normalize(interestTitle);
					Interests.my[normalized] = interestTitle;
					Interests.add(interestTitle,
					function (err, data) {
						var msg = Q.firstErrorMessage(
							err, data && data.errors
						);
						if (msg) {
							return alert(msg);
						}
						revealingNewInterest = true;
						// WARN: This is a roundabout way of doing it, but
						// we remove this tool and activate another one with the same ID.
						// We should probably design a refresh method instead.
						var parentElement = tool.element.parentNode;
						var toolId = tool.id;
						Q.Tool.remove(tool.element, true, true);
						$(Q.Tool.setUpElement('div', 'Streams/interests', toolId))
						.appendTo(parentElement)
						.activate(state, function () {
							var id = 'Q_expandable_' + Q.normalize(category);
							this.child(id).expand({
								scrollToElement: tool.$('.Streams_interests_other')[0]
							}, function () {
								revealingNewInterest = false;
							});
							$select.removeClass('Q_loading');
						});
					}, {
						subscribe: true,
						quiet: false
					});
				});
				var $unlisted2 = $("<div class='Streams_interest_unlisted2' />")
				.text(state.canAdd);
				var Unlisted = tool.text.interests.Unlisted;
				$unlisted.append(
					$unlisted2, 
					$('<div />').append($unlistedTitle.attr('data-category', Unlisted)),
					$select
				);
			}
		
			$(tool.container)
			.on(Q.Pointer.fastclick, 'span.Streams_interest_title', function () {
				// TODO: ignore spurious clicks that might happen
				// when something is expanding
				var $this = $(this);
				var tool = null;
				var $jq = $this.closest('.Q_expandable_tool');
				if ($jq.length) {
					tool = $jq[0].Q('Q/expandable');
				}
				var title = $this.attr('data-category') + ': ' + $this.text();
				var normalized = Q.normalize(title);
				var change;
				var wasSelected = $this.hasClass('Q_selected');
				var category = title.split(':')[0].trim();
				var title2 = title.split(':')[1].trim();
				if (false === Q.handle(state.onClick, tool, 
						[this, normalized, category, title2, wasSelected]
				) || !Users.loggedInUserId()) {
					return;
				};
				if (wasSelected) {
					change = -1;
					$this.removeClass('Q_selected');
					delete Interests.my[normalized];
					Interests.remove(title, function (err, data) {
						var msg = Q.firstErrorMessage(
							err, data && data.errors
						);
						if (msg) {
							$this.addClass('Q_selected');
						}
					});
				} else {
					change = 1;
					$this.addClass('Q_selected');
					Interests.my[normalized] = title;
					Interests.add(title, function (err, data) {
						var msg = Q.firstErrorMessage(
							err, data && data.errors
						);
						if (msg) {
							$this.removeClass('Q_selected');
						}
					}, {subscribe: true});
				}
				if (tool) {
					tool.state.count = (tool.state.count || 0) + change;
					if (tool.state.count == 0) {
						tool.state.count = '';
					}
					tool.stateChanged(['count']);
				}
			});
		
			$('.Streams_interests_all', tool.element)
			.on(Q.Pointer.fastclick, function () {
				var title = all.title;
				Q.handle(state.onClick, tool, [this, '*', 'all', all.title, false]);
			});
		
			var possibleEvents = 'keyup.Streams'
				+ ' blur.Streams'
				+ ' update.Streams'
				+ ' paste.Streams'
				+ ' filter'
				+ ' Q_refresh';
			tool.$('.Streams_interests_filter_input')
			.plugin('Q/placeholders')
			.on(possibleEvents, Q.debounce(function (evt) {
				var $this = $(this);
				if (evt.keyCode === 27) {
					$this.val('');
				}
				var val = $this.val().toLowerCase();
				var len = val.length;
				var existing = {};
				var image = val ? 'clear' : 'filter';
				if (image != lastImage) {
					var src = Q.url('{{Q}}/img/white/'+image+'.png');
					$this.css({
						'background-image': 'url('+src+')',
						'background-position': '100% 50%',
						'background-repeat': 'no-repeat'
					});
					lastImage = image;
				}
				if (val) {
					var showElements = [];
					tool.$('.Streams_interest_sep').html(' ');
					Q.each(allInterests, function (interest, ids) {
						for (var id in ids) {
							var $span = tool.$('#'+id);
							if (!$span.length) continue;
							var matched = false;
							var parts1 = val.split(' ');
							var parts2 = interest.split(' ');
							var pl1 = parts1.length;
							var pl2 = parts2.length;
							for (var i1=0; i1<pl1; ++i1) {
								matched = false;
								for (var i2=0; i2<pl2; ++i2) {
									var p1 = parts1[i1];
									var p2 = parts2[i2].substr(0, p1.length).toLowerCase();
									if (p1 === p2) {
										matched = true;
										break;
									}
								}
								if (matched === false) {
									break;
								}
							}
							if (matched) {
								$span.show();
								var $expandable = $span.closest('.Q_expandable_tool');
								var $h3 = $span.prevAll('h3');
								showElements.push($expandable[0]);
								showElements.push($h3[0]);
								!$expandable.is(":visible") && $expandable.show();
								!$h3.is("visible") && $h3.show();
								$expandable[0].Q("Q/expandable").expand({
									autoCollapseSiblings: false,
									scrollContainer: false
								});
								existing[$span.data('category')] = interest;
							} else {
								$span.hide();
							}
						}
					});
					tool.$('.Q_expandable_tool')
					.add(tool.$('.Q_expandable_tool h3'))
					.each(function () {
						if (showElements.indexOf(this) < 0) {
							$(this).is(":visible") && $(this).hide();
						}
					});
				
					var count = 0;
					if ($select) {
						$select.empty();
						Q.each(Interests.all[state.communityId], function (category) {
							if (existing[category]
							&& Q.normalize(existing[category]) === Q.normalize(val)) {
								return;
							}
							$('<option />', { value: category })
							.html(category)
							.appendTo($select);
							++count;
						});
					}
					if (count) {
						$unlistedTitle.text(val.toCapitalized());
						$('<option value="" selected="selected" disabled="disabled" />')
							.html(tool.text.AddUnderCategory)
							.prependTo($select);
						$unlisted.show();
					} else {
						$unlisted.hide();
					}
				} else if (lastVal) {
					if (!revealingNewInterest) {
						tool.$('.Q_expandable_tool.Q_tool').show().each(function () {
							this.Q("Q/expandable").collapse();
						});
					}
					tool.$('.Q_expandable_tool h3').show();
					tool.$('.Streams_interest_sep').html(', ');
					tool.$('.Q_expandable_content span').show();
					$unlisted.hide();
				}
		
				lastVal = val;
			}, 100))
			.on(Q.Pointer.fastclick, function (evt) {
				var $this = $(this);
				var xMax = $this.offset().left + $this.outerWidth(true) -
					parseInt($this.css('margin-right'));
				var xMin = xMax - parseInt($this.css('padding-right'));
				var x = Q.Pointer.getX(evt);
				if (xMin < x && x < xMax) {
					$this.val('').trigger('Q_refresh');
				}
			});

			if (Users.loggedInUser) {
				Interests.forMe(state.communityId, function (err, interests) {
					if (err) {
						return alert(Q.firstErrorMessage(err));
					}
					pipe.fill('my')(interests);
				});
			} else {
				pipe.fill('my')({});
			}

			if (anotherUser) {
				Interests.forUser(state.userId, state.communityId, function (err, interests) {
					if (err) {
						return alert(Q.firstErrorMessage(err));
					}
					pipe.fill('anotherUser')(interests);
				});
			}
		});

	});
},

{
	communityId: null,
	expandable: {},
	skipSelect: false,
	cacheBust: 1000*60*60*24,
	ordering: null,
	all: false,
	canAdd: false,
	filter: undefined,
	trySynonyms: null,
	onReady: new Q.Event(),
	onClick: new Q.Event()
}

);

var allInterests = {};

function _listInterests(category, interests) {
	var lines = [];
	for (var interest in interests) {
		var normalized = Q.normalize(category + ": " + interest);
		var id = 'Streams_interest_title_' + normalized;
		lines.push(
			$('<span class="Streams_interest_title" />').attr({
				"id": id,
				"data-category": category,
				"data-interest": interest
			}).append(interest)[0].outerHTML
		);
		Q.setObject([interest, id], true, allInterests);
	}
	return lines.join('<span class="Streams_interest_sep">, </span>');
}

Q.Template.set('Streams/interests', 
  '{{#if filter}}'
+ '<div class="Streams_interests_filter">'
	+ '<input class="Streams_interests_filter_input" placeholder="{{placeholder}}">'
+ '</div>'
+ '{{/if}}'
+ '{{#if all}}'
+ '<div class="Streams_interests_all Q_expandable_tool">'
+   '<h2>'
+     '<img class="Streams_interests_icon" src="{{all.icon}}" alt="all">'
+ 	  '<span class="Streams_interests_category_title">{{all.title}}</span>'
+	'</h2>'
+ '</div>'
+ '{{/if}}'
+ '<div class="Streams_interests_container"></div>'
);

})(window, Q, jQuery);
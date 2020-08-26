/**
 * Provides a set of tools mostly related to client side of the application.
 * This includes tools for application layout management depending on different conditions, some convenient UI
 * elements for interaction and navigation and other.
 * @module Q
 * @submodule Tools
 */
(function (Q, $) {

Q.onReady.set(function()
{		
	// we really need to remove column=<id> from hash on fresh load
	if (location.hash.indexOf('column') !== -1)
	{
		location.hash = location.hash.replace(/(&|#)column=[^&]+/, '');
		if (location.hash.charAt(1) === '&') location.hash = location.hash.substr(2);
	}
}, 'QTools');

Q.onActivate.set(function()
{
	// Q.Layout.updateTools(false);
}, 'QTools');

/**
 * Class (or namespace, more correct) for setting repeatedly called callbacks, which usually set by setInterval().
 * Using this class has several benefits:
 * you may assign memorable key to an interval instead of just integer id and later manage it using this key,
 * you can pause and resume individual interval or all the intervals,
 * you can access intervals collection to inspect it, particularly you may find which are currently running and which are not.
 * @class Q.Interval
 */
Q.Interval = {

	/**
	 * An object for saving all the intervals. You may inspect it to find all the information about an interval.
     * @property
     * @type {Object}
     * @default {}
	 */
	collection: {},

	/**
	 * Sets an interval.
	 * Syntax is very same to original setInterval()
     * @method set
	 * @param {Function} callback
	 *   Required. Callback to provide to setInterval() which will be called every milliseconds equal to 'interval' parameter.
	 * @param {Number} interval
	 *   Required. A number of milliseconds after which next call of function provided by 'callback' parameter will occur.
	 * @param {String} key
	 *   Optional. A string key for later identifying this interval. May be omitted and then default key with incremented
	 *   number will be generated.
	 * @return {Number}
	 *   An id of newly created interval which setInterval() returns.
	 */
	set: function(callback, interval, key)
	{
		if (typeof(callback) !== 'function')
		{
			throw new Q.Error("Q.Interval.set: 'callback' must be a function");
		}
		if (typeof(interval) !== 'number' || interval < 0)
		{
			throw new Q.Error("Q.Interval.set: 'interval' must be a positive number");
		}
		if (key === undefined)
		{
			if (!Q.Interval.increment)
				Q.Interval.increment = 0;
			key = 'interval_' + (Q.Interval.increment - 1);
			Q.Interval.increment++;
		}
		else if (key in Q.Interval.collection)
		{
			return Q.Interval.collection[key].id;
		}
		var id = setInterval(callback, interval);
		Q.Interval.collection[key] = { 'id': id, 'callback': callback, 'interval': interval, 'running': true };
		return id;
	},

	/**
	 * Checks if an interval with given key is already in the collection.
     * @method exists
	 * @param {Number} key
	 *   Required. Key of the interval
	 * @return {Boolean} . True if an interval exists, false otherwise.
	 */
	exists: function(key)
	{
		return (key in Q.Interval.collection);
	},

	/**
	 * Pauses and interval.
     * @method pause
	 * @param {String|Number} keyOrId
	 *   A key or id of the interval to pause. Please note that id changes every time interval is resumed,
	 *   that's why resume() returns new id. And actually using the key is better practice because of that.
	 */
	pause: function(keyOrId)
	{
		var col = Q.Interval.collection;
		if (typeof(keyOrId) === 'string')
		{
			if (keyOrId in col)
			{
				clearInterval(col[keyOrId].id);
				col[keyOrId].running = false;
			}
			else
			{
				throw new Q.Error("Q.Interval.set: Interval with key '" + keyOrId + "' doesn't exist");
			}
		}
		else
		{
			for (var i in col)
			{
				if (keyOrId === col[i].id)
				{
					clearInterval(col[i].id);
					col[keyOrId].running = false;
					return;
				}
			}
			throw new Q.Error("Q.Interval.set: Interval with id " + keyOrId + " doesn't exist");
		}
	},

	/**
	 * Resumes the paused interval.
     * @method resume
	 * @param {String|Number} keyOrId
	 *   A key or id of the interval to resume. Please note that id changes every time interval is resumed,
	 *   that's why resume() returns new id. And actually using the key is better practice because of that.
	 *   Also note that it's safe to call resume() on the interval which is not
	 *   paused - resume() simpy doesn't do anything in this case.
	 * @return {Number} id
	 *   A new id the resumed interval.
	 */
	resume: function(keyOrId)
	{
		var col = Q.Interval.collection, interval;
		if (typeof(keyOrId) === 'string')
		{
			if (keyOrId in col)
			{
				interval = col[keyOrId];
				if (!interval.running)
				{
					interval.id = setInterval(interval.callback, interval.interval);
					interval.running = true;
					return interval.id;
				}
			}
			else
			{
				throw new Q.Error("Q.Interval.set: Interval with key '" + keyOrId + "' doesn't exist");
			}
		}
		else
		{
			for (var i in col)
			{
				if (keyOrId === col[i].id)
				{
					interval = col[keyOrId];
					if (!interval.running)
					{
						interval.id = setInterval(interval.callback, interval.interval);
						interval.running = true;
					}
					return interval.id;
				}
			}
			throw new Q.Error("Q.Interval.set: Interval with id " + keyOrId + " doesn't exist");
		}
	},

	/**
	 * Clears the interval.
     * @method clear
	 * @param {String|Number} keyOrId
	 *   A key or id of the interval to clear.
	 */
	clear: function(keyOrId)
	{
		var col = Q.Interval.collection;
		if (typeof(keyOrId) === 'string')
		{
			if (keyOrId in col)
			{
				clearInterval(col[keyOrId].id);
				delete col[keyOrId];
			}
			else
			{
				throw new Q.Error("Q.Interval.set: Interval with key '" + keyOrId + "' doesn't exist");
			}
		}
		else
		{
			for (var i in col)
			{
				if (keyOrId === col[i].id)
				{
					clearInterval(col[i].id);
					delete col[i];
					break;
				}
			}
			throw new Q.Error("Q.Interval.set: Interval with id " + keyOrId + " doesn't exist");
		}
	},

	/**
	 * Pauses all the intervals.
     * @method pauseAll
	 */
	pauseAll: function()
	{
		var col = Q.Interval.collection;
		for (var i in col)
		{
			clearInterval(col[i].id);
			col[i].running = false;
		}
	},

	/**
	 * Resumes all the intervals.
     * @method resumeAll
	 */
	resumeAll: function()
	{
		var col = Q.Interval.collection;
		for (var i in col)
		{
			var interval = col[i];
			if (!interval.running)
			{
				interval.id = setInterval(interval.callback, interval.interval);
				interval.running = true;
			}
		}
	},

	/**
	 * Clears all the intervals.
     * @method clearAll
	 */
	clearAll: function()
	{
		var col = Q.Interval.collection;
		for (var i in col)
		{
			clearInterval(col[i].id);
		}
		Q.Interval.collection = {};
	}

};

/**
 * Class which contains various functions to manage layout of the application.
 * The application is supposed to look and work fine on the various platforms and screen resolutions,
 * mainly it's 'desktop', 'tablet' and 'mobile' but it also varies to specific platforms like 'android' for example.
 * Standard application consists of 'dashboard', 'notices', 'listing', 'column(0|1|2)' and maybe some other slots and this
 * class is intended to make these blocks look and function similarly on different platforms and devices.
 * @class Layout
 * @namespace Q
 * @static
 */
Q.Layout = {
	/**
	 * Main property which must be set to true if you want to use Q.Layout manager in your application.
	 * This must be set before Q.Layout.init() is called.
	 * @property use
	 * @type Boolean
	 * @default false
	 */
	use: false,
	
	/**
	 * A property to set by other components if layout needs to be updated again when 'window.load' event fired.
	 * Useful when some components inited after first orientationChange() calls already passed.
	 * @property needUpdateOnLoad
	 * @type Boolean
	 * @default false
	 */
	needUpdateOnLoad: false,
	
	/**
	 * Property which is dynamically calculated after address bar is hidden (for mobile) or just after page load is finished (for all other platforms).
	 * Makes sense mostly on mobile platforms.
	 * @property fullScreenHeight
	 * @type Number
	 * @readOnly
	 */
	fullScreenHeight: 0,
	
	/**
	 * Property which is dynamically calculated when browser address bar is visible. Makes sense only on mobile platforms.
	 * @property heightWithAddressBar
	 * @type Number
	 * @readOnly
	 */
	heightWithAddressBar: 0,
	
	/**
	 * Property which is dynamically calculated and contains supposed height of address bar. Makes sense only on mobile platforms.
	 * @property addressBarHeight
	 * @type Number
	 * @readOnly
	 */
	addressBarHeight: 0,
	
	/**
	 * Property which is dynamically calculated and contains supposed height of the app viewport with on-screen-keyboard visible.
	 * Makes sense only on mobile platforms.
	 * @property heightWithKeyboard
	 * @type Number
	 * @readOnly
	 */
	heightWithKeyboard: 0,
	
  /**
   * Property to represent if keyboard is presumably currently visible on screen. Makes sense only on mobile platforms.
   * @property keyboardVisible
   * @type Boolean
   * @readOnly
   */
	keyboardVisible: false,
	
  /**
   * Property to set to true when address bar appearing needs to be handled. Makes sense only on mobile platforms.
   * @property handleAddressBarAppearing
   * @type Boolean
   * @default false
   */
	handleAddressBarAppearing: false,
	
	/**
	 * Property which dynamically calculated and set to true when address bar is visible on screen. Makes sense only on mobile platforms.
	 * @property addressBarVisible
	 * @type Boolean
	 * @readOnly
	 */
	addressBarVisible: false,
	
	/**
	 * Property to be set to developer-defined 'listing' slot handler. It's called when some item in 'listing' slot is selected by user.
	 * @property listingHandler
	 * @type Q.Event
	 */
	listingHandler: new Q.Event(),
	
	/**
	 * If the browser is Internet Explorer version 8 or less this property will be set to true.
	 * @property isIE8orLess
	 * @type Boolean
	 * @default false
	 */
	isIE8orLess: false,
	
	/**
	 * Property which indicates whether Q.Layout is initialized (init() processed).
	 * @property inited
	 * @type Boolean
	 * @default false
	 */
	inited: false,
	
	/**
	 * Property which holds current device orientation (for touchscreen devices).
	 * Maybe either 'portrait' or 'landscape'. For desktop it's always 'landscape'.
	 * @property orientation
	 * @type String
	 * @default 'landscape'
	 */
	orientation: 'landscape',
	
	/**
	 * Similar to 'orientation' property but keeps that orientation which was on application load.
	 * Maybe useful in some cases.
	 * @property orientationOnLoad
	 * @type String
	 */
	orientationOnLoad: null,
	
	/**
	 * Configuration property determining that layout blocks must be powered with iScroll (on iOS devices)
	 * and it will be automatically managed ('refresh', 'remove' etc). The property itself is a hash with 'blockName' as key and boolean value
	 * stating whether to apply iScroll or not.
	 * @property
	 * @type Object
	 * @default { 'column1': true, 'column2': false }
	 * @example
		Q.Layout.iScrollBlocks = { 'column0': true, 'column1': true, 'column2': true };
		Q.Layout.iScrollBlocks.column0 = false;
		Q.Layout.iScrollBlocks.column1 = false;
		Q.Layout.iScrollBlocks.column2 = true;
	 */
	iScrollBlocks: { 'column0': true, 'column1': true, 'column2': true },
	
	/**
	 * Configuration property determining that layout blocks to which 'Q/scrollbarsAutoHide' plugin applied will have preserved
	 * padding. This means that initial column contents padding on the right or bottom (depending on scrolling direction)
	 * will be added to scrollbar width. The property itself is a hash with 'blockName' as key and boolean value
	 * stating whether to preserve padding or not. Setting 'false' to particular 'blockName' will result in that scrollbar width
	 * will be subtracted from initial padding. This property makes sense only on 'desktop' platform, because only there 'Q/scrollbarsAutoHide' is applied.
	 * @property
	 * @type Object
	 * @default { 'column1': true, 'column2': true }
	 * @example
		Q.Layout.scrollbarsPadding = { 'column1': true, 'column2': true };
		Q.Layout.scrollbarsPadding.column1 = false;
		Q.Layout.scrollbarsPadding.column2 = true;
	 */
	scrollbarsPadding: { 'column1': true, 'column2': true },
	
	// === below are private properties only ===
	
	/**
	 * Just for storing timeout id of setTimeout in which fade-in of orientation-changed layout will appear.
	 * This is needed to clearTimeout() if another orientationChange() called before previous fully executed.
	 * @property orientationFadeTimeout
	 * @type Number
	 * @private
	 */
	orientationFadeTimeout: 0,
	
	/**
	 * Property to represent if focus event occured on some focusable element, like text fields, text area, etc.
	 * @property focusEventOccured
	 * @type Boolean
	 * @private
	 */
	focusEventOccured: false,
	
	/**
	 * Property for setting document body height much larger then needed.
	 * It's done to fix 'touchmove-sometimes-overshoot' problem on android.
	 * Basically it should be considered constant, however you still can change it if you really need.
	 * @property androidBodyHeight
	 * @type Number
	 * @final
	 * @private
	 */
	androidBodyHeight: 10000,
	
	/**
	 * Property to store top offset of columns on android.
	 * It's also done to fix 'touchmove-sometimes-overshoot' problem on android.
	 * @property androidInitialOffset
	 * @type Number
	 * @private
	 * @default -1
	 */
	androidInitialOffset: -1,
	
	/**
	 * Internal property to store current columns state on android - fixed or not.
	 * @property androidFixed
	 * @type Boolean
	 * @private
	 */
	androidFixed: false,
	
	/**
	 * Internal property - array of integers for saving scroll positions of different columns.
	 * @property savedScrollPos
	 * @type Array
	 * @private
	 */
	savedScrollPos: [0, 0, 10000],
	
	/**
	 * Property to store current column scroll position.
	 * @property curScrollPos
	 * @type Number
	 * @private
	 */
	curScrollPos: 0,
		
	/**
	 * Property to store event handler(s) called when init() is finished.
	 * @property onInitEvent
	 * @type Q.Event
	 * @private
	 */
	onInitEvent: new Q.Event(),
	
	/**
	 * Property to store event handler(s) called before reset() begins.
	 * @property beforeResetEvent
	 * @type Q.Event
	 * @private
	 */
	beforeResetEvent: new Q.Event(),
	
	/**
	 * Property to store event handler(s) called when reset() is finished.
	 * @property onResetEvent
	 * @type Q.Event
	 * @private
	 */
	onResetEvent: new Q.Event(),
	
	/**
	 * Property to store event handler called when orientationChange() is processed.
	 * @property onOrientationChangeEvent
	 * @type Q.Event
	 * @private
	 */
	onOrientationChangeEvent: new Q.Event(),
	
	/**
	 * Internal property to temporary set to true when 'hashchange' event occured (reset to false when properly handled).
	 * @property wasHashChange
	 * @type Boolean
	 * @private
	 */
	wasHashChange: false,
	
  /**
   * Internal property to temporary turn off hashchange handling.
   * @property ignoreHashChange
   * @type Boolean
   * @private
   */
	ignoreHashChange: false,
	
	/**
	 * Internal property to store current location.hash.
	 * @property currentHash
	 * @type String
	 * @private
	 */
	currentHash: '',

	/**
	 * Initialization routine for Q.Layout.
	 * Does huge amount of job in intial configuring, binding event handlers, setting intervals etc.
	 * Performs different actions depending on the platform (desktop | tablet | mobile) and OS (ios | android).
	 * @method init
	 */
	init: function()
	{
		if (!Q.Layout.inited) {
			// some IE specific initialization
			var browser = Q.Browser.detect();
			if (browser.name === 'explorer' && parseInt(browser.mainVersion) <= 8)
			{
				Q.Layout.isIE8orLess = true;
				$('.Q_player:last').after('<div style="font-size: 1px">&nbsp;</div>');
			}
			
			var body = $(document.body);
			body.addClass('Q_' + 
				(Q.info.isMobile ? 'mobile' : (Q.info.isTablet ? 'tablet' : 'desktop'))
			);
			
			if (Q.info.platform) {
				body.addClass('Q_' + Q.info.platform);
			}
		
			Q.Layout.scrollToOffset = (Q.info.platform === 'android' ? 1 : 0);
		
			if (Q.info.isMobile)
			{
				if (Q.info.platform === 'android')
				{
					window.scrollTo(0, 0);
					setTimeout(function()
					{
						Q.Layout.heightWithAddressBar = Q.Pointer.windowHeight();
					}, 300);
				}
				else
				{
					Q.Layout.heightWithAddressBar = Q.Pointer.windowHeight();
				}
			}
			else
			{
				Q.Layout.fullScreenHeight = Q.Pointer.windowHeight();
			}

			Q.Interval.set(Q.Layout.checkOrientation, Q.Layout.options.checkOrientationInterval, 'Q.Layout.checkOrientation');
			
			if (Q.info.isTouchscreen)
			{
				if (Q.info.platform === 'ios')
				{
					$(document.body).on('touchmove', function(e)
					{
						e.preventDefault();
					});
				}
			}
			
			if (Q.info.isMobile)
			{
				if (!Q.Interval.exists('Q.Layout.hideAddressBar'))
				{
					var tries = 0;
					Q.Interval.set(function()
					{
						Q.Layout.hideAddressBar();
						if (++tries >= 4)
						{
							Q.Layout.fullScreenHeight = Q.Pointer.windowHeight();
							Q.Layout.addressBarHeight = Q.Layout.fullScreenHeight - Q.Layout.heightWithAddressBar;
							if (Q.info.platform === 'android')
							{
								Q.Layout.orientationChange(false, true, true);
							}
							Q.Interval.clear('Q.Layout.hideAddressBar');
							if (!Q.info.isAndroid())
							{
								Q.Layout.handleAddressBarAppearing = true;
							}
						}
					}, 500, 'Q.Layout.hideAddressBar');
				}
				
				if (Q.info.platform === 'android')
				{
					$(document.body).on('touchstart', function(e)
					{
						Q.Layout.processAndroidFixedBlocks(e);
					});
				}
				else
				{
					$(document.body).on('touchstart', function(e)
					{
						if (!Q.Layout.focusEventOccured && !Q.Layout.keyboardVisible && Q.Layout.addressBarVisible)
						{
							Q.Layout.hideAddressBar(true);
							Q.Masks.hide('Q.screen.mask');
							if ($('#main').height() !== Q.Pointer.windowHeight())
								Q.Layout.orientationChange(false, true);
						}
					});
				}
			}
			
			if (Q.info.isTouchscreen)
			{
				var focusableElements = $('input[type="text"], input[type="email"], input[type="tel"], input[type="number"], input[type="password"], textarea');
				focusableElements.on('focus', function(event)
				{
					Q.Layout.focusEventOccured = true;
					Q.Layout.keyboardVisible = true;
				});
				
				focusableElements.on('blur', function()
				{
					if (Q.info.platform !== 'android')
						Q.Layout.hideAddressBar();
					Q.Layout.focusEventOccured = false;
					Q.Layout.keyboardVisible = false;
				});
			}
			
			$('.Q_selected').on(Q.Pointer.start.eventName, function(event)
			{
				$(this).addClass('Q_active');
				event.preventDefault();
			});
			$('.Q_selected').on(Q.Pointer.end, function(event)
			{
				$(this).removeClass('Q_active');
			});
			
			var chatButtons = $('.Q_player_button');
			chatButtons.on(Q.Pointer.end, function()
			{
				chatButtons.removeClass('Q_selected');
				$(this).addClass('Q_selected');
				
				var $this = $(this);
				if ($this.hasClass('Q_player_button_chat'))
				{
					Q.Layout.flipColumns('column2');
				}
			});
			
			if (Q.info.isMobile)
			{
				Q.Layout.flipColumns.options = {
					'column1': {
						'onFlipBegin': new Q.Event(function()
						{
							$(':focus').blur();
							if (Q.info.platform === 'android')
							{
								Q.Layout.savedScrollPos[2] = document.body.scrollTop;
							}
						}, 'Q_flip_begin'),
						'onFlipFinish': new Q.Event(function()
						{
							if (Q.info.platform === 'android')
							{
								document.body.scrollTop = Q.Layout.savedScrollPos[1];
								Q.Layout.adjustColumnsHeight();
							}
						}, 'Q_flip_finish'),
						'onBackButtonSet': new Q.Event(function()
						{
							var appButton = $('#Q_dashboard_item_app');
							appButton.off('touchstart.Q_flip touchend.Q_flip');
						}, 'Q_back_button_set')
					},
					'column2': {
						'onFlipBegin': new Q.Event(function()
						{
							$(':focus').blur();
							var column2Slot = $('#column2_slot');
							if (column2Slot.css('visibility') === 'hidden')
							{
								column2Slot.css({
									'position': 'static',
									'visibility': 'visible',
									'display': 'none',
									'top': 'auto',
									'left': 'auto'
								});
							}
							if (Q.info.platform === 'android')
							{
								Q.Layout.savedScrollPos[1] = document.body.scrollTop;
							}
						}, 'Q_flip_begin'),
						'onFlipFinish': new Q.Event(function()
						{
							if (Q.info.platform === 'android')
							{
								document.body.scrollTop = Q.Layout.savedScrollPos[2];
								Q.Layout.adjustColumnsHeight();
								$('#column1_slot .Q_scroll_indicator, #column2_slot .Q_scroll_indicator').css({ 'left': '0' });
								var topOffset = Q.Layout.orientation == 'portrait' ? $('#dashboard_slot').outerHeight() : 0;
								$('#column2_slot .Q_scroll_indicator_top_small').css({ 'top': topOffset + 'px' });
							}
						}, 'Q_flip_finish'),
						'onBackButtonSet': new Q.Event(function()
						{
							var appButton = $('#Q_dashboard_item_app');
							appButton.on('touchstart.Q_flip', function()
							{
								return false;
							});
							appButton.on('touchend.Q_flip', function()
							{
								window.history.back();
							});
						}, 'Q_back_button_set')
					}
				};
				
				Q.Layout.flipColumns.options.column1 = Q.extend(Q.Layout.flipColumns.options.column1, {
					'onFlipBegin': new Q.Event(function()
					{
						if (Q.info.platform === 'android')
						{
							var participants = $('.Streams_participant_tool_wrapper');
							participants.css({
								'position': '',
								'z-index': '',
								'width': ''
							});
						}
					}, 'Q_flip_begin_common'),
					'onFlipFinish': new Q.Event(function()
					{
						setTimeout(function()
						{
							Q.Layout.adjustScrolling();
						}, 0);
						$('.Q_player').each(function()
						{
							var $this = $(this);
							$this.find('.Q_player_buttons li').css({ 'width': (Math.ceil($this.width() / 2) - 1) + 'px' });
						});
						Q.Contextual.updateLayout();
					}, 'Q_flip_finish_common'),
					'onBackButtonSet': new Q.Event(function()
					{
						var appButton = $('#Q_dashboard_item_app');
						var buttonLabel = appButton.children('span');
						appButton.prepend(appButton.data('Q_app_button_icon')).children('.Q_dashboard_back_icon_small').remove();
						buttonLabel.text(appButton.data('Q_app_button_text'));
					}, 'Q_back_button_set_common')
				});
				
				Q.Layout.flipColumns.options.column2 = Q.extend(Q.Layout.flipColumns.options.column2, {
					'onFlipFinish': new Q.Event(function()
					{
						setTimeout(function()
						{
							var participants = $('#Streams_participant_tool');
							if (participants.participants) participants.participants('update');
							var availableHeight = $('#column2_slot').outerHeight() - participants.outerHeight();
							var chat = $('#Streams_chat_tool');
							if (Q.info.platform === 'android')
							{
								var params = { 'type': 'native', 'scroller': document.body, 'orientation': 'v', 'topOffset': Q.Layout.scrollToOffset };
								chat.plugins('Q/scrollIndicators', 'remove')
								.plugin('Q/scrollIndicators', params);
							}
							if (chat.chatTool)
								chat.chatTool('update', availableHeight);
						}, 0);
						
						if (Q.info.platform === 'android')
						{
							var participants = $('.Streams_participant_tool_wrapper');
							var participantsWidth = Q.Pointer.windowWidth, participantsLeft = 0;
							if (Q.info.isMobile)
							{
								if (Q.Layout.orientation === 'landscape')
								{
									participantsWidth = Q.Pointer.windowWidth() * 0.75 - 2;
									participantsLeft = Q.Pointer.windowWidth() - participantsWidth;
								}
							}
							participants.css({
								'position': 'fixed',
								'z-index': '1000',
								'margin-top': '-1px',
								'left': participantsLeft + 'px',
								'width': participantsWidth + 'px'
							});
						}
						Q.Layout.adjustScrolling();
						Q.Contextual.updateLayout();
					}, 'Q_flip_finish_common'),
					'onBackButtonSet': new Q.Event(function()
					{
						var appButton = $('#Q_dashboard_item_app');
						var buttonLabel = appButton.children('span');
						appButton.data('Q_app_button_text', buttonLabel.text());
						var icon = appButton.children('img').detach();
						appButton.data('Q_app_button_icon', icon);
						appButton.prepend('<div class="Q_dashboard_back_icon_small" />');
						buttonLabel.text('Back');
					}, 'Q_back_button_set_common')
				});
				
				Q.onHashChange.set(function()
				{
					if (!Q.Layout.ignoreHashChange)
					{
						var h = location.hash;
						if (h.indexOf('column=1') !== -1
						|| (h.indexOf('column=') === -1 && Q.Layout.currentHash))
						{
							Q.Layout.wasHashChange = true;
							Q.Layout.flipColumns('column1');
						}
						if (h.indexOf('column=2') !== -1)
						{
							Q.Layout.wasHashChange = true;
							Q.Layout.flipColumns('column2');
						}
					}
					Q.Layout.currentHash = location.hash;
					setTimeout(function()
					{
						Q.Layout.wasHashChange = false;
					}, 0);
				}, 'flipColumns');
			}
		}
		
		$('.Q_dashboard_expandable ul.Q_listing').not(".Users_userMenuListing").plugin('Q/listing', { 
			handler: Q.Layout.listingHandler, 'blink': false
		});
		
		Q.Layout.handleColumns();
		
		Q.Layout.checkOrientation();
		
		if (Q.Layout.needUpdateOnLoad)
		{
			Q.Layout.orientationChange();
			Q.Layout.needUpdateOnLoad = false;
		}
		
		Q.Layout.ignoreHashChange = false;
		
		Q.Layout.inited = true;
		Q.handle(Q.Layout.onInitEvent);
	},

	/**
	 * Cleans-up some stuff left from Q.Layout initialization but only that isn't persistent across whole app.
	 * Called automatically by Q.handle() when loading page with ajax. Should be run manually with care.
	 * @method reset
	 */
	reset: function()
	{
		Q.handle(Q.Layout.beforeResetEvent);
		Q.Dashboard.destroy();
		Q.Layout.ignoreHashChange = true;
		Q.Layout.currentHash = '';
		
		$('.Q_dashboard_expandable ul.Q_listing').plugin('Q/listing', 'remove');
		
		var column0Slot = $('#column0_slot');
		var column1Slot = $('#column1_slot');
		var column2Slot = $('#column2_slot');
		if (Q.info.isTouchscreen && Q.info.platform !== 'android')
		{
			column0Slot.plugin('Q/iScroll', 'remove');
			column1Slot.plugin('Q/iScroll', 'remove');
			column2Slot.plugin('Q/iScroll', 'remove');
		}
		// hack-fast-flipping columns back to column1 if column2 currently displayed
		if (Q.info.isMobile && Q.Layout.flipColumns.current === 'column2')
		{
			column1Slot.show().attr({ 'data-side': 'front' });
			column2Slot.css({ 'display': 'block', 'visibility': 'hidden', 'top': '-10000px' }).attr({ 'data-side': 'back' });
			Q.Layout.flipColumns.current = 'column1';
		}
		
		$('.Q_hautoscroll').plugin('Q/hautoscroll', 'remove');
		
		if (Q.info.platform === 'android') {
			window.scrollTo(0, Q.Layout.scrollToOffset);
			$('#column2_slot').css({ 'position': 'absolute' });
		}
		
		Q.handle(Q.Layout.onResetEvent);
	},
	
	/**
	 * Hides address bar on mobile devices.
	 * This function doesn't have to be called manually most of the time.
	 * On mobile devices it tries to hide address bar by scrolling document to specific position
	 * thus having some more space for the app.
	 * @method hideAddressBar
	 * @param {Boolean} [doNotResize=false]. By default, document body size is set to
	 * deliberately bigger value than viewport size just to make sure that the scrolling will actually occur.
	 * In some cases this behavior needs to be cancelled.
	 */
	hideAddressBar: function(doNotResize)
	{
		if (Q.info.platform === 'android' && document.body.offsetHeight >= Q.Pointer.windowHeight())
			doNotResize = true;
		else if (doNotResize === undefined)
			doNotResize = false;
		
		if (!doNotResize)
			$(document.body).css({ 'height': '1000px' });
		
		window.scrollTo(0, Q.Layout.scrollToOffset);
		if (Q.Pointer.windowHeight() > Q.Layout.heightWithAddressBar)
		{
			Q.Layout.fullScreenHeight = Q.Pointer.windowHeight();
			if (Q.Layout.addressBarHeight !== 0)
				Q.Layout.heightWithAddressBar = Q.Layout.fullScreenHeight - Q.Layout.addressBarHeight;
		}
		
		if (!doNotResize)
		{
			// if hideAddressBar hasn't been called for quite some time then it's probably already worked
			// and body height can be restored back to normal
			clearTimeout(Q.Layout.normalBodyHeightTimeout);
			Q.Layout.normalBodyHeightTimeout = setTimeout(function()
			{
				$(document.body).css({ 'height': '' });
				if (Q.info.platform === 'android')
				{
					var nativeBlocks = Q.Layout.android.options.nativelyScrolledBlocks;
					for (var i = 0; i < nativeBlocks.length; i++)
					{
						$(nativeBlocks[i]).plugin('Q/scrollIndicators', 'update');
					}
				}
			}, 1000);
		}
	},

	/**
	 * Periodically checks Q.Pointer.windowWidth() or window.orientation properties to detect device orientation change.
	 * Applicable mostly to mobile devices, on desktop will adjust layout if window size changes.
	 * Doensn't have to be called manually.
	 * @method checkOrientation
	 * @private
	 */
	checkOrientation: function()
	{
		if (Q.Layout.lastWindowWidth === undefined)
			Q.Layout.lastWindowWidth = 0;
		if (Q.Layout.lastOrientation === undefined)
			Q.Layout.lastOrientation = -1;
		
		var windowWidth = Q.Pointer.windowWidth();
		var windowHeight = Q.Pointer.windowHeight();
		var orientation = window.orientation;
		if ((orientation !== undefined && orientation !== Q.Layout.lastOrientation && windowWidth !== Q.Layout.lastWindowWidth) ||
				(orientation === undefined && windowWidth !== Q.Layout.lastWindowWidth))
		{
			var previousOrientation = Q.Layout.orientation;
			if (orientation !== undefined)
			{
				Q.Layout.lastWindowWidth = windowWidth;
				Q.Layout.lastOrientation = orientation;
				Q.Layout.orientation = ((orientation === 0 || orientation === 180) ? 'portrait' : 'landscape');
			}
			else
			{
				Q.Layout.lastWindowWidth = windowWidth;
				Q.Layout.orientation = (windowWidth > windowHeight ? 'landscape' : 'portrait');
			}
			if (!Q.Layout.orientationOnLoad)
			{
				Q.Layout.orientationOnLoad = Q.Layout.orientation;
			}
			
			$(document.body).removeClass('Q_portrait Q_landscape').addClass('Q_' + Q.Layout.orientation);
			if (Q.info.isMobile && Q.info.platform !== 'android')
				$(document.body).css({ 'height': '1000px' });
			$('#main').css({ 'opacity': '0' });
			var orientationMask = $('.Q_orientation_mask');
			if (!orientationMask.length)
			{
				if (!Q.Layout.orientationMaskIcon)
				{
					Q.Layout.orientationMaskIcon = '/{{Q}}/img/ui/qbix_logo_small.png';
				}
				orientationMask = $('body').prepend(
					'<div class="Q_orientation_mask">' +
						'<img src="' + Q.url(Q.Layout.orientationMaskIcon) + '" alt="Loading...">' +
					'</div>'
				);
			}
			orientationMask.css({
				'width': windowWidth + 'px',
				'height': windowHeight + 'px',
				'line-height': windowHeight + 'px',
				'opacity': '1'
			});
			orientationMask.show();
			
			setTimeout(function()
			{
				if (Q.Layout.fullScreenHeight !== 0 && Q.Layout.addressBarHeight !== 0)
				{
					Q.Layout.fullScreenHeight = windowHeight;
					Q.Layout.heightWithAddressBar = Q.Layout.fullScreenHeight - Q.Layout.addressBarHeight;
				}
				Q.Layout.orientationChange(previousOrientation !== Q.Layout.orientation);
			}, 0);
		}
		if (Q.Layout.fullScreenHeight && windowHeight < Q.Layout.fullScreenHeight &&
				((Q.info.isMobile && (windowHeight !== Q.Layout.heightWithAddressBar)) || !Q.info.isMobile))
		{
			Q.Layout.heightWithKeyboard = windowHeight;
			Q.Layout.keyboardVisible = true;
		}
		else if (!Q.Layout.focusEventOccured)
		{
			Q.Layout.keyboardVisible = false;
		}
		var main = $('#main');
		if (Q.info.platform !== 'android' && main.length !== 0 && main.height() !== windowHeight)
		{
			// if it's 'height-only' orientation change and if keyboard appeared
			// we shouldn't run orientationChange() in such case
			// also there's no need to adjust height if it's address bar appeared
			if (!Q.Layout.keyboardVisible && windowHeight !== Q.Layout.heightWithAddressBar)
				Q.Layout.orientationChange(false, true, true);
		}
		if (Q.Layout.handleAddressBarAppearing && Q.Layout.heightWithAddressBar < Q.Layout.fullScreenHeight &&
				Q.Pointer.windowHeight() === Q.Layout.heightWithAddressBar && !Q.Masks.isVisible('Q.screen.mask'))
		{
			Q.Masks.show('Q.screen.mask');
			Q.Layout.addressBarVisible = true;
		}
	},
	
	/**
	 * Does a huge job of adjusting various blocks of the application depending on current viewport (window) size.
	 * Usually called automatically on any viewport size change, but in some rare cases may be called manually.
	 * @method orientationChange
	 * @param {Boolean} [switched=false] Will be true if screen orientation really changed before calling this method.
	 * This happens when orientation just switched from 'landscape' to 'portrat' or in reverse.
	 * @param {Boolean} [heightOnly=false] Indicates that only height of viewport has changed so many other adjustments
	 *	 aren't needed this time.
	 * @param {Boolean} [dontHideAddressBar=false]. May be set to true to not hide address bar while handle layout changes.
	 *	 Useful together with heightOnly == true presuming that on height only change address bar is already hidden.
	 */
	orientationChange: function(switched, heightOnly, dontHideAddressBar)
	{
		if (Q.Layout.ignoreOrientationChange) return;
		if (switched === undefined)
			switched = false;
		if (heightOnly === undefined)
			heightOnly = false;
		if (Q.info.platform === 'android')
			dontHideAddressBar = true;
		else if (dontHideAddressBar === undefined)
			dontHideAddressBar = false;
		
		if (Q.info.isMobile && !Q.info.isAndroid())
		{
			Q.Layout.handleAddressBarAppearing = false;
		}
		
		var main = $('#main');
		var dashboard = $('#dashboard_slot');
		var column0Slot = $('#column0_slot');
		var column1Slot = $('#column1_slot');
		var column2Slot = $('#column2_slot');
		var noticesSlot = $('#notices_slot');
		var topStub = $('#main > .Q_top_stub');
		
		var browser = Q.Browser.detect();
		
		if (!heightOnly)
		{
			clearTimeout(Q.Layout.orientationFadeTimeout);
			
			if (Q.Layout.isIE8orLess)
			{
				$('.Q_placeholder').css({ 'visibility': 'hidden' });
			}
			
			if (Q.info.platform === 'android')
			{
				Q.Layout.androidInitialOffset = -1;
				
				if (Q.Layout.androidFixed)
				{
					document.body.scrollTop = Q.Layout.androidBodyHeight / 2;
				}
				
				Q.Layout.processAndroidFixedBlocks();
				if (Q.info.isMobile)
				{
					if (Q.Layout.orientation === 'landscape')
				 	{
						var dashboardWidth = Q.Pointer.windowWidth() * 0.25;
						dashboard.css({ 'width': dashboardWidth + 'px' });
						dashboard.data('Q_dashboard_width', dashboardWidth);
						var columnsWidth = Q.Pointer.windowWidth() * 0.75 - 2;
						dashboardWidth += 2;
						var dashboardHeight = dashboard.outerHeight();
						column0Slot.css({
							'width': columnsWidth + 'px',
							'margin-left': dashboardWidth + 'px',
							'top': (parseInt(column0Slot.css('top')) - dashboardHeight) + 'px'
						});
						column0Slot.data('left', column0Slot.css('margin-left'));
						column1Slot.css({
							'width': columnsWidth + 'px',
							'margin-left': dashboardWidth + 'px',
							'top': (parseInt(column1Slot.css('top')) - dashboardHeight) + 'px'
						});
						column1Slot.data('left', column0Slot.css('margin-left'));
						column2Slot.css({
							'width': columnsWidth + 'px',
							'margin-left': dashboardWidth + 'px',
							'top': (parseInt(column2Slot.css('top')) - dashboardHeight) + 'px'
						});
						column2Slot.data('left', column0Slot.css('margin-left'));
					}
					else if (Q.Layout.orientation === 'portrait')
					{
						column0Slot.css({ 'width': '', 'left': 0, 'margin-left': '0' });
						column0Slot.data('left', '0');
						column1Slot.css({ 'width': '', 'left': 0, 'margin-left': '0' });
						column1Slot.data('left', '0');
						column2Slot.css({ 'width': '', 'left': 0, 'margin-left': '0' });
						column2Slot.data('left', '0');
					}
				}
			}
		}
		
		if (Q.info.isMobile && Q.Layout.orientation === 'landscape') {
			var w = parseInt(dashboard.css('width'));
			dashboard.data('Q_dashboard_width', Math.min(Q.Pointer.windowWidth() - column1Slot.width() - 2, column1Slot.width()));
		}
		
		if (Q.info.platform === 'android')
		{
			Q.Layout.adjustColumnsHeight();
		}
		
		if (Q.info.isMobile)
		{
			if (!dontHideAddressBar)
				Q.Layout.hideAddressBar();
			if (Q.Layout.scrollToOffset)
				main.css({ 'margin-top': '1px' });
		}
		
		if (Q.info.isTouchscreen)
		{
			// workaround of strange bug appearing only on iPad and only in start.html (cordova) version
			// and only when initial orientation on app load was landscape: after orientation change landscape => portrait
			// document body is offset to the left behind left border of the screen
			var body = $(document.body);
			body.css({ 'width': Q.Pointer.windowWidth() + 'px' });
			if (switched && Q.info.isLocalFile && Q.Layout.orientation === 'portrait' &&
					Q.Layout.orientationOnLoad === 'landscape' && Q.info.isTablet && Q.info.platform === 'ios')
			{
				body.css({ 'margin-left': ((screen.height - screen.width) / 2) + 'px' });
				body.on(Q.Pointer.start.eventName + '.Q_orientation', function()
				{
					// found that on focus on any text field, document body come to its initial position,
					// so we need to add temporary text field, then immediately focus it, blur it and remove it
					var input = $('<input type="text" />');
					body.append(input);
					input.trigger('focus').trigger('blur').remove();
					body.css({ 'margin-left': '' }).off(Q.Pointer.start.eventName + '.Q_orientation');
					Q.Contextual.updateLayout();
				});
			}
			else
			{
				body.css({ 'margin-left': '' });
			}
			
			if (Q.info.platform !== 'android')
			{
				main.css({ 'height': Q.Pointer.windowHeight() + 'px' });
			}
		}
		
		var orientationMask = $('.Q_orientation_mask');
		orientationMask.css({
			'width': Q.Pointer.windowWidth() + 'px',
			'height': Q.Pointer.windowHeight() + 'px',
			'line-height': Q.Pointer.windowHeight() + 'px'
		});
		
		if (!heightOnly)
		{
			Q.Dashboard.build();
		}
		Q.Dashboard.updateLayout();

		var columnsHeight = 0;
		if (Q.info.isMobile)
		{
			if (Q.info.platform !== 'android')
			{
				columnsHeight = main.height() - topStub.height()
											- (Q.Layout.orientation === 'portrait' ? dashboard.outerHeight() : 0);
				column0Slot.css({ 'height': columnsHeight + 'px' });
				column1Slot.css({ 'height': columnsHeight + 'px' });
				column2Slot.css({ 'height': columnsHeight + 'px' });
			}
		}
		else if (Q.info.isTablet)
		{
			if (Q.Layout.orientation === 'portrait')
			{
				columnsHeight = Q.Pointer.windowHeight() - topStub.height() - dashboard.outerHeight();
			}
			else
			{
				columnsHeight = main.height() - dashboard.offset().top - parseInt(column1Slot.css('margin-bottom'));
			}
			column0Slot.css({ 'height': columnsHeight + 'px' });
			column1Slot.css({ 'height': columnsHeight + 'px' });
			column2Slot.css({ 'height': columnsHeight + 'px' });
		}
		else
		{
			columnsHeight = main.height() - dashboard.offset().top - parseInt(column1Slot.css('margin-bottom'));
			column0Slot.css({ 'height': columnsHeight + 'px' });
			column1Slot.css({ 'height': columnsHeight + 'px' });
			column2Slot.css({ 'height': columnsHeight + 'px' });
			
			var column1Contents = column1Slot.find('.Q_column1_contents');
			var contentsHeight = column1Slot.height() - parseInt(column1Contents.css('padding-top'))
			                   - parseInt(column1Contents.css('padding-bottom'));
			column1Contents.css({ 'height': contentsHeight + 'px' });
			
			var column2Contents = column2Slot.find('.Q_column2_contents');
			if (column2Contents.find('.Streams_chat_tool').length === 0 &&
					column2Contents.find('#Streams_participant_tool').length === 0)
			{
				contentsHeight = column2Slot.height() - parseInt(column2Contents.css('padding-top'))
                       - parseInt(column2Contents.css('padding-bottom'));
				column2Contents.data('Q_scrollbars_auto_hide', true).css({ 'height': contentsHeight + 'px' });
			}
		}
		
		Q.Layout.adjustScrolling();
		Q.Contextual.updateLayout();
		Q.Masks.update();
		
		$('.Q_player').each(function()
		{
				var $this = $(this);
				$this.find('.Q_player_buttons li').css({ 'width': (Math.ceil($this.width() / 2) - 1) + 'px' });
		});
		
		Q.Layout.updateTools(heightOnly);
		
		if (!heightOnly)
		{
			Q.Layout.orientationFadeTimeout = setTimeout(function()
			{
				orientationMask.fadeTo(Q.Layout.options.orientationFadeTime, 0, function()
				{
					orientationMask.hide();
				});
				main.fadeTo(Q.Layout.options.orientationFadeTime, 1);
				if (Q.Layout.isIE8orLess)
				{
					$('.Q_placeholder').css({ 'visibility': 'visible' });
				}
			}, 1000);
		}
		
		if (Q.info.platform === 'android')
		{
			var params = { 'type': 'native', 'scroller': document.body, 'orientation': 'v', 'topOffset': Q.Layout.scrollToOffset };
			var nativeBlocks = Q.Layout.android.options.nativelyScrolledBlocks;
			for (var i = 0; i < nativeBlocks.length; i++)
			{
				$(nativeBlocks[i]).plugin('Q/scrollIndicators', 'remove')
				.plugin('Q/scrollIndicators', params);
			}
		}
		
		Q.Layout.browserSpecifics();

		if (Q.info.isMobile && !Q.info.isAndroid()) {
			Q.Layout.handleAddressBarAppearing = true;
		}
		Q.handle(Q.Layout.onOrientationChangeEvent);
	},
	
	/**
	 * Adjust iScroll applied to various blocks of the application.
	 * Applicable only on mobile devices. Usually called automatically but in rare cases may be
	 * called manually (for example when column contents is loaded dynamically).
	 * @method adjustScrolling
	 */
	adjustScrolling: function()
	{
		var dashboard = $('#dashboard_slot');
		var column0Slot = $('#column0_slot');
		var column1Slot = $('#column1_slot');
		var column2Slot = $('#column2_slot');
		var topStub = $('#main > .Q_top_stub');
		if (Q.info.platform === 'android') // TODO (DT): android-specific scrolling adjustments, if any.
		{
			
		}
		else if (Q.info.isTouchscreen) // iOS scrolling
		{
			if (Q.Layout.iScrollBlocks.column0 && column0Slot.length > 0 && column0Slot.children().length)
			{
				if (column0Slot.children('.Q_column0_contents').outerHeight() > column0Slot.height())
				{
					if (column0Slot.data('Q/iScroll'))
					{
						column0Slot.plugin('Q/iScroll', 'refresh');
					}
					else
					{
						column0Slot.plugin('Q/iScroll');
					}
					var column0Scrollbar = column0Slot.children('div:last:not(.Q_column0_contents)');
					if (column0Scrollbar.length !== 0)
					{
						column0Scrollbar.detach();
						$(document.body).append(column0Scrollbar);
						column0Slot.data('Q_iscroll_scrollbar', column0Scrollbar);
					}
					else
					{
						column0Scrollbar = column0Slot.data('Q_iscroll_scrollbar');
					}
					if (column0Scrollbar)
					{
						column0Scrollbar.css({
							'top': (topStub.height() + (Q.Layout.orientation === 'portrait' ? dashboard.height() : 0)) + 'px',
							'left': (column0Slot.offset().left + column0Slot.width() - column0Scrollbar.outerWidth()) + 'px',
							'right': '',
							'height': column0Slot.outerHeight() + 'px'
						});
						column0Slot.plugin('Q/iScroll', 'refresh');
					}
				}
				else
				{
					column0Slot.plugin('Q/iScroll', 'remove');
				}
			}
			else
			{
				column0Slot.plugin('Q/iScroll', 'remove');
			}
			if (Q.Layout.iScrollBlocks.column1 && column1Slot.length > 0 && column1Slot.children().length > 0)
			{
				if (column1Slot.children('.Q_column1_contents').outerHeight() > column1Slot.height())
				{
					if (column1Slot.data('Q/iScroll'))
					{
						column1Slot.plugin('Q/iScroll', 'refresh');
					}
					else
					{
						column1Slot.plugin('Q/iScroll');
					}
					var column1Scrollbar = column1Slot.children('div:last:not(.Q_column1_contents)');
					if (column1Scrollbar.length !== 0)
					{
						column1Scrollbar.detach();
						$(document.body).append(column1Scrollbar);
						column1Slot.data('Q_iscroll_scrollbar', column1Scrollbar);
					}
					else
					{
						column1Scrollbar = column1Slot.data('Q_iscroll_scrollbar');
					}
					if (column1Scrollbar)
					{
						column1Scrollbar.css({
							'top': (topStub.height() + (Q.Layout.orientation === 'portrait' ? dashboard.height() : 0)) + 'px',
							'left': (column1Slot.offset().left + column1Slot.width() - column1Scrollbar.outerWidth()) + 'px',
							'right': '',
							'height': column1Slot.outerHeight() + 'px'
						});
						column1Slot.plugin('Q/iScroll', 'refresh');
					}
				}
				else
				{
					column1Slot.plugin('Q/iScroll', 'remove');
				}
			}
			else
			{
				column1Slot.plugin('Q/iScroll', 'remove');
			}
			if (Q.Layout.iScrollBlocks.column2 && column2Slot.length > 0 && column2Slot.children().length)
			{
				if (column2Slot.children('.Q_column2_contents').outerHeight() > column2Slot.height())
				{
					if (column2Slot.data('Q/iScroll'))
					{
						column2Slot.plugin('Q/iScroll', 'refresh');
					}
					else
					{
						column2Slot.plugin('Q/iScroll');
					}
					var column2Scrollbar = column2Slot.children('div:last:not(.Q_column2_contents)');
					if (column2Scrollbar.length !== 0)
					{
						column2Scrollbar.detach();
						$(document.body).append(column2Scrollbar);
						column2Slot.data('Q_iscroll_scrollbar', column2Scrollbar);
					}
					else
					{
						column2Scrollbar = column2Slot.data('Q_iscroll_scrollbar');
					}
					if (column2Scrollbar)
					{
						column2Scrollbar.css({
							'top': (topStub.height() + (Q.Layout.orientation === 'portrait' ? dashboard.height() : 0)) + 'px',
							'left': (column2Slot.offset().left + column2Slot.width() - column2Scrollbar.outerWidth()) + 'px',
							'right': '',
							'height': column2Slot.outerHeight() + 'px'
						});
						column2Slot.plugin('Q/iScroll', 'refresh');
					}
				}
				else
				{
					column2Slot.plugin('Q/iScroll', 'remove');
				}
			}
			else
			{
				column2Slot.plugin('Q/iScroll', 'remove');
			}
		}
		else // desktop scrolling
		{
			var column1Contents = column1Slot.children('.Q_column1_contents');
			column1Contents.plugin('Q/scrollbarsAutoHide', { 'scrollbarPadding': Q.Layout.scrollbarsPadding.column1 });
			setTimeout(function()
			{
				column1Contents.trigger('mouseenter').trigger('mouseleave');
			}, 100);
			var column2Contents = column2Slot.children('.Q_column2_contents');
			if (column2Contents.data('Q_scrollbars_auto_hide'))
			{
				column2Contents.plugin('Q/scrollbarsAutoHide', { 'scrollbarPadding': Q.Layout.scrollbarsPadding.column2 });
				setTimeout(function()
				{
					column2Contents.trigger('mouseenter').trigger('mouseleave');
				}, 100);

			}
		}
	},
	
	/**
	 * Adjust columns height depending on their current visible content.
	 * Most usage currently related to android but maybe will be useful on other platforms somehow.
	 * @method adjustColumnsHeight
	 */
	adjustColumnsHeight: function()
	{
		var column1Slot = $('#column1_slot'), column2Slot = $('#column2_slot'), dashboard = $('#dashboard_slot');
		var columnsAvailableHeight = Q.Pointer.windowHeight() - (Q.Layout.orientation === 'portrait' ? dashboard.outerHeight() : 0);
		if (column1Slot.children('.Q_column1_contents').outerHeight() < columnsAvailableHeight)
		{
			column1Slot.css({ 'height': columnsAvailableHeight + 'px' });
		}
		else
		{
			column1Slot.css({ 'height': '' });
		}
		if (column2Slot.children('.Q_column2_contents').outerHeight() < columnsAvailableHeight)
		{
			column2Slot.css({ 'height': columnsAvailableHeight + 'px' });
		}
		else
		{
			column2Slot.css({ 'height': '' });
		}
	},
	
	/**
	 * Handles 'postion: fixed / relative' switching of some blocks to make native scrolling possible.
	 * This function is Android-specific.
	 * @method processAndroidFixedBlocks
	 * @private
	 * @param {Object} e DOM event containing latest 'touchstart' event info.
	 */
	processAndroidFixedBlocks: function(e)
	{
		var body = $(document.body);
		var columns = $('#column0_slot, #column1_slot, #column2_slot');
		var target = e ? e.originalEvent.touches[0].target : null, $target = $(target);
		if (target !== null && target.id !== 'column0_slot' && target.id !== 'column1_slot' && target.id !== 'Streams_chat_tool' &&
				$target.parents(Q.Layout.android.options.nativelyScrolledBlocks.join(', ')).length === 0 &&
				!$target.hasClass('Q_dialog_trigger') && $target.parents('.Q_dialog_trigger').length === 0 &&
				!$target.hasClass('Q_fullscreen_dialog') && $target.parents('.Q_fullscreen_dialog').length === 0)
		{
			if (!Q.Layout.androidFixed)
			{
				body.css({ 'height': Q.Layout.androidBodyHeight + 'px' });
				if (Q.Layout.androidInitialOffset === -1)
				{
					Q.Layout.androidInitialOffset = $('#notices_slot').outerHeight()
																				+ (Q.Layout.orientation === 'portrait' ? $('#dashboard_slot').outerHeight(): 0);
				}
				Q.Layout.curScrollPos = document.body.scrollTop;
				columns.css({
					'position': 'fixed',
					'left': columns.data('left'),
					'margin-left': '0',
					'top': (Q.Layout.androidInitialOffset + Q.Layout.scrollToOffset - Q.Layout.curScrollPos) + 'px'
				});
				body.scrollTop(Q.Layout.androidBodyHeight / 2);
				Q.Layout.androidFixed = true;
			}
			e.preventDefault();
		}
		else if (Q.Layout.androidFixed)
		{
			document.body.scrollTop = Q.Layout.curScrollPos;
			body.css({ 'height': 'auto' });
			columns.css({
				'position': 'static',
				'left': '',
				'margin-left': columns.data('left'),
				'top': 'auto'
			});
			var column2Slot = $(columns[2]);
			if (column2Slot.css('visibility') === 'hidden')
			{
				column2Slot.css({ 'position': '', 'top': '' });
			}
			Q.Layout.androidFixed = false;
		}
	},
	
	/**
	 * Manages columns.
	 * By default column1 and column2 are shown, but if we have column0 filled, then it's shown instead of column1 and column2.
	 * @method handleColumns
	 * @private
	 */
	handleColumns: function()
	{
		if ($('#column0_slot').children().not('.Q_scroll_indicator').length > 0)
		{
			$('#column0_slot').show();
			$('#column1_slot').hide();
			$('#column2_slot').hide();
		} else {
			$('#column0_slot').hide();
			$('#column1_slot').show();
			$('#column2_slot').show();
		}
	},
	
	/**
	 * Updates all tools contained in the app by triggering 'onLayout' on them.
	 * Also calculates additional options for tools with some layout-related values
	 * and passes them to 'Q.onLayout' triggering.
	 * @method updateTools
	 * @param {Boolean} [heightOnly=false] Indicates that only height of viewport has changed so many other adjustments
	 *	 aren't needed this time. Usually this argument is passed from Q.Layout.orientationChange().
	 */
	updateTools: function(heightOnly)
	{
		var column2Slot = $('#column2_slot'), participants = column2Slot.find('.Streams_participant_tool_wrapper');
		
		var layoutUpdateOptions = {};
		layoutUpdateOptions.chatAvailableHeight = column2Slot.height() - participants.outerHeight();
		layoutUpdateOptions.chatWidthOnly = false;
		
		if (!heightOnly)
		{
			if (Q.info.isMobile)
			{
				layoutUpdateOptions.participantsWidth = Q.Pointer.windowWidth(), layoutUpdateOptions.participantsLeft = 0;
				if (Q.Layout.orientation === 'landscape')
				{
					participantsWidth = Q.Pointer.windowWidth() * 0.75 - 2;
					participantsLeft = Q.Pointer.windowWidth() - participantsWidth;
				}
				// TODO (DT): move this to participants tool 'onLayout' after refactoring
				/*participants.css({
					'left': participantsLeft + 'px',
					'width': participantsWidth + 'px'
				});*/
			}
			// participants.children('.Streams_participant_tool').participants('update');
		}
		
		Q.layout();
	},
	
	/**
	 * Flips columns (column1 to column2 and in reverse) of the application.
	 * Makes sense only on mobile platforms because only there one column at a time is displayed.
	 * Uses Q/flip custom jQuery plugin to provide visual 'flip' effect. 
	 * @method flipColumns
	 * @param {String} to Column name which to flip. Valid values only 'column0' | 'column1' | 'column2'.
	 * @param {Object} options Additional options to override some behavior happened before and after columns flip.
	 * @example
	 *   Q.Layout.flipColumns('column2', {
	       'onFlipBegin': new Q.Event(function()
	       {
	         // code executed before flip
	       }, 'Q_flip_begin_common'),
	       'onFlipFinish': new Q.Event(function()
	       {
	         // code executed right after flip finishes
	       }, 'Q_flip_finish_common'),
				 'onBackButtonSet': new Q.Event(function()
	       {
	         // specific code if you need to change default 'Back' button provided by Q.Dashboard
	       }, 'Q_back_button_set_common')
	     });
	 */
	flipColumns: function(to, options)
	{
		if (Q.info.isMobile)
		{
			var o = Q.extend({}, Q.Layout.flipColumns.options[to], options);
			
			if (!Q.Layout.flipColumns.fn) {
				Q.Layout.flipColumns.fn = {};
				
				var updateHash = function(columnName) {
					var h = location.hash;
					var columnNumber = columnName.replace('column', '');
					Q.Layout.ignoreHashChange = true;
					location.hash = location.hash.queryField('column', columnNumber);
					setTimeout(function() {
						Q.Layout.ignoreHashChange = false;
					}, 0);
				};
				
				Q.Layout.flipColumns.current = 'column1';
				
				var columnsFlip = $('#columns_flip');
				Q.each(['column1', 'column2'], function (i, columnName) {
					Q.Layout.flipColumns.fn[columnName] = function(o) {
						if (Q.Layout.flipColumns.current !== columnName) {
							Q.Layout.flipColumns.current = columnName;
							Q.handle(o.onFlipBegin);
							columnsFlip.plugin('Q/flip', {
								onFinish: {'Q_columns_flip_handler': function () {
									if (!Q.Layout.wasHashChange) {
										updateHash(columnName);
									}
									Q.handle(o.onFlipFinish);
									Q.handle(o.onBackButtonSet);
									Q.Layout.adjustScrolling();
								}}
							});
						}
					};	
				});
			}
			
			Q.Layout.flipColumns.fn[to](o);
		}
	},
	
	/**
	 * Makes minor browser specific adjustments to the layout.
	 * @method browserSpecifics
	 * @private
	 */
	browserSpecifics: function()
	{
		if ($.browser.msie)
		{
			
		}
	}
};

/**
 * Layout configuration options.
 * @property options
 * @type Object
 */
Q.Layout.options = {
	/**
	 * An interval in which orientation is periodically checked.
	 * @property options.checkOrientationInterval
	 * @type Number
	 * @default 200
	 */
	'checkOrientationInterval': 200,
	
	/**
	 * When orientation changes all layout is hidden and this is fade-in time for it to appear after layout calculations finished
	 * @property options.orientationFadeTime
	 * @type Number
	 * @default 300
	 */
	'orientationFadeTime': 300
};

/**
 * Layout configuration options specifically for android.
 * @property android.options
 * @type Object 
 */
Q.Layout.android = {
	'options': {
		/**
		 * Property determining which application blocks should be scrolled 'natively' on android, meaning
		 * that no 'iScroll' or 'touchscroll' is applied to them.
		 * This is array of jQuery selectors of the blocks.
		 * @property android.options.nativelyScrolledBlocks
		 * @default ['#column0_slot', '#column1_slot', '#Streams_chat_tool']
		 */
		'nativelyScrolledBlocks': ['#column0_slot', '#column1_slot', '#Streams_chat_tool']
	}
};

/**
 * Additional options for Q.Layout.flipColumns(). Should be set to a hash containing additional Q.Event handlers for different
 * events fired by flipColumns(). You can completely substitute this options with yours but it's preferably to override / append one
 * or few particular handlers
 * @property flipColumns.options
 * @type Object
 * @example
 *   Q.Layout.flipColumns.options = {
       'column1': {
         'onFlipBegin': new Q.Event(function()
         {
           // executed just before flip
         }, 'Q_flip_begin'),
         'onFlipFinish': new Q.Event(function()
         {
           // executed just after flip
         }, 'Q_flip_finish'),
         'onBackButtonSet': new Q.Event(function()
         {
           // some code to override default 'Back' button provided by Q.Dashboard
         }, 'Q_back_button_set')
       },
       'column2': {} // same structure as for 'column1'
     };
 */
Q.Layout.flipColumns.options = {};

Q.onInit.add(function () {

	if (Q.Layout.use) {
		Q.Page.onLoad('').set(function() {
			Q.Layout.needUpdateOnLoad = true;
			Q.Layout.init();
		}, 'Q.Layout');

		Q.Page.beforeUnload('').set(function() {
			Q.Layout.reset();
		}, 'Q.Layout');
	}
	
	if (window.jQuery && jQuery.tools) {
		//jQuery Tools tooltip and validator plugins configuration
		var tooltipConf = jQuery.tools.tooltip.conf;
		tooltipConf.tipClass = 'Q_tooltip';
		tooltipConf.effect = 'fade';
		tooltipConf.opacity = 1;
		tooltipConf.position = 'bottom center';
		tooltipConf.offset = [0, 0];
		var validatorConf = jQuery.tools.validator.conf;
		validatorConf.errorClass = 'Q_errors';
		validatorConf.messageClass = 'Q_error_message';
		validatorConf.position = 'bottom left';
		validatorConf.offset = [0, 0];
		// end of jQuery Tools configuration
	}
	
}, 'Q.Layout');

/**
 * TODO (DT): this class needs to be documented later if it's really needed, otherwise remove it.
 * Class for managing content of the standard application slots.
 * @class Q.Content
 */
Q.Content = {
	
	/**
	 * Sets contents of one or more slots of the app from given response object (usually obtained through Q.loadUrl())
	 * @method setSlots
     * @param {Object} response. Required. Should contain 'slots' object which in turn brings one or more content fields to the app.
	 */
	setSlots: function(response)
	{
		var slots = response.slots;
		var name = null, setter = null, container = null;
		var result = [];
		for (name in slots)
		{
			if (setter = Q.Content.set[name])
			{
				result.push(setter(slots[name]));
			}
			else
			{
				container = $('#' + name + '_slot');
				container.html(slots[name]);
				if (container.length)
				{
					result.push(container[0]);
				}
			}
		}
		return result;		
	},
	
	/**
	 * Sub object containing particular 'setters' for each slot of the app.
     * @property set
     * @type {Object}
	 */
	set:
	{	
		/**
		 * Sets 'title' slot.
		 * This is just a <title> tag of the app.
         * @method set.title
		 * @param {String} contents New title string.
         * @required
		 */
		title: function(contents)
		{
			var container = $('title');
			container.html(contents);
			return container[0];
		},

		/**
		 * Sets 'column1' slot.
         * @method set.column1
		 * @param {String} contents  New content for 'column1' slot.
         * @required
		 */
		column1: function(contents)
		{
			var container = $('#column1_slot');
			if (Q.info.isTouchscreen)
				container.plugin('Q/iScroll', 'remove');
			container.html('<div class="Q_column1_contents">' + contents + '</div>');
			if (Q.info.isTouchscreen)
				container.plugin('Q/iScroll');
			return container[0];
		},
		
		/**
		 * Sets 'column0' slot.
         * @method set.column1
		 * @param {String} contents  New content for 'column1' slot.
         * @required
		 */
		column0: function(contents)
		{
			var container = $('#column0_slot');
			if (Q.info.isTouchscreen)
				container.plugin('Q/iScroll', 'remove');
			container.html('<div class="Q_column0_contents">' + contents + '</div>');
			if (Q.info.isTouchscreen)
				container.plugin('Q/iScroll');
			return container[0];
		},

		// TODO (DT): I guess listing setter need to be reworked
		listing: function(contents)
		{
			var container = $('#listing_slot');
			if (Q.typeOf(contents) === 'array')
			{
				var listItems = '';
				for (var i in contents)
				{
					listItems += '<li>' + contents[i] + '</li>';
				}
				contents = listItems;
			}
			container.html('<div class="Q_listing">' + contents + '</div>');
			container.plugin('Q/listing', { 'handler': Q.Layout.listingHandler, 'blink': false });
			return container[0];
		}
		
		// TODO (DT): need to add people handler similar to listing handler
	}
	
};

/**
 * Class for managing dashboard in the application layout.
 * Usually you don't have to interact with it direcly, it can be considered as partially extracted logic from Q.Layout.
 * @class Dashboard
 * @namespace Q
 * @static
 */
Q.Dashboard = {
	
	/**
	 * Property to set to be true if dashboard 'build' procedure is completed
	 * @property isBuilt
	 * @type Boolean
	 */
	isBuilt: false,
	
	// === private variables below ===
	
	/**
	 * Property to store currently opened expandable.
	 * @property currentExpandable
	 * @type Object
	 * @private
	 */
	currentExpandable: null,
	
	/**
	 * Property to set to be true if expandable open / close animation is currently in progress.
	 * @property animating
	 * @type Boolean
	 * @private
	 */
	animating: false,
	
	/**
	 * Property to store current available height for dashboard.
	 * @property availableHeight
	 * @type Number
	 * @private
	 */
	availableHeight: 0,

	/**
	 * Initially builds dashboard on application load or on orientation change.
	 * Layout much depends on orientation, device type (desktop, touchscreen) and
	 * its screen size, so this procedures considers all related conditions
	 * while building layout and functionality.
	 * @method build
	 */
	build: function()
	{
		if (Q.Dashboard.options.noRefresh) return;
		
		Q.Dashboard.isBuilt = false;
		
		var dashboard = $('#dashboard_slot');
		var noticesSlot = $('#notices_slot');
		var items = dashboard.find('.Q_dashboard_item');
		var expandables = dashboard.find('.Q_dashboard_expandable');
		expandables.css({ 'display': 'block', 'overflow': 'hidden', 'height': '0' });
		var bottomEdge = $('#dashboard_slot .Q_dashboard_bottom_edge');
		
		var peopleButton = dashboard.find('#Q_dashboard_item_people');
		var peopleSlot = dashboard.find('#people_slot');
		if ('people' in Q.Dashboard.options.slots && Q.Users.loggedInUser)
		{
			Q.Users.login.options.onSuccess.set(function()
			{
				peopleButton.show();
				peopleSlot.show();
			}, 'Q_dashboard_login');
		}
		else
		{
			peopleButton.hide();
			peopleSlot.hide();
		}
		
		if (!Q.info.isTouchscreen || (Q.info.isTouchscreen && Q.Layout.orientation === 'landscape'))
		{
			var mainHeight = Q.info.isTouchscreen ? Q.Pointer.windowHeight() : $('#main').height();
			Q.Dashboard.availableHeight = Q.info.isTouchscreen
					? mainHeight - noticesSlot.outerHeight()
					: $('#column1_slot').outerHeight();
			dashboard.removeClass('Q_dashboard_horizontal').addClass('Q_dashboard_vertical').css({
				'width': dashboard.data('Q_dashboard_width') ? dashboard.data('Q_dashboard_width') + 'px' : '',
				'top': '',
				'height': 'auto'
			});
			if (Q.Dashboard.options.fullheight && dashboard.height() < Q.Pointer.windowHeight())
			{
				var dashboardHeight = Q.Pointer.windowHeight() - parseInt(dashboard.css('margin-top')) - parseInt(dashboard.css('margin-top'));
				dashboard.css({ 'min-height': dashboardHeight + 'px' });
			}
			dashboard.find('#Q_dashboard_item_app').plugin('Q/contextual', 'remove');
			dashboard.find('#Q_dashboard_item_people').plugin('Q/contextual', 'remove');
			items.removeClass('Q_dashboard_item_horizontal');
			items.find('br').remove();
			expandables.show();
			Q.Dashboard.currentExpandable = null;
			
			items.off(Q.Pointer.start.eventName + '.Q_expandable').on(Q.Pointer.start + '.Q_expandable', function() {
				if (!Q.Dashboard.animating) {
					Q.Dashboard.openExpandable($(this).next());
				}
			});
			
			dashboard.find('.Q_listing li').each(function()
			{
				var listItem = $(this), text = listItem.children('.Q_listing_item_text');
				text.css({
					'max-width': (listItem.width() - text.prev().outerWidth(true) - parseInt(text.css('margin-left')) - parseInt(text.css('margin-right')) - 5) + 'px'
				});
			});
		}
		else
		{
			dashboard.addClass('Q_dashboard_horizontal');
			dashboard.css({ 'width': Q.Pointer.windowWidth() + 'px', 'height': '', 'min-height': '' });
			items.off(Q.Pointer.start.eventName + '.Q_expandable').addClass('Q_dashboard_item_horizontal');
			items.find('br').remove();
			items.find('img, .Q_people_icon, .Q_dashboard_back_icon_small').after('<br />');
			expandables.hide();
			
			$('.Q_dashboard_item_horizontal', dashboard).each(function () {
				var elements = [];
				$('.Q_listing li', $(this).next()).each(function() {
					var $this = $(this);
					elements.push(
						$('<li />').html($this.html()).attr({
							'data-action': $this.attr('data-action')
						})
					);
				});
				if (elements.length) {
					$(this).plugin('Q/contextual', {
						'className': 'Q_dashboard_listing_contextual',
						'defaultHandler': Q.Layout.listingHandler,
						'elements': elements
					}, function () {
						// after contextual activated we might still have to select the current list item
						selectListItem();
					});
				}
			});
		}
		
		if (!Q.Dashboard.openExpandable)
		{
			Q.Dashboard.openExpandable = function(expandable, options)
			{
				if ( expandable.hasClass('Q_dashboard_expandable')
				&& expandable.children().length > 0
				&& ( Q.Dashboard.currentExpandable === null
					|| (
						Q.Dashboard.currentExpandable !== null
						&& Q.Dashboard.currentExpandable[0] !== expandable[0]
					) 
				)) {
					var expandHeight = expandable.find('.Q_listing').height();
					var itemsHeight = 0;
					items.each(function() {
						if ($(this).css('display') === 'block')
							itemsHeight += items.outerHeight();
					});
					if (expandHeight + itemsHeight > Q.Dashboard.availableHeight) {
						expandHeight = Q.Dashboard.availableHeight - itemsHeight - 1;
					}
					
					var expandTime = Q.Dashboard.options.expandTime;
					if (options && ('expandTime' in options)) {
						expandTime = options.expandTime;
					}
					Q.Dashboard.animating = true;
					expandable.clearQueue().animate(
						{ 'height': expandHeight }, 
						expandTime, 
						function() {
							Q.Dashboard.animating = false;
							var listing = expandable.find('.Q_listing');
							if (Q.info.isTouchscreen) {
								if (listing.height() > expandHeight) {
									if (Q.info.platform === 'android') {
										expandable.plugin('Q/touchscroll', 'remove')
										.plugin('Q/touchscroll');
									} else {
										expandable.plugin('Q/iScroll', 'remove')
										.plugin('Q/iScroll')
										// .children('div:last').css({
										// 	'top': expandable.offset().top + 'px',
										// 	'height': expandable.height() + 'px',
										// 	'right': '0'
										// })
										//.plugin('Q/iScroll', 'refresh');
									}
								}
							} else {
								listing.css({ 'width': expandable.outerWidth() + 'px' });
								expandable.css({ 'overflow': 'auto' }).plugin('Q/scrollbarsAutoHide', {
									scrollbarPadding: false,
									showHandler: {'Q_expandable_scrollbar_handler': function() {
										listing.css({ 'width': '' });
									}},
									hideHandler: {'Q_expandable_scrollbar_handler': function() {
										listing.css({ 'width': expandable.width() + 'px' });
									}}
								});
							}
						}
					);
					
					if (expandable[0] === expandables[expandables.length - 1]) {
						bottomEdge.show();
					} else {
						bottomEdge.hide();
					}
			
					if (Q.Dashboard.currentExpandable !== null) {
						if (Q.info.platform === 'android') {
							Q.Dashboard.currentExpandable.plugin('Q/touchscroll', 'remove');
						} else {
							Q.Dashboard.currentExpandable.plugin('Q/iScroll', 'remove');
						}
						Q.Dashboard.currentExpandable.clearQueue().animate(
							{ 'height': 0 },
							expandTime
						);
					}
					
					Q.Dashboard.currentExpandable = expandable;
				}
			}
		}
		
		if (Q.Users.userStatus) {
			Q.Users.userStatus.update();
		}
		selectListItem(); // one for now
		Q.Page.onActivate('').set(selectListItem, 'Q.Dashboard.build'); // one for later
		
		function selectListItem(elem) {
			if (elem) return;
			var lis = {}, li = null;
			var containers = (Q.Layout.orientation === 'landscape')
				? dashboard
				: $('.Q_dashboard_listing_contextual');
			containers.find('.Q_listing li').each(function () {
				var action = $(this).attr('data-action');
				if (!action) {
					return;
				}
				var url = Q.url(action);
				var u = Q.info.url.split('?')[0];
				if (url === u.substr(0, action.length)
				|| url === Q.info.uriString
				|| url === Q.info.uriString.split(' ')[0]) {
					lis[url] = this;
				}
				$(this).removeClass('Q_permanently_selected');
			});
			Q.each(lis, function () {
				li = $(this).addClass('Q_permanently_selected');
				return false;
			}, {ascending: false});
			if (expandables && Q.Dashboard.openExpandable) {
				oe = li ? li.closest('.Q_dashboard_expandable') : $(expandables[0]);
				Q.Dashboard.openExpandable(oe, { expandTime: 0 });
			}
		}
		
		setTimeout(function()
		{
			Q.Dashboard.isBuilt = true;
			Q.Dashboard.updateLayout();
		}, 500);
	},
	
	/**
	 * Updates dashboard layout if it's already built.
	 * Acts differently for different device types (desktop, touchscreen), its screen size and orientation.
	 * @method updateLayout
	 */
	updateLayout: function()
	{
		if (Q.Dashboard.options.noRefresh) return;
		
		if (Q.Dashboard.isBuilt)
		{
			var mainHeight = Q.info.isTouchscreen ? Q.Pointer.windowHeight() : $('#main').height();
			var dashboard = $('#dashboard_slot');
			var noticesSlot = $('#notices_slot');
			Q.Dashboard.availableHeight = mainHeight - noticesSlot.outerHeight() - parseInt($('#column1_slot').css('margin-top'))
																	- parseInt($('#column1_slot').css('margin-bottom'));
			var itemsHeight = 0;
			dashboard.find('.Q_dashboard_item').each(function()
			{
				var $this = $(this);
				if ($this.css('display') === 'block')
					itemsHeight += $this.outerHeight();
			});
			$('.Q_landscape .Q_dashboard_item').plugin('Q/contextual', 'remove');
			var expandable = Q.Dashboard.currentExpandable ? Q.Dashboard.currentExpandable
										 : dashboard.children('.Q_dashboard_expandable:eq(0)');
			var listing = expandable.find('.Q_listing');
			if (listing.height() + itemsHeight > Q.Dashboard.availableHeight)
			{
				if (Q.info.isTouchscreen)
				{
					expandable.css({ 'height': (Q.Dashboard.availableHeight - itemsHeight) + 'px' });
					if (Q.info.platform === 'android')
					{
						expandable.plugin('Q/touchscroll', 'remove').plugin('Q/touchscroll');
					}
					else
					{
						expandable.plugin('Q/iScroll', 'remove')
						.plugin('Q/iScroll');
						/*
						expandable.children('div:last').css({
							'top': (expandable.offset().top - noticesSlot.outerHeight()) + 'px',
							'height': expandable.height() + 'px',
							'right': '0'
						});
						expandable.plugin('Q/iScroll', 'refresh');
						*/
					}
				}
				else
				{
					expandable.css({
						height: (Q.Dashboard.availableHeight - itemsHeight) + 'px',
						overflow: 'auto'
					}).plugin('Q/scrollbarsAutoHide', {
						scrollbarPadding: false,
						showHandler: {'Q_expandable_scrollbar_handler': function() {
							listing.css({ 'width': '' });
						}},
						hideHandler: {'Q_expandable_scrollbar_handler': function() {
							listing.css({ 'width': expandable.width() + 'px' });
						}}
					});
				}
			}
			else
			{
				if (Q.info.isTouchscreen)
				{
					if (Q.info.platform === 'android')
					{
						expandable.plugin('Q/touchscroll', 'remove');
					}
					else
					{
						expandable.plugin('Q/iScroll', 'remove');
					}
				}
				else
				{
					expandable.css({ 'height': listing.height() + 'px' }).plugin('Q/scrollbarsAutoHide', 'remove');
				}
			}
		}
	},
	
	/**
	 * Destroys dashboard by clearing related functionality.
	 * @method destroy
	 */
	destroy: function()
	{
		if (Q.Dashboard.options.noRefresh) return;
		
		Q.Dashboard.openExpandable = null;
		var dashboard = $('#dashboard_slot');
		var items = dashboard.find('.Q_dashboard_item');
		items.off(Q.Pointer.start.eventName + '.Q_expandable');
	}
};

/**
 * Dashboard configuration options.
 * @property options
 * @type Object
 */
Q.Dashboard.options = {
	/**
	 * Property to temporary disable dashboard rebuilding / refreshing and also destroying.
	 * @property options.noRefresh
	 * @type Boolean
	 * @default false
	 */
	'noRefresh': false,
	/**
	 * When set to true, this property will make dashboard will occupy full available height even if its default height is less.
	 * This options makes sense only on desktop and in landscape mode on tablet / mobile.
	 * @property options.fullheight
	 * @type Boolean
	 * @default false
	 */
	'fullheight': false,
	/**
	 * Property to change dashboard 'expandables' open / close time.
	 * @property options.expandTime
	 * @type Number
	 * @default 300
	 */ 
	'expandTime': 300,
	/**
	 * Property determining which common dashboard slots to enable (show).
	 * This is an array with strings identifying slots.
	 * Note: currently only control over 'people' slot is supported.
	 * @property options.slots 
	 * @default ['listing', 'people', 'user']
	 */
	'slots': ['listing', 'people', 'user']
};

/**
 * Operates contextuals: adding, event handling, showing, hiding.
 * @class Q.Contextual
 */
Q.Contextual = {
	
	// stores all contextuals in array of object, each object contains two jQuery objects inside: trigger and contextual,
	// and optional 'info' field, which may contain arbitrary data assosiated with given contextual;
	// so it's like [{ 'trigger': obj, 'contextual': obj, 'info': obj }]
	collection: [],

	// stores currently shown contextual id, it's '-1' when no contextual is shown at the moment
	current: -1,
	
	// indicates if contextual show() has just been called, need to prevent contextual hiding in 'start' lifecycle handler
	justShown: false,
	
	// contextual fade-in / fade-out time
	fadeTime: 0,
	
	// timeout to dismiss contextual when trigger element tap & hold'ed too long
	dismissTimeout: 1000,
	
	// indicates that the contextual is about to be dismissed because timeout passed
	toDismiss: false,
	
	// option which indicates whether to allow contextual show when mouseover'ing trigger element (only for desktop version)
	triggerOnHover: true,
	
	// settable value to temporary disable contextual showing
	triggeringDisabled: false,
	
	/**
	 * Adds a contextual to the collection for further managing it.
     * @method add
	 * @param {Object|String} trigger . Required. DOM element, jQuery object or jQuery selector which triggers
	 *				contextual showing on mousedown / touchstart event.
	 * @param {Object|String}  contextual . Required. DOM element, jQuery object or jQuery selector.
	 *	 This is the element to be shown as contextual.
	 *	 It must have such structure:
	 *	 <div class="Q_contextual" data-handler="[javascript function name]">
				 <ul class="Q_listing">
					 <!-- data-action is only demonstrational here, you may make attribute of you choice, 'data-item' for example.
								You also may provide 'data-handler' for each item separately -->
					 <li data-action="[some-action]">...</li>
					 ...
				 </ul>
			 </div>
	 *	 For easier creation of such element it's recommended to use Q/contextual plugin.
	 * @param {Object} coords . Optional. If provided, must be an object with such structure: { 'x': value, 'y': value }.
	 *	 By default contextual is shown relatively to trigger element with auto positioning nearly to it
	 *	 considering where it's located: at the top or at the bottom of screen.
	 * @param {Object} size . Optional. If provided, must be an object with such structure: { 'width': value, 'height': value }.
	 *	 Used to override predefined size of the contextual.
	 */
	add: function(trigger, contextual, coords, size, events)
	{
		var info = {
			'inBottomHalf': false,
			'coords': { 'x': 0, 'y': 0 },
			'size': size,
			'relativeToElement': false,
			'startY': 0,
			'moveY': 0,
			'moveTarget': null,
			'selectedAtStart': false,
			'arrowHeight': 0,
			'curScroll': '',
			'inside': false,
			'ellipsissed': false
		};
		
		contextual = $(contextual);
		contextual.appendTo('body');
		trigger = $(trigger);
		if (coords)
		{
			info.coords.x = coords.x;
			info.coords.y = coords.y;
			inBottomHalf = info.coords.y > $(window).height() / 2;
		}
		else
		{
			info.relativeToElement = true;
			Q.Contextual.calcRelativeCoords(trigger, contextual, info);
		}
		Q.Contextual.collection.push({ 'trigger': trigger, 'contextual': contextual, 'info': info });
		
		Q.Contextual.makeShowHandler(events);
		Q.Contextual.makeLifecycleHandlers();
		
		contextual.on('click', function (e) {
			e.preventDefault();
		});
		
		return Q.Contextual.collection.length - 1;
	},
	
	/**
	 * Removes a contextual from collection by given id and
	 * returns collection object (it's contextual along with its trigger and associated data).
     * @method remove
	 */
	remove: function(cid)
	{
		var col = Q.Contextual.collection;
		for (var i=cid+1, l=col.length; i<l; ++i) {
			var state = col[i].trigger.state('Q/contextual');
			if (state && state.id) {
				--state.id;
			}
		}
		var current = col.splice(cid, 1)[0];
		current.trigger.unbind('mouseenter.Q_contextual');
		return current;
	},
	
	/**
	 * Calculates contextual showing coordinates when it's relatively positioned to the trigger.
	 * Parameters are the same as for Q.Contextual.add(), except for 'info', which is new.
     * @method calcRelativeCoords
	 * @param {Object} info . Required. Object containing some data associated with contextual.
	 *	 Particularly here it's used to store calculated coordinates in it.
	 */
	calcRelativeCoords: function(trigger, contextual, info)
	{
		info.coords.x = trigger.offset().left + ((trigger.outerWidth() - (info.size ? info.size.width : contextual.outerWidth())) / 2)
			- document.body.scrollLeft - document.documentElement.scrollLeft;
		var y = trigger.offset().top + trigger.outerHeight() / 2
			- document.body.scrollTop - document.documentElement.scrollTop;
		info.inBottomHalf = y > $(window).height() / 2;
		info.coords.y = info.inBottomHalf ? y - trigger.outerHeight() / 2 : y + trigger.outerHeight() / 2;
	},
	
	/**
	 * Updates all contextuals layout.
	 * Particularly it adjusts contextual coordinates if they're relatively positioned to the trigger.
	 * Useful when trigger position changed, for example when screen orientation of mobile device is changed.
     * @method updateLayout
	 */
	updateLayout: function()
	{
		var col = Q.Contextual.collection;
		var trigger = null, contextual = null, info = null;
		for (var i = 0; i < col.length; i++)
		{
			if (col[i].info)
			{
				trigger = col[i].trigger;
				contextual = col[i].contextual;
				info = col[i].info;
				if (info.relativeToElement)
					Q.Contextual.calcRelativeCoords(trigger, contextual, info);
			}
		}
	},
	
	/**
	 * Creates 'show' handler for contextual which watches for trigger element and
	 * calls Q.Contextual.show() when trigger receives an event.
	 * This method makes required operations only once and one event handler watches all triggers and manages all contextuals using
	 * contextuals collection. This is done to not overload document with many event handlers.
     * @method makeShowHandler
	 */
	makeShowHandler: function(events)
	{
		if (!Q.Contextual.showHandler)
		{
			Q.Contextual.showHandler = function(e)
			{
				if (Q.Contextual.triggeringDisabled) {
					return;
				}
				var col = Q.Contextual.collection;
				var trigger = null, contextual = null, triggerTarget = null;
				var event = (Q.info.isTouchscreen ? e.touches[0] : e);
				var px = Q.Pointer.getX(e), py = Q.Pointer.getY(e), offset = null;
				for (var i = 0; i < col.length; i++)
				{
					trigger = col[i].trigger;
					if (trigger.length !== 0)
					{
						triggerTarget = trigger[0];
						offset = trigger.offset();
						contextual = col[i].contextual;
						if (px >= offset.left && px <= offset.left + trigger.outerWidth() &&
								py >= offset.top && py <= offset.top + trigger.outerHeight() &&
								($(e.target).closest(triggerTarget).length))
						{
							var current = Q.Contextual.current;
							if (current !== -1)
								Q.Contextual.hide();
							
							if (current === i) // if triggering same contextual that was shown before
								return e.preventDefault();
							
							Q.Contextual.current = i;
							if (Q.info.platform === 'android')
							{
								setTimeout(function()
								{
									Q.Contextual.show();
								}, 0);
							}
							else
							{
								Q.Contextual.show();
							}
							var cs = trigger.state('Q/contextual');
							if (cs) {
								Q.layout(cs.contextual[0]);
								Q.handle(cs.onShow, trigger, [cs]);
							}
							Q.Contextual.justShown = true;
							setTimeout(function()
							{
								Q.Contextual.justShown = false;
							}, 0);
							
							Q.Contextual.toDismiss = false;
							setTimeout(function()
							{
								Q.Contextual.toDismiss = true;
							}, Q.Contextual.dismissTimeout);
							
							return e.preventDefault();
						}
					}
				}
			};
			Q.addEventListener(document.body, Q.Pointer.start.eventName, Q.Contextual.showHandler, {
				passive: false
			});
		}
		
		// if 'triggerOnHover' is on then we should create separate handler for latest added contextual
		if (Q.Contextual.triggerOnHover && !Q.info.isTouchscreen)
		{
			(function()
			{
				var latestId = Q.Contextual.collection.length - 1;
				var latest = Q.Contextual.collection[latestId];
				latest.trigger.bind('mouseenter.Q_contextual', function()
				{
					if (Q.Contextual.current !== -1)
						Q.Contextual.hide();
				 
					if (!Q.Contextual.triggeringDisabled)
					{
						Q.Contextual.current = latestId;
						Q.Contextual.show();
					}
				});
			})();
		}
	},
	
	/**
	 * Creates 'lifecycle' event handlers for contextuals.
	 * This includes 'start', 'move' and 'end' event handlers.
	 * These handlers used to operate with items selection, applying different scrolling algorithms etc.
     * @method makeLifecycleHandlers
	 */
	makeLifecycleHandlers: function()
	{
		if (!Q.Contextual.startEventHandler || !Q.Contextual.moveEventHandler || !Q.Contextual.endEventHandler)
		{	
			Q.Contextual.startEventHandler = function(e)
			{
				if (!(Q.Contextual.current !== -1 && !Q.Contextual.justShown))
				{
					return;
				}

				var contextual = Q.Contextual.collection[Q.Contextual.current].contextual;
				var offset = contextual.offset();
				if (Q.info.platform === 'android')
					offset.top -= window.scrollY;

				var info = Q.Contextual.collection[Q.Contextual.current].info;

				var event = (Q.info.isTouchscreen ? e.originalEvent.touches[0] : e);
				var px = Q.Pointer.getX(event), py = Q.Pointer.getY(event);
				info.startY = info.moveY = py;
				if (px >= offset.left && px <= offset.left + contextual.outerWidth() &&
						py >= offset.top && py <= offset.top + contextual.outerHeight())
				{
					info.moveTarget = null;
					if (event.target.tagName && event.target.tagName.toLowerCase() === 'li')
						info.moveTarget = $(event.target);
					else if (event.target.parentNode.tagName && event.target.parentNode.tagName.toLowerCase() === 'li')
						info.moveTarget = $(event.target.parentNode);
					if (info.moveTarget)
					{
						info.moveTarget.addClass('Q_selected Q_contextual_selected');
						info.selectedAtStart = true;
					}
				}
				else
				{
					Q.Contextual.hide();
				}
				return false;
			};
			$(document.body).on(Q.Pointer.start.eventName, Q.Contextual.startEventHandler);
			
			Q.Contextual.moveEventHandler = function(e)
			{
				if (Q.Contextual.current === -1)
				{
					return;
				}

				var current = Q.Contextual.collection[Q.Contextual.current];
				var contextual = current.contextual;
				var conOffset = contextual.offset();
				var trigger = current.trigger;
				var triggerOffset = (trigger.length !== 0 ? trigger.offset() : { 'top': -1000, 'left': -1000 });
				var info = current.info;
				if (Q.info.platform === 'android')
				{
					conOffset.top -= window.scrollY;
					triggerOffset.top -= window.scrollY;
				}

				var event = (Q.info.isTouchscreen ? e.originalEvent.changedTouches[0] : e);
				var px = Q.Pointer.getX(event), py = Q.Pointer.getY(event);

				var newMoveTarget = $(Q.Pointer.elementFromPoint(px, py)).closest('.Q_listing li');
				if (info.moveTarget)
				{
					if (info.selectedAtStart)
					{
						if (info.startY !== 0 && Math.abs(info.moveY - info.startY) >= 5)
						{
							info.moveTarget.removeClass('Q_selected');
						}
					}
					else
					{
						if (px >= conOffset.left && px <= conOffset.left + contextual.outerWidth() &&
							py >= conOffset.top && py <= conOffset.top + contextual.outerHeight())
						{
							info.inside = true;
							if (newMoveTarget.length > 0 && newMoveTarget[0] !== info.moveTarget[0])
							{
								info.moveTarget.removeClass('Q_selected');
								newMoveTarget.addClass('Q_selected');
							}
						}
						else if (info.inside)
						{
							info.inside = false;
						}
						info.moveTarget = newMoveTarget;
					}
				}
				else
				{
					info.moveTarget = newMoveTarget;
				}

				if (info.startY === 0)
					info.startY = py;
				// this condition is again to fight against strange bug in Chrome (when touchmove coordinate is the same as on touchstart)
				else if (py !== info.startY)
					info.moveY = py;

				// if 'triggerOnHover' is on here we should track (only for desktop) if mouse cursor
				// is out of bounds of both contextual and its trigger element
				// if so, we're hiding contextual, but before that we should wait some time
				if (Q.Contextual.triggerOnHover && !Q.info.isTouchscreen)
				{
					if (!(
							(px >= conOffset.left && px <= conOffset.left + contextual.outerWidth() &&
								py >= conOffset.top - (info.inBottomHalf ? 0 : info.arrowHeight) &&
								py <= conOffset.top + contextual.outerHeight() + (info.inBottomHalf ? info.arrowHeight : 0))
						||	(px >= triggerOffset.left && px <= triggerOffset.left + trigger.outerWidth() &&
								py >= triggerOffset.top && py <= triggerOffset.top + trigger.outerHeight())
						|| (!info.inBottomHalf && py >= triggerOffset.bottom && py <= conOffset.top)
						|| (info.inBottomHalf && py <= triggerOffset.top && py >= conOffset.bottom)
					)) {
						Q.Contextual.hide();
					}
				}
			};
			$(document.body).on(Q.Pointer.move, Q.Contextual.moveEventHandler);
			
			Q.Contextual.enterEventHandler = function (e) {
				var c = Q.Contextual.collection[Q.Contextual.current];
				if (e.target.tagName.toLowerCase() === 'iframe'
				&& c && c.contextual && !c.contextual[0].contains(e.target)) {
					Q.Contextual.hide();
				}
			};
			$(document.body).on(Q.Pointer.enter, Q.Contextual.enterEventHandler);
			
			Q.Contextual.endEventHandler = function(e)
			{
				$('.Q_contextual_selected.Q_selected')
				.removeClass('Q_contextual_selected Q_selected');
				if ($(e.target).hasClass('Q_contextual_inactive')) {
					return;
				}
				if (Q.Contextual.current === -1) {
					return;
				}
				var current = Q.Contextual.collection[Q.Contextual.current];
				var contextual = current.contextual;
				var trigger = current.trigger;
				var info = current.info;
				var offset = trigger.offset();
				if (Q.info.platform === 'android')
					offset.top -= window.scrollY;

				var listingWrapper = null;
				if (contextual.find('.Q_scroller_wrapper').length !== 0)
					listingWrapper = contextual.find('.Q_scroller_wrapper');
				else
					listingWrapper = contextual.children('.Q_listing_wrapper');

				var event = (Q.info.isTouchscreen ? e.originalEvent.changedTouches[0] : e);
				var target = (info.curScroll === 'iScroll' || info.curScroll === 'touchscroll'
						? event.target
						: (info.moveTarget ? info.moveTarget[0] : event.target));
				var px = Q.Pointer.getX(event), py = Q.Pointer.getY(event);

				var element = target;
				while (element)
				{
					if (element.tagName && element.tagName.toLowerCase() === 'li' && $(element).parents('.Q_contextual').length !== 0) {
						break;
					}
					element = element.parentNode;
				}

				if ($(target).parentsUntil(element, '.Q_discouragePointerEvents').length
				|| $('.Q_discouragePointerEvents', target).length) {
					return;
				}


				// if it was mouseup / touchend on the triggering element, then use it to switch to iScroll instead of $.fn.scroller
				if (info.curScroll !== 'iScroll' && info.curScroll !== 'touchscroll' &&
						px >= offset.left && px <= offset.left + trigger.outerWidth() &&
						py >= offset.top && py <= offset.top + trigger.outerHeight())
				{
					Q.Contextual.toDismiss ?  Q.Contextual.hide() : Q.Contextual.applyScrolling();
				}
				else
				{
					// if ((info.curScroll == 'iScroll' || info.curScroll == 'touchscroll' || listingWrapper.css('overflow') == 'auto') &&
					// 		 Math.abs(info.moveY - info.startY) >= 5)
					// {
					// 	return;
					// }
					while (element)
					{
						if (element.tagName && element.tagName.toLowerCase() === 'li' && $(element).parents('.Q_contextual').length !== 0)
							break;
						element = element.parentNode;
					}

					if (element)
					{
						Q.Contextual.itemSelectHandler(element, event);
					}
					else
					{
						if (contextual[0] !== event.target && $(event.target).parents('.Q_contextual').length === 0)
						{
							Q.Contextual.hide();
						}
					}
					Q.Pointer.cancelClick(false, e);
				}
			};
			$(document.body).on(Q.Pointer.end, Q.Contextual.endEventHandler);
			
			Q.Contextual.itemSelectHandler = function(element, event)
			{
				var contextual = Q.Contextual.collection[Q.Contextual.current].contextual;
				var li = $(element);

				// if event.target element is child of contextual element and event.type is 'touchmove' - just exit
				if (
					Q.Pointer.canceledClick
					&& $(event.target).parents('.Q_contextual').length
					&& Q.getObject(['Pointer', 'canceledEvent', 'type'], Q) === 'touchmove'
				) {
					return;
				}

				// deselect all element
				li.siblings().removeClass('Q_selected');

				// select current element
				li.addClass('Q_selected');

				var handler = li.attr('data-handler');
				handler = handler || contextual.attr('data-handler') || contextual.data('defaultHandler');

				try
				{
					handler = eval(handler);
				}
				catch (e)
				{
					return;
				}
				Q.handle(handler, contextual, [li]);

				Q.Contextual.hide();
			};
		}
	},
	
	/**
	 * Applies appropriate scrolling to contextual contents.
	 * On mobile platforms iScroll is used and on desktop native scrolling with 'overflow: auto' is used.
     * @method applyScrolling
	 */
	applyScrolling: function()
	{
		var contextual = Q.Contextual.collection[Q.Contextual.current].contextual;
		var info = Q.Contextual.collection[Q.Contextual.current].info;
		var listingWrapper = contextual.children('.Q_listing_wrapper');
		var listingWrapperHeight = listingWrapper.height();
		if (Q.info.isTouchscreen)
		{
			listingWrapper.plugin('Q/scroller', 'remove', { 'restoreOverflow': false, 'restoreHeight': false, 'unwrap': false });
			var scrollerWrapper = listingWrapper.hasClass('Q_scroller_wrapper')
				? listingWrapper
				: listingWrapper.children('.Q_scroller_wrapper');
			if (scrollerWrapper.length !== 0)
			{
				scrollerWrapper.css({ 'height': listingWrapperHeight + 'px' });
				
				var scrollTop = 0;
				var listing = scrollerWrapper.children('.Q_listing');
				if (info.inBottomHalf && listing.height() > listingWrapperHeight)
					scrollTop = listingWrapperHeight - listing.height();
				if (Q.info.platform === 'android')
				{
					scrollerWrapper.plugin('Q/touchscroll', { 'y': scrollTop });
				}
				else
				{
					scrollerWrapper.plugin('Q/iScroll', { 'y': scrollTop });
				}
			}
			info.curScroll = scrollerWrapper.data('Q/iScroll') ? 'iScroll' : 'touchscroll';
			
			// adjusting scrollbar position
			if (info.curScroll === 'iScroll')
			{
				scrollerWrapper.children('div').css({
					'margin-right': contextual.css('padding-right'),
					'margin-top': (parseInt(contextual.css('padding-top')) - 2) + 'px',
					'height': listingWrapperHeight + 'px'
				});
				scrollerWrapper.plugin('Q/iScroll', 'refresh');
			}
		}
		else
		{
			listingWrapper.plugin('Q/scroller', 'remove', { 
				restoreOverflow: false, 
				restoreHeight: false
			});
			listingWrapper.css({ 'overflow': 'auto' });
			if (info.inBottomHalf)
			{
				listingWrapper.scrollTop(10000);
				setTimeout(function() {
					listingWrapper.scrollTop(10000);
				}, 0);
			} else {
				listingWrapper.scrollTop(0);
				setTimeout(function() {
					listingWrapper.scrollTop(0);
				}, 0);
			}
		}
	},
	
	/**
	 * Shows a contextual.
	 * You don't have to call it manually since event handling routines do that.
	 * However, if you manually handle contextuals workflow, you stil can.
     * @method show
	 * @param id Number. Optional. If provided, contextual with given id will be shown.
	 */
	show: function(id)
	{
		if (id !== undefined) {
			Q.Contextual.current = id;
		} else if (Q.Contextual.current === -1) {
			return;
		}

		var current = Q.Contextual.collection[Q.Contextual.current];
		var trigger = current.trigger;
		var contextual = current.contextual;
		var info = current.info;
		
		var $body = $(document.body);
		
		if (trigger.length !== 0)
		{
			var triggerLeft = trigger.offset().left;
			if (triggerLeft + trigger.outerWidth() < 0|| triggerLeft > $body.width())
				return;
		}
		
		contextual.find('.Q_contextual_top_arrow, .Q_contextual_bottom_arrow').remove();
		
		contextual.data('Q/contextual trigger', trigger);
		
		if (info.size && info.size.width)
		{
			var width = info.size.width - parseInt(contextual.css('padding-left')) - parseInt(contextual.css('padding-right'));
			contextual.css({ 'width': width + 'px' });
		}
		
		var height = 0;
		if (info.size && info.size.height)
		{
			height = info.size.height - (parseInt(contextual.css('padding-top'))
						 + parseInt(contextual.css('padding-bottom'))) * (Q.info.isMobile ? 2.5 : 2);
		}
		else
		{
			height = Q.Contextual.options.height;
			if (typeof(height) === 'string' && height.indexOf('%') !== -1)
			{
				height = Q.Pointer.windowHeight() * (parseInt(height) / 100);
			}
		}
		
		// temporary showing contextual but making it invisible, it's only needed for getting correct height of contextual
		contextual.css({ 'visibility': 'hidden' });
		contextual.show();
		
		var listingWrapper = contextual.children('.Q_listing_wrapper');
		listingWrapper.children('.Q_scroller_wrapper').children().unwrap();
		// applying Q/sroller by default
		listingWrapper.plugin('Q/scroller', {
			'height': height,
			'startBottom': info.inBottomHalf,
			'eventDelegate': Q.info.isTouchscreen ? document.body : null
		});
		info.curScroll = 'scroller';
		
		if (info.inBottomHalf) {
			contextual.append('<div class="Q_contextual_bottom_arrow" />');
		} else {
			contextual.prepend('<div class="Q_contextual_top_arrow" />');
		}
		listingWrapper.find('.Q_listing').css('transform', 'none');
		var arrow = contextual.find('.Q_contextual_bottom_arrow, .Q_contextual_top_arrow');
		info.arrowHeight = arrow.outerHeight(true);
	
		
		Q.Contextual.calcRelativeCoords(trigger, contextual, info);
		
		var x = info.coords.x, y = info.coords.y;
		var w = (info.size && info.size.width) || contextual.outerWidth();
		var arrowLeft = 0;
		var minArrowLeft = 22;
		var leftOffset = ((w - arrow.outerWidth()) / 2) || minArrowLeft;
		arrow.css('left', leftOffset + 'px');
		if (info.relativeToElement)
		{
			if (info.coords.x < 5)
			{
				x = 5;
				arrowLeft = (leftOffset + trigger.outerWidth()/2 + info.coords.x - 10);
				arrowLeft = arrowLeft < minArrowLeft ? minArrowLeft : arrowLeft;
				arrow.css({ 'left': arrowLeft + 'px' });
			}
			else if (info.coords.x + contextual.outerWidth() + 5 > $body.width())
			{
				x = $body.width() - contextual.outerWidth() - 10;
				arrowLeft = (leftOffset + trigger.outerWidth()/2 + info.coords.x - x);
				arrowLeft = arrowLeft < minArrowLeft ? minArrowLeft : arrowLeft;
				arrow.css({ 'left': arrowLeft + 'px' });
			}
		}
		
		// hiding contextual and making it visible again
		contextual.hide();
		contextual.css({ 'visibility': 'visible' });
		contextual.css({
			'top': (y + (info.inBottomHalf ? - (contextual.outerHeight() + 16) : 16)) + 'px',
			'left': x + 'px'
		});
		if (Q.Contextual.fadeTime > 0)
			contextual.fadeIn(Q.Contextual.fadeTime);
		else
			contextual.show();
		
		if (Q.info.isTouchscreen)
		{
			var mask = Q.Masks.show('Q.screen.mask', {
				fadeIn: Q.Contextual.fadeTime,
				zIndex: 'auto'
			});
			contextual.insertAfter(mask.element);
		}
		
		if (!info.ellipsissed)
		{
			contextual.find('.Q_listing li').each(function()
			{
				var listItem = $(this), text = listItem.children('.Q_listing_item_text');
				text.css({ 'max-width': (listItem.width() - text.prev().outerWidth(true) - 5) + 'px' });
			});
			info.ellipsissed = true;
		}

		$('html').addClass('Q_contextual_shown');
	},

	/**
	 * Hide contextual. Because only one contextual can be shown at a time, these function has no parameters.
	 * Also, usually you don't have to call this manually as contextuals hide automatically on appropriate events.
     * @method hide
	 * @param leaveMask Boolean. Defaults to false. If true, mask won't be hidden along with contextual.
	 */
	hide: function(leaveMask)
	{
		if (Q.Contextual.current === -1)
		{
			return;
		}

		var contextual = Q.Contextual.collection[Q.Contextual.current].contextual;
		var info = Q.Contextual.collection[Q.Contextual.current].info;
		info.moveTarget = null;
		info.selectedAtStart = false;

		var listingWrapper = contextual.children('.Q_listing_wrapper');
		listingWrapper.plugin('Q/scroller', 'remove');
		listingWrapper.plugin('Q/iScroll', 'remove');
		listingWrapper.children('.Q_scroller_wrapper').plugin('Q/iScroll', 'remove');
		listingWrapper.plugin('Q/touchscroll', 'remove');
		listingWrapper.children('.Q_scroller_wrapper').plugin('Q/touchscroll', 'remove');
		listingWrapper.css({ 'max-height': '' });

		if (Q.Contextual.fadeTime > 0)
			contextual.fadeOut(Q.Contextual.fadeTime);
		else
			contextual.hide();
		if (!leaveMask)
		{
			Q.Masks.hide('Q.screen.mask');
		}

		Q.Contextual.current = -1;
		Q.Contextual.outOfBounds = false;

		$('html').removeClass('Q_contextual_shown');
	},
	
	/**
	 * Temporary disables contextuals triggering.
     * @method disable
	 */
	disable: function()
	{
		Q.Contextual.triggeringDisabled = true;
	},
	
	/**
	 * Enables contextuals triggering if it was previously disabled.
     * @method enable
	 */
	enable: function()
	{
		Q.Contextual.triggeringDisabled = false;
	}

};

// TODO: refactor all contextual options into this object
Q.Contextual.options = {
	'height': '80%'
};

/**
 * Makes a very simple infinite scroll.
 * Basically may be applied to 'div' with 'overflow: auto|scroll'.
 * Doesn't provide any way to dynamically get content using ajax,
 * just simply hides elements which aren't visible yet (aren't scrolled to).
 * @method infiniteScroll
 * @param options Object
 *	 A hash of options, that can include:
 *	 "itemSelector": Required. jQuery selector of the items that needs to be hidden and then shown.
 *	 "elementsPerPage": Defaults to 10. Number of elements shown each time user scrolls to the end of container.
 */
$.fn.infiniteScroll = function(options)
{
	var o = {
		'elementsPerPage': 10
	};
	Q.extend(o, options);
	
	if (!o.itemSelector)
	{
		alert("Please provide 'itemSelector' for infiniteScroll");
	}
	
	return this.each(function(index)
	{
		var $this = $(this);
		$this.find(o.itemSelector).slice(o.elementsPerPage).hide();
		var start = o.elementsPerPage;
		Q.Interval.set(function()
		{
			if ($this.scrollTop() > 0 && $this.scrollTop() + $this.outerHeight() >= $this[0].scrollHeight)
			{
				$this.find(o.itemSelector).slice(start, start + o.elementsPerPage).show();
				start += o.elementsPerPage;
			}
		}, 100, 'jQuery.infiniteScroll');
	});
};


/**
 * Q/grammar tool.
 * @method grammar
 */
Q.Tool.define('Q/grammar', function(options) {
	var toolDiv = $(this.element);
	if (!toolDiv.data('constructed'))
	{
		var dialog = toolDiv.children('.Q_grammar_dialog');
		var sendButton = dialog.find('#Q_grammar_send');
		
		$(document).on('keyup', function(e)
		{
			if (e.ctrlKey && e.which === 13)
			{
				var selection = window.getSelection();
				if (!selection.toString())
				{
					alert('Please, select some text first');
				}
				else
				{
					var selectedText = selection.toString();
					var wholeText = selection.anchorNode.wholeText.trim();
					var startExcerptPos = wholeText.indexOf(selectedText);
					var charsPassed = 0;
					while (startExcerptPos > 0)
					{
						charsPassed++;
						startExcerptPos--;
						if (charsPassed >= 20 && wholeText.charAt(startExcerptPos) === ' ')
						{
							startExcerptPos++;
							break;
						}
					}
					var endExcerptPos = wholeText.indexOf(selectedText) + selectedText.length;
					charsPassed = 0;
					while (endExcerptPos < wholeText.length)
					{
						charsPassed++;
						endExcerptPos++;
						if (charsPassed >= 20 && wholeText.charAt(endExcerptPos) === ' ')
						{
							break;
						}
					}
					var excerpt = (startExcerptPos > 0 ? '...' : '')
											+ wholeText.substring(startExcerptPos, endExcerptPos).replace(selectedText, '<b>' + selectedText + '</b>')
											+ (endExcerptPos < wholeText.length ? '...' : '');
					
					sendButton.html('Send');
					sendButton.removeAttr('disabled');
					sendButton.parent().find('span').remove();
					dialog.find('#Q_grammar_text').val(excerpt);
					dialog.find('#Q_grammar_comment').val('');
					dialog.plugin('Q/dialog', { 'mask': true });
				}
			}
		});
		
		sendButton.on('click', function()
		{
			sendButton.html('Sending...');
			sendButton.attr('disabled', 'disabled');
			sendButton.parent().find('span').remove();
			sendButton.next().show();
			
			var params = {
				'url': location.href,
				'text': $('#Q_grammar_text').val(),
				'comment': $('#Q_grammar_comment').val(),
				'author': $('#Q_grammar_author').val()
			};
			
			$.post(Q.ajaxExtend(Q.action('Q/grammar'), 'data', { 'method': 'post' }), params, function(response)
			{
				if (response && response.slots && response.slots.data.sent)
				{
					sendButton.next().hide();
					sendButton.parent().append('<span>Done!</span>');
				}
				else
				{
					sendButton.next().hide();
					sendButton.html('Send');
					sendButton.removeAttr('disabled');
					sendButton.parent().append('<span style="color: #CC0000">Error!</span>');
				}
			}, 'json');
		});
		
		toolDiv.data('constructed', true);
	}
});

})(Q, jQuery);

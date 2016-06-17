(function (Q, $, window, document, undefined) {

/**
 * Q Tools
 * @module Q-tools
 */

/**
 * Makes an infomation block for adding a bookmarklet on the browser's bookmarks bar
 * the way similar to how facebook does: http://www.facebook.com/share_options.php .
 * The main purpose of the tool is to present, in a cross-browser way,
 * user-friendly instructions on how to add bookmarklet in the browser.
 * @class Q bookmarklet
 * @constructor
 * @param {Object} options This is an object with properties for this function
 *	 @param {String} options.content Javascript code or url of the script, with the "javascript:" prefix.
 *	 @param {String} options.title Title for the button which will be added to user's browser bar.
 *	 @param {String} options.usage Text which is appended to instructions, identifying purpose and usage of this bookmarklet.
 *	 @param {String} [options.icon] Icon for the button which will be added to user's browser bar.
 */
Q.Tool.jQuery('Q/bookmarklet', function (o) {
	
	if (!o.content) {
		console.warn("Please provide 'content' for bookmarklet.");
	}
	if (!o.title) {
		console.warn("Please provide 'title' for bookmarklet.");
	}
	if (!o.title) {
		console.warn("Please provide 'usage' for bookmarklet.");
	}
	
	Q.addStylesheet('plugins/Q/css/inplace.css');
	
	var bookmarkletSettings = {
		'common': {
			'instructions': 'Drag me to your Bookmarks Bar to ' + o.usage + '.<br /><br />' +
			'If you can\'t see the Bookmarks Bar, Choose "Show Bookmarks Bar" from your browser "View" menu.'
		}
	};
	Q.extend(bookmarkletSettings, {
		'safari': {
			'mac': {
				'instructions': bookmarkletSettings.common.instructions,
				'icon': false
			},
			'windows': {
				'instructions': bookmarkletSettings.common.instructions,
				'icon': false
			}
		},
		'chrome': {
			'mac': {
				'instructions': bookmarkletSettings.common.instructions,
				'icon': 'chrome_default_icon.png'
			},
			'windows': {
				'instructions': bookmarkletSettings.common.instructions,
				'icon': 'chrome_default_icon.png'
			}
		},
		'firefox': {
			'mac': {
				'instructions': bookmarkletSettings.common.instructions,
				'icon': 'firefox_mac_default_icon.png'
			},
			'windows': {
				'instructions': bookmarkletSettings.common.instructions,
				'icon': 'firefox_win_default_icon.png'
			}
		},
		'opera': {
			'mac': {
				'instructions': bookmarkletSettings.common.instructions,
				'icon': 'opera_mac_default_icon.png'
			},
			'windows': {
				'instructions': bookmarkletSettings.common.instructions,
				'icon': 'opera_win_default_icon.png'
			}
		},
		'explorer': {
			'windows': {
				'instructions': bookmarkletSettings.common.instructions,
				'icon': 'ie_default_icon.png'
			}
		}
	});
	
		var $this = $(this);
		
		var browser = Q.Browser.detect();

		$this.addClass('Q_clearfix');
		switch (browser.OS) {
			case 'android':
				$this.append( '<div class="Q_bookmarklet_tool_instructions">' +
									'<div class="Q_bookmarklet_tool_step">' +
										'<h3>Step 1: Select the text and copy it.</h3>' +
										'<textarea class="Q_bookmarklet_tool_code">' +
											o.content +
										'</textarea>' +
										'<ul>' +
											'<li>Tap inside.</li>' +
											'<li>Tap and hold for a bit, then release.</li>' +
											'<li>Tap <b>Select All</b>.</li>' +
											'<li>Tap <b>Copy</b>.</li>' + 
											'<li>Tap <b>Done</b>.</li>' + 
										'</ul>' +
									'</div>' +
									'<div class="Q_bookmarklet_tool_step">' +
										'<h3>Step 2: Bookmark this page.</h3>' +
										'<ol>' +
											'<li>Tap the bookmark icon next to the address bar, then tap &#9733; Add.</li>' +
											'<li>Tap the Location. Then, tap and hold to bring up the contextual menu, and select <b>Paste</b>.</li>' +
											'<li> Save the changes by tapping <b>Done</b> and <b>OK</b>.</li>' +
										'</ol>' +
									'</div>' +
									'<div class="Q_bookmarklet_tool_step">' +
										'<h3>Step 4: Installation complete.</h3>' +
										'<p>Installation should be complete!</p>' +
										'<p>Tap the bookmark icon next to the address bar, then tap "'+o.title+'" to use it on any page.</p>' +
									'</div>' +
								'</div>');
				break;
				
			case 'ios':
				var url = Q.info.browser.mainVersion >= 8
					? 'plugins/Q/img/bookmarklet/ios8_action.png'
					: 'plugins/Q/img/bookmarklet/ios_action.png';
				var icon = '<img src="'+Q.url(url)+'" class="Q_bookmarklet_ios_action_icon" />';
				if (browser.device === 'iPad') {
					$this.addClass('Q_bookmarklet_tool_iPad');
					$this.append( '<div class="Q_bookmarklet_tool_instructions">' +
										'<div class="Q_bookmarklet_tool_step">' +
											'<h3>Step 1: Bookmark this page.</h3>' +
											'<p>Tap the '+icon+' icon, then tap Add Bookmark, then tap Save.</p>' +
										'</div>' +
										'<div class="Q_bookmarklet_tool_step">' +
											'<h3>Step 2: Select the text and copy it.</h3>' +
											'<textarea class="Q_bookmarklet_tool_code">' +
												o.content +
											'</textarea>' +
											'<ul>' +
												'<li>Tap inside.</li>' +
												'<li>Tap and hold for a bit, then release.</li>' +
												'<li>Tap <b>Select All</b>.</li>' +
												'<li>Tap <b>Copy</b>.</li>' + 
												'<li>Tap <b>Done</b>.</li>' + 
											'</ul>' +
										'</div>' +
										'<div class="Q_bookmarklet_tool_step">' +
											'<h3>Step 3: Edit the bookmark.</h3>' +
											'<ol>' +
												'<li>Tap the Bookmarks button in the toolbar.</li>' +
												'<li>Tap <b>Edit</b>. Select the "'+o.title+'" bookmark to edit.</li>' +
												'<li>Tap its URL, tap the <b>x</b> to clear it, tap-and-hold for the magnifying glass, then tap <b>Paste</b>.</li>' +
												'<li> Save the changes by tapping <b>Done</b>.</li>' +
											'</ol>' +
										'</div>' +
										'<div class="Q_bookmarklet_tool_step">' +
											'<h3>Step 4: Installation complete.</h3>' +
											'<p>Installation should be complete!</p>' +
											'<p>Select the "'+o.title+'" bookmark from your Bookmarks list to use it on any page.</p>' +
										'</div>' +
									'</div>');
				} else {
					$this.addClass('Q_bookmarklet_tool_iPhone');
					$this.append( '<div class="Q_bookmarklet_tool_instructions">' +
										'<div class="Q_bookmarklet_tool_step">' +
											'<h3>Step 1: Bookmark this page.</h3>' +
											'<p>Tap the '+icon+' icon below, then tap Add Bookmark, then tap Save.</p>' +
										'</div>' +
										'<div class="Q_bookmarklet_tool_step">' +
											'<h3>Step 2: Select the text and copy it.</h3>' +
											'<textarea class="Q_bookmarklet_tool_code">' +
												o.content +
											'</textarea>' +
											'<ul>' +
												'<li>Tap inside.</li>' +
												'<li>Tap and hold for a bit, then release.</li>' +
												'<li>Tap <b>Select All</b>.</li>' +
												'<li>Tap <b>Copy</b>.</li>' + 
												'<li>Tap <b>Done</b>.</li>' + 
											'</ul>' +
										'</div>' +
										'<div class="Q_bookmarklet_tool_step">' +
											'<h3>Step 3: Edit the bookmark.</h3>' +
											'<ol>' +
												'<li>Tap the Bookmarks button in the toolbar.</li>' +
												'<li>Tap <b>Edit</b>. Select the "'+o.title+'" bookmark to edit.</li>' +
												'<li>Tap its URL, tap the <b>x</b> to clear it, tap-and-hold for the magnifying glass, then tap <b>Paste</b>.</li>' +
												'<li> Save the changes by tapping <b>Done</b>.</li>' +
											'</ol>' +
										'</div>' +
										'<div class="Q_bookmarklet_tool_step">' +
											'<h3>Step 4: Installation complete.</h3>' +
											'<p>Installation should be complete!</p>' +
											'<p>Select the "'+o.title+'" bookmark from your Bookmarks list to use it on any page.</p>' +
										'</div>' +
									'</div>');
				}
				break;
			default:
				$this.append('<div class="Q_bookmarklet_tool_instructions">' + 
								 '<div class="Q_bookmarklet_tool_drag_button">' +
									 '<div class="Q_bookmarklet_tool_sample_button_tip">Drag me to your<br />Bookmarks Bar</div><br />' +
									 '<div class="Q_bookmarklet_tool_sample_button Q_bookmarklet_tool_button_' + browser.name + '_' + browser.OS + '">' +
											 '<div class="Q_bookmarklet_tool_button_left"></div>' +
											 '<div class="Q_bookmarklet_tool_button_middle">' +
												 '<a href="#">' +
													 (bookmarkletSettings[browser.name][browser.OS]['icon'] ?
														'<img src="' +
														(o.icon ? o.icon : Q.info.proxyBaseUrl + '/plugins/Q/img/bookmarklet/' + bookmarkletSettings[browser.name][browser.OS]['icon']) +
														'" alt="" />'
														: '') +
													 o.title +
												 '</a>' +
											 '</div>' +
											 '<div class="Q_bookmarklet_tool_button_right"></div>' +
									 '</div>' +
								 '</div>' +
								 '<div class="Q_bookmarklet_tool_instruction_text">' +
									 bookmarkletSettings[browser.name][browser.OS]['instructions'] +
								 '</div>' +
							 '</div>');
	$this.append('<div class="Q_bookmarklet_tool_bookmarks_bar_sample">' +
								 '<div class="Q_bookmarklet_tool_bar_screenshot Q_bookmarklet_tool_bar_screenshot_' + browser.name + '_' + browser.OS + '"">' +
									 '<div class="Q_bookmarklet_tool_sample_button Q_bookmarklet_tool_button_' + browser.name + '_' + browser.OS + '">' +
										 '<div class="Q_bookmarklet_tool_button_left"></div>' +
										 '<div class="Q_bookmarklet_tool_button_middle">' +
											 '<a href="#">' +
												 (bookmarkletSettings[browser.name][browser.OS]['icon'] ?
													'<img src="' +
													(o.icon ? o.icon : Q.info.proxyBaseUrl + '/plugins/Q/img/bookmarklet/' + bookmarkletSettings[browser.name][browser.OS]['icon']) +
													'" alt="" />'
													: '') +
												 o.title +
											 '</a>' +
										 '</div>' +
										 '<div class="Q_bookmarklet_tool_button_right"></div>' +
									 '</div>' +
								 '</div>' +
								 '<div class="Q_bookmarklet_tool_bookmarks_bar_description">' +
									 'After you drag the button to the Bookmarks Bar, it will look like this.' +
								 '</div>' +
							 '</div>');
			var $a = $this.find('.Q_bookmarklet_tool_button_middle a');
			var content = null;
			if (o.content) {
				content = o.content;
				if (o.content.substr(0, 11) !== 'javascript:') {
					o.content = 'javascript:'+o.content;
				}
				$a.attr('href', encodeURIComponent(o.content.replace('\n', ' ')));
			}
			$a.eq(0).on('click.Q_bookmarklet', function() {
				alert(o.clickPrompt);
				return false;
			});
		}
},

{
	icon: null,
	clickPrompt: 'This is a bookmarklet, drag it to your bookmarks bar.'
});

})(Q, jQuery, window, document);
<?php

/**
 * @module Q-tools
 */

/**
 * This tool renders tabs which behave appropriately in many different environments
 * @class Q tabs
 * @constructor
 * @param {array} [$options] options to pass to the tool
 *  @param {array} [$options.tabs] An associative array of name: title pairs.
 *  @param {array} [$options.urls] An associative array of name: url pairs to override the default urls.
 *  @param {boolean|array} [options.retain] Pass true to retain slots from all tabs, or object of {name: Boolean} for individual tabs. Makes switchTo avoid reloading tab url by default, instead it restores last-seen slot contents, url and title.
 *  @param {string} [$options.field='tab'] Uses this field when urls doesn't contain the tab name.
 *  @param {boolean} [options.checkQueryString=false] Whether the default getCurrentTab should check the querystring when determining the current tab
 *  @param {boolean} [$options.vertical=false] Stack the tabs vertically instead of horizontally
 *  @param {boolean} [$options.compact=false] Display the tabs interface in a compact space with a contextual menu
 *  @param {boolean} [$options.touchlabels=Q_Request::isMobile()] Whether to show touchlabels on the tabs
 *  @param {Object} [$options.overflow]
 *  @param {String} [$options.overflow.content] The html that is displayed when the tabs overflow. You can interpolate {{count}}, {{text}} or {{html}} in the string. 
 *  @param {String} [$options.overflow.glyph] Override the glyph that appears next to the overflow text. You can interpolate {{count}} here
 *  @param {String} [$options.overflow.defaultText] The text to interpolate {{text}} in the content when no tab is selected
 *  @param {String} [$options.overflow.defaultHtml] The text to interpolate {{text}} in the content when no tab is selected
 *  @param {string} [$options.defaultTabName] Here you can specify the name of the tab to show by default
 *  @param {string} [$options.selectors] Array of (slotName => selector) pairs, where the values are CSS style selectors indicating the element to update with javascript, and can be a parent of the tabs. Set to null to reload the page.
 *  @param {string} [$options.slot] The name of the slot to request when changing tabs with javascript.
 *  @param {string} [$options.classes] An associative array of the form name => classes, for adding classes to tabs
 *  @param {string} [$options.attributes] An associative array of the form name => classes, for adding attributes to tabs
 *  @param {string} [$options.titleClasses]  An associative array for adding classes to tab titles
 *  @param {string} [$options.after] Name of an event that will return HTML to place after the generated HTML in the tabs tool element
 *  @param {string} [$options.loader] Name of a function which takes url, slot, callback. It should call the callback and pass it an object with the response info. Can be used to implement caching, etc. instead of the default HTTP request. This function shall be Q.batcher getter
 *  @param {string} [$options.onClick] Event when a tab was clicked, with arguments (name, element). Returning false cancels the tab switching.
 *  @param {string} [$options.beforeSwitch] Event when tab switching begins. Returning false cancels the switching.
 *  @param {string} [$options.beforeScripts] Name of the function to execute after tab is loaded but before its javascript is executed.
 *  @param {string} [$options.onCurrent] Name of the function to execute after a tab is shown to be selected.
 *  @param {string} [$options.onActivate] Name of the function to execute after a tab is activated.
 */
function Q_tabs_tool($options)
{
	$field = 'tab';
	$slot = 'content,title';
	$selectors = array(
		'content' => '#content_slot'
	);
	$urls = array();
	$attributes = array();
	extract($options);
	if (!isset($tabs)) {
		return '';
	}
	if (isset($overflow) and is_string($overflow)) {
		$overflow = array('content' => $overflow);
	}
	/**
	 * @var array $tabs
	 * @var boolean $vertical
	 * @var boolean $compact
	 * @var array $touchlabels
	 */
	if (!isset($touchlabels)) {
		$touchlabels = Q_Request::isMobile(); // default
	}
	$sel = isset($_REQUEST[$field]) ? $_REQUEST[$field] : null;
	$result = '';
	$i = 0;
	$selectedName = null;
	$uri_string = (string)Q_Dispatcher::uri();
	$uri_string2 = (string)Q_Request::uri();
	foreach ($tabs as $name => $title) {
		if ($name === $sel
		or $name === $uri_string
		or $urls[$name] === $uri_string
		or $name === $uri_string2
		or $urls[$name] === $uri_string2
		or $urls[$name] === Q_Request::url()) {
			$selectedName = $name;
			break;
		}
	}
	foreach ($tabs as $name => $title) {
		if (isset($urls[$name])) {
			$urls[$name] = Q_Uri::url($urls[$name]);
		} else {
			$urls[$name] = Q_Uri::url(Q_Request::url(array(
				$field => $name, 
				"/Q\.(.*)/" => null
			)));
		}
		$selected_class = ($name === $selectedName) ? ' Q_current' : '';
		$classes_string = " Q_tab_".Q_Utils::normalize($name);
		if (isset($classes[$name])) {
			if (is_string($classes[$name])) {
				$classes_string .= ' ' . $classes[$name];
			} else if (is_array($classes[$name])) {
				$classes_string .= ' ' . implode(' ', $classes[$name]);
			}
		}
		$titleClasses_string = '';
		if (isset($titleClasses[$name])) {
			if (is_string($titleClasses[$name])) {
				$titleClasses_string = $titleClasses[$name];
			} else if (is_array($titleClasses[$name])) {
				$titleClasses_string = implode(' ', $titleClasses[$name]);
			}
		}
		$title_container = Q_Html::div(
			null, 
			"Q_tabs_title $titleClasses_string",
			isset($title) ? $title : $name
		);
		$attributesMerged = array_merge(array(
			'id' => 'tab_'.++$i,
			'class' => "Q_tabs_tab $classes_string$selected_class", 
			'data-name' => $name
		), Q::ifset($attributes, $name, array()));
		if ($touchlabels and !isset($attributesMerged['data-touchlabel'])) {
			$attributesMerged['data-touchlabel'] = $title;
		}
		$a = Q_Html::a($urls[$name], $title_container);
		$result .= Q_Html::tag('li', $attributesMerged, $a);
	}
	Q_Response::setToolOptions(compact(
		'selectors', 'slot', 'urls', 'retain', 'defaultTabName', 'touchlabels',
		'vertical', 'compact', 'overflow',
		'field', 'loader', 'beforeSwitch', 'beforeScripts', 'onActivate'
	));
	Q_Response::addScript('{{Q}}/js/tools/tabs.js', 'Q');
	Q_Response::addStylesheet('{{Q}}/css/tabs.css', 'Q');
	$classes = empty($vertical) ? ' Q_tabs_horizontal' : ' Q_tabs_vertical';
	if (!empty($compact)) {
		$classes .= " Q_tabs_compact";
	}
	$after = isset($options['after']) ? Q::event($options['after'], $options) : '';
	return "<ul class='Q_tabs_tabs Q_clearfix$classes'>$result$after</ul>";
}

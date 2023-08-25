<?php

/**
 * @module Q-tools
 */

/**
 * Ticker that scrolls its contents with various speeds and pauses
 * @class Q ticker
 * @constructor
 * @param {array} $options
 *  An associative array of fields, possibly including:
 *
 * "content" => string
 *  The content of the ticker. The first top-level element
 *  should contain sub-elements, and their sizes determine where
 *  the ticker would pause between automatically scrolling.
 *  The ticker animates by scrolling its inner contents.
 *
 * "vertical" => bool
 *  Defaults to true. If false, the ticker scrolls horizontally.
 *
 * "speed" => integer
 *  The scrolling speed.
 *  This is the number of items that would scroll by in 1 second,
 *  if there were no pauses.
 *  When the speed is positive, vertical tickers scroll down, and
 *  horizontal tickers scroll to the right. New content seems to come in
 *  from the bottom (for vertical tickers) or right (for horizontal tickers)
 *  as the ticker scrolls. The element inside the ticker will start out
 *  aligned with the top side of the ticker (for vertical tickers),
 *  or the left side of the ticker (for horizontal tickers).
 *  When the speed is negative, all this faces the other way.
 *
 * "pause_ms" => int
 *  Defaults to 2000. This is the number of milliseconds to wait
 *  after each second-level element of $content is automatically
 *  scrolled completely into view.
 *
 * "pause_ms_min" => int
 *  If set, then the number of milliseconds to pause is a random
 *  integer between $pause_ms_min and $pause_ms.
 *
 * "scrollbars" => bool
 *  Defaults to true. If true, shows scrollbars, otherwise doesn't.
 *  (Note: this will let the user know how much content is left,
 *   and be able to see it before it would automatically scroll into view.)
 *
 * "scrollbars_pause_ms" => int
 *  Defaults to 500. The ticker pauses its automatic scrolling when the user
 *  starts using the scrollbars. This is the number of milliseconds to wait
 *  until resuming the automatic scrolling.
 *
 * "anim_ms" => int
 *  Defaults to 100. This is the number of milliseconds between calls to
 *  autoScroll.
 *
 * "initial_scroll_mode" => string
 *  Defaults to 'auto'. This is the mode that scrolling starts out in.
 *  Possible values are 'auto' and 'paused'.
 *
 * "ease" => string
 *  Optional. If set, specifies the name of the ease function
 */
function Q_ticker_tool($options = array())
{
	$defaults = array(
		'vertical' => true,
		'speed' => 1,
		'pause_ms' => 2000,
		'scrollbars' => true,
		'scrollbars_pause_ms' => 500,
		'anim_ms' => 100
	);
	$fields2 = array_merge($defaults, $options);

	if (!isset($fields2['pause_ms_min'])) {
		$fields2['pause_ms_min'] = $fields2['pause_ms'];
	}

	if (!isset($fields2['content'])) {
		$li_array = array();
		for ($i=0; $i < 100; ++$i) {
			$li_array[] = '<li><div style="background-color:#'.dechex(rand(0, 16)).dechex(rand(0,16)).dechex(rand(0,16)).dechex(rand(0,16)).dechex(rand(0,16)).dechex(rand(0,16)).'">Missing $content parameter. This is just example #'.$i.'</div></li>';
		}
		$default_content = implode("\n", $li_array);
		if ($fields2['vertical']) {
			$fields2['content'] = "<ul class='error'>$default_content</ul>";
		} else {
			$fields2['content'] = "<ul class='error'>$default_content</ul>";
		}
	}

	Q_Response::addStylesheet('{{Q}}/css/tools/ticker.css', 'Q');
	Q_Response::addScript('{{Q}}/js/tools/ticker.js', 'Q');
	Q_Response::setToolOptions($fields2);

	$direction_class = $fields2['vertical'] ? 'vertical' : 'horizontal';
	$scrollbars_class = $fields2['scrollbars'] ? 'scrollbars' : '';

	return Q_Html::tag('div', array(
		'class' => "Q_ticker $direction_class $scrollbars_class"),
		$fields2['content']
	);
}
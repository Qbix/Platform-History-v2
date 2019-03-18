<?php

/**
 * @module Q-tools
 */

/**
 * Creates an area that behaves like position: fixed in most modern browsers,
 * including ones on touchscreens. Often used for fixed areas that wind up
 * covered by content as it scrolls over the areas.
 * @class Q drawers
 * @constructor
 * @param {array}   [$options] Provide options for this tool
 *  @param {array}   [$options.drawers] Array of strings holding html for drawers
 *  @param {string} [$options.container=null] Optional jQuery selector for handling scrolling
 *  @param {array}   [$options.initial] Information for the initial animation
 *  @param {integer}   [$options.initial.index=1] The index of the drawer to show, either 0 or 1
 *  @param {integer}   [$options.initial.delay=0] Delay before starting initial animation
 *  @param {integer}   [$options.initial.duration=300] The duration of the initial animation
 *  @param {Function} [$options.initial.ease=Q.Animation.linear] The easing function of the initial animation
 *  @param {array}   [$options.transition] Information for the transition animation
 *  @param {integer}   [$options.transition.duration=300] The duration of the transition animation
 *  @param {Function}   [$options.transition.ease=Q.Animation.linear] The easing function of the transition animation
 *  @param {Function}   [$options.width] Override the function that computes the width of the drawers
 *  @param {Function}   [$options.height] Override the function that computes the height drawers tool
 *  @param {array}   [$options.heights=[100,100]] Array of [height0, height1] for drawers that are pinned
 *  @param {array}   [$options.placeholders=['','']] Array of [html0, html1] for drawers that are pinned
 *  @param {array}   [$options.behind=[true,false]] Array of [boolean0, boolean1] to indicate which drawer is behind the others
 *  @param {array}   [$options.bottom=[false,false]] Array of [boolean0, boolean1] to indicate whether to scroll to the bottom of a drawer after switching to it
 *  @param {array}   [$options.triggers=['{{Q}}/img/drawers/up.png', '{{Q}}/img/drawers/down.png']] Array of [src0, src1] for img elements that act as triggers to swap drawers. Set array elements to false to avoid rendering a trigger.
 *  @param {array}   [$options.trigger]] Options for the trigger elements
 *  @param {integer}   [$options.trigger.rightMargin=10]] How many pixels from the right side of the drawers
 *  @param {integer}   [$options.transition=300]] Number of milliseconds for fading in the trigger images
 *  @param {boolean}   [$options.fullscreen=Q.info.isAndroidStock && Q.info.isAndroid(1000)]] Whether the drawers should take up the whole screen
 *  @param {integer}   [$options.foregroundZIndex=50] The z-index of the drawer in the foreground
 *  @param {integer}   [$options.beforeSwap=new Q.Event()] Occurs right before drawer swap
 *  @param {integer}   [$options.onSwap=new Q.Event()] Occurs right after drawer swap
 */
function Q_drawers_tool($options)
{
	$result = '';
	foreach ($options['drawers'] as $i => $html) {
		$result .= Q_Html::div("drawer_$i", "Q_drawers_drawer Q_drawers_drawer_$i", $html);
	}
	unset($options['drawers']);
	Q_Response::addScript('{{Q}}/js/tools/drawers.js', 'Q');
	Q_Response::addStylesheet('{{Q}}/css/drawers.css', 'Q');
	Q_Response::setToolOptions($options);
	return $result;
}
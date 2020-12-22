<?php

/**
 * @module Q-tools
 */

/**
 * This tool contains functionality to show things in columns
 * @class Q columns
 * @constructor
 * @param {array}   [$options] Provide options for this tool
 *  @param {string}  [$options.title] You can put a default title for all columns here (which is shown as they are loading)
 *  @param {string}  [$options.column] You can put a default content for all columns here (which is shown as they are loading)
 *  @param {String}  [$options.controls] You can put default controls HTML for all columns here (which is shown as they are loading)
 *  @param {array}  [$options.data] Any data you want to associate with the column, to be retrieved later by the tool.data() method
 *  @param {array}  [$options.attributes] Any attributes you want to add to the column element
 *  @param {array}  [$options.animation] For customizing animated transitions
 *  @param {integer}  [$options.animation.duration] The duration of the transition in milliseconds, defaults to 500
 *  @param {array}  [$options.animation.hide] The css properties in "hide" state of animation
 *  @param {array}  [$options.animation.show] The css properties in "show" state of animation
 *  @param {array}  [$options.back] For customizing the back button on mobile
 *  @param {string}  [$options.back.src] The src of the image to use for the back button
 *  @param {boolean} [$options.back.hide] Whether to hide the back button. Defaults to false, but you can pass true on android, for example.
 *  @param {array}  [$options.close] For customizing the back button on desktop and tablet
 *  @param {string}  [$options.close.src] The src of the image to use for the close button
 *  @param {Object}  [$options.close.clickable] If not null, enables the Q/clickable tool with options from here. Defaults to null.
 *  @param {Boolean} [$options.closeFromSwipeDown=true] on a touchscreen, close a column after a swipe-down gesture starting from the title
 *  @param {boolean} [$options.closeFromTitleClick] Whether the whole title would be a trigger for the back button. Defaults to true.
 *  @param {array}  [$options.scrollbarsAutoHide] If not null, enables Q/scrollbarsAutoHide functionality with options from here. Enabled by default.
 *  @param {boolean} [$options.fullscreen] Whether to use fullscreen mode on mobile phones, using document to scroll instead of relying on possibly buggy "overflow" CSS implementation. Defaults to true on Android, false everywhere else.
 *  @param {array}   [$options.columns] In PHP only, an array of $name => $column pairs, where $column is in the form array('title' => $html, 'column' => $html, 'close' => true, 'controls' => $html, 'url' => $url), 'columnClass' => string, with "controls", "close", "columnClass" and "url" being optional
 * @param {array} [$options.classes=Q_Config.get('Q','columns','classes')]
 *  An array of "columnName" => "css classes here"
 * @return {string}
 */
function Q_columns_tool($options)
{
	if (!isset($options['classes'])) {
		$options['classes'] = Q_Config::get('Q', 'columns', 'classes', array());
	}
	$jsOptions = array(
		'animation', 'back', 'close', 'title', 'stretchFirstColumn',
		'scrollbarsAutoHide', 'fullscreen', 'expandOnMobile', 'classes'
	);
	Q_Response::setToolOptions(Q::take($options, $jsOptions));
	if (!isset($options['columns'])) {
		return '';
	}
	Q_Response::addScript('{{Q}}/js/tools/columns.js', 'Q');
	Q_Response::addStylesheet('{{Q}}/css/columns.css', 'Q');
	$result = '<div class="Q_columns_container Q_clearfix">';
	$columns = array();
	$i=0;
	$closeSrc = Q::ifset($options, 'close', 'src', '{{Q}}/img/x.png');
	$backSrc = Q::ifset($options, 'back', 'src', '{{Q}}/img/back-v.png');
	$cssClasses = $options['classes'];
	foreach ($options['columns'] as $name => $column) {
		$close = Q::ifset($column, 'close', $i > 0);
		$Q_close = Q_Request::isMobile() ? 'Q_close' : 'Q_close Q_back';
		$closeHtml = !$close ? '' : (Q_Request::isMobile()
			? '<div class="Q_close Q_back">'.Q_Html::img($backSrc, 'Back').'</div>'
			: '<div class="Q_close">'.Q_Html::img($closeSrc, 'Close').'</div>');
		$n = Q_Html::text($name);
		$n2 = Q_Utils::normalize($name, '_', null, null, true);
		$columnClass = "Q_column_$n2 Q_column_$i";
		if (isset($column['columnClass'])) {
			$columnClass .= ' ' . $column['columnClass'];
		}
		$attrs1 = "data-index=\"$i\" data-name=\"$n\"";
		if (isset($column['url'])) {
			$attrs1 .= " data-url=\"" . Q_Html::text($column['url']) . "\"";
		}
		if (isset($column['attributes'])) {
			$attrs1 .= ' ' . Q_Html::attributes($column['attributes']);
		}
		if (isset($column['html'])) {
			$html = $column['html'];
			$columns[] = <<<EOT
<div class="Q_columns_column $columnClass" $attrs1>
	$html
</div>
EOT;
		} else {
			$titleHtml = Q::ifset($column, 'title', '[title]');
			$columnHtml = Q::ifset($column, 'column', '[column]');
			$controlsHtml = Q::ifset($column, 'controls', '');
			$classes = $columnClass . ' ' . Q::ifset($column, 'class', '');
			if ($controlsHtml) {
				$classes .= ' Q_columns_hasControls';
			}
			if (!empty($cssClasses[$name])) {
				$classes .= ' ' . $cssClasses[$name];
			}
			$attrs2 = '';
			if (isset($column['data'])) {
				$json = Q::json_encode($column['data']);
				$attrs2 = 'data-more="' . Q_Html::text($json) . '"';
			}
			$data = Q::ifset($column, 'data', '');
			$titleElement = '';
			if (isset($titleHtml)) {
				$titleElement = <<<EOT
	<div class="Q_columns_title">
		$closeHtml
		<div class="Q_columns_title_container">
			<h2 class="Q_title_slot">$titleHtml</h2>
		</div>
	</div>
EOT;
			}
			$columns[] = <<<EOT
<div class="Q_columns_column $classes" $attrs1 $attrs2>
	$titleElement
	<div class="Q_column_slot">$columnHtml</div>
	<div class="Q_controls_slot">$controlsHtml</div>
</div>
EOT;
		}
		++$i;
	}
	$result .= implode("", $columns) . "</div>";
	return $result;
}
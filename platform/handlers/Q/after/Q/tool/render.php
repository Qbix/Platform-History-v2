<?php

function Q_after_Q_tool_render($params, &$result)
{	
	$info = $params['info'];
	$extra = $params['extra'];
	if (!is_array($extra)) {
		$extra = array();
	}

	$id_prefix = Q_Html::getIdPrefix();
	$tool_ids = Q_Html::getToolIds();

	$tag = Q::ifset($extra, 'tag', 'div');
	if (empty($tag)) {
		Q_Html::popIdPrefix();
		return;
	}
	
	$classes = '';
	$data_options = '';
	$count = count($info);
	foreach ($info as $name => $opt) {
		$classes = ($classes ? "$classes " : $classes)
				. implode('_', explode('/', $name)) . '_tool';
		$options = Q_Response::getToolOptions($name);
		if (isset($options)) {
			$o = Q_Config::get('Q', 'javascript', 'prettyPrintData', true)
					? JSON_PRETTY_PRINT
					: 0;
			$friendly_options = str_replace(
				array('&quot;', '\/'),
				array('"', '/'),
				Q_Html::text(Q::json_encode($options, $o))
			);
		} else {
			$friendly_options = '';
		}
		$normalized = Q_Utils::normalize($name, '-');
		if (isset($options) or $count > 1) {
			$id = $tool_ids[$name];
			$id_string = ($count > 1) ? "$id " : '';
			$data_options .= " data-$normalized='$friendly_options'";
		}
		$names[] = $name;
	}
	if (isset($extra['classes'])) {
		$classes .= ' ' . $extra['classes'];
	}
	$attributes = isset($extra['attributes'])
		? ' ' . Q_Html::attributes($extra['attributes'])
		: '';
	$data_retain = !empty($extra['retain']) || Q_Response::shouldRetainTool($id_prefix)
		? " data-Q-retain=''"
		: '';
	$data_replace = !empty($extra['replace']) || Q_Response::shouldReplaceWithTool($id_prefix)
		? " data-Q-replace=''"
		: '';
	$data_lazyload = !empty($extra['lazyload'])
		? " data-Q-lazyload='waiting'"
		: '';
	$names = ($count === 1) ? ' '.key($info) : 's '.implode(" ", $names);
	$ajax = Q_Request::isAjax();
	$result = "<$tag id='{$id_prefix}tool' "
		. "class='Q_tool $classes'$data_options$data_retain$data_replace$data_lazyload$attributes>"
		. "$result</$tag>";
	if (!Q_Request::isAjax()) {
		$result = "<!--\nbegin tool$names\n-->$result<!--\nend tool$names \n-->";
	}
	
	Q_Html::popIdPrefix();
}

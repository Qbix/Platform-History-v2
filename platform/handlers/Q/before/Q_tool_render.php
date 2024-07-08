<?php

function Q_before_Q_tool_render($params, &$result)
{	
	$info = $params['info'];
	$extra = $params['extra'];
	if (is_string($extra) or is_numeric($extra)) {
		$extra_id = $extra;
		$extra = array();
	} else {
		$extra_id = isset($extra['id']) ? $extra['id'] : '';
	}
	
	$cur_prefix = isset($extra['prefix']) ? $extra['prefix'] : Q_Html::getIdPrefix();
	$tool_ids = array();
	$tool_prefixes = array();
	$firstTool = true;
	foreach ($info as $name => $options) {
		if ($firstTool) {
			$tool_id = Q_Html::id($name . ($extra_id === '' ? '' : "-$extra_id"), $cur_prefix);
			$tool_prefix = $tool_id.'_';
			$firstTool = false;
		}
		$tool_ids[$name] = $tool_id;
		$tool_prefixes[$name] = $tool_prefix;
	}
	if (isset(Q::$toolWasRendered[$tool_prefix])) {
		trigger_error("A tool with prefix \"$tool_prefix\" was already rendered.", E_USER_NOTICE);
	}
	Q::$toolWasRendered[$tool_prefix] = true;

	$prev_prefix = Q_Html::pushIdPrefix($tool_prefixes, $tool_ids);
}

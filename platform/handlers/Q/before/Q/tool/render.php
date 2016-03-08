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
	foreach ($info as $name => $options) {
		$tool_id = implode('_', explode('/', $name));
		if ($extra_id !== '') {
			$tool_id .= ('-'.$extra_id);
		}
		$tool_id = $cur_prefix . $tool_id;
		$tool_ids[$name] = $tool_id;
		$tool_prefix = $tool_id.'_';
		if (isset(Q::$toolWasRendered[$tool_prefix])) {
			trigger_error("A tool with prefix \"$tool_prefix\" was already rendered.", E_USER_NOTICE);
		}
		Q::$toolWasRendered[$tool_prefix] = true;
		$tool_prefixes[$name] = $tool_prefix;
	}

	$prev_prefix = Q_Html::pushIdPrefix($tool_prefixes, $tool_ids);
}

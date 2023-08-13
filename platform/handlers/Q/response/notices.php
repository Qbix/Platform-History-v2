<?php

function Q_response_notices()
{
	$result = "";
	$notices = Q_Response::getNotices();

	// Get any notices that we should know about
	if (!empty($notices)) {
		$result .= "<ul class='Q_notices'>";
		foreach ($notices as $k => $n) {
			if (empty($n['notice'])) {
				continue;
			}

			// collect attributes
			$options = Q::ifset($n, 'options', array());
			$notice = Q::json_encode(Q::take($options, array(
				'key' => $k,
				'closeable' => false,
				'persistent' => false,
				'timeout' => false
			)));
			$result .= Q_Html::tag('li', array(
				'data-key' => $k,
				'data-notice' => $notice
			), $n['notice']) . "\n";
		}
		$result .= "</ul>";
	}

	// Get any errors that we should display
	$errors = Q_Response::getErrors();
	if (!empty($errors)) {
		$result .= "<ul class='Q_errors'>";
		foreach ($errors as $e) {
			$field = '';
			if ($e instanceof Q_Exception and $fields = $e->inputFields()) {
				$field .= '<div class="Q_field_name">'.Q_Html::text(reset($fields)).'</div>';
			}
			$attributes = "data-type='error'";
			$attributes .= " data-closeable='1'";
			$result .= "<li $attributes>".$e->getMessage()."$field</li>";
		}
		$result .= "</ul>";
	}

	$removed_notices = Q_Response::getRemovedNotices();
	if (!empty($removed_notices)) {
		$json = Q::json_encode(array_keys($removed_notices));
		Q_Response::setScriptData('Q.Notices.toRemove', $json);
	}

	return $result ? "<div id='notices'>$result</div>" : '';
}

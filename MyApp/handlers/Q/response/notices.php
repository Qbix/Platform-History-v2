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
			$attributes = "data-key='".Q_Html::text($k)."'";
			$attributes .= " data-handler='".Q::ifset($n, 'options', 'handler', null)."''";
			$attributes .= " data-closeable='".Q::ifset($n, 'options', 'closeable', null)."'";
			$attributes .= " data-persistent='".Q::ifset($n, 'options', 'persistent', false)."'";
			$attributes .= " data-timeout='".Q::ifset($n, 'options', 'timeout', false)."'";
			$result .= "<li $attributes>".$n['notice']."</li>\n";
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
		Q_Response::addScriptLine("if (Q.Notice) Q.handle(Q.Notice.remove($json));");
	}

	return $result ? "<div id='notices'>$result</div>" : '';
}

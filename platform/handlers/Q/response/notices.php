<?php

function Q_response_notices()
{
	$result = "";
	$notices = Q_Response::getNotices();
	
	// Get any notices that we should know about
	$atLeastOne = false;
	if (!empty($notices)) {
		$ul = "<ul class='Q_notices'>";
		foreach ($notices as $k => $n) {
			if (empty($n)) {
				continue;
			}
			$atLeastOne = true;
			$key = Q_Html::text($k);
			$close = "<div class='x'>x</div>";
			$ul .= "<li data-key='$key'>$close$n</li>\n";
		}
		$ul .= "</ul>";
	}
	if ($atLeastOne) {
		$result = $ul;
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
			$result .= "<li>".$e->getMessage()."$field</li>";
		}
		$result .= "</ul>";
	}
	
	$removed_notices = Q_Response::getRemovedNotices();
	if (!empty($removed_notices)) {
		$json = Q::json_encode($removed_notices);
		Q_Response::addScriptLine("if (Q.Notice) Q.handle(Q.Notice.remove($json));");
	}

	return $result ? "<div id='notices'>$result</div>" : '';
}

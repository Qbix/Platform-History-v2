<?php

function Q_response_notices()
{
	$result = "";
	$notices = Q_Response::getNotices();
	
	// Get any notices that we should know about
	if (!empty($notices)) {
		$result .= "<ul class='Q_notices'>";
		foreach ($notices as $k => $n) {
			$key = Q_Html::text($k);
			$result .= "<li data-key='$key'>$n</li>\n";
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
			$result .= "<li>".$e->getMessage()."$field</li>";
		}
		$result .= "</ul>";
	}

	return $result ? "<div id='notices'>$result</div>" : '';
}

<?php

function Q_response_errors()
{
	$errors = Q_Response::getErrors();
	if (empty($errors)) {
		return '';
	}
	$result = "<ul class='Q_errors'>";
	foreach ($errors as $e) {
		$result .= "<li>".$e->getMessage()."</li>";
	}
	$result .= "</ul>";
	return $result;
}

<?php

function Streams_after_Streams_relateTo_Streams_question ($params)
{
	$question = $params['category'];
	$answer = $params['stream'];
	$type = $params['type'];

	if ($type != 'Streams/answer') {
		return;
	}

	$options = $answer->getAttribute("options");
	if (!is_array($options)) {
		return;
	}

	foreach ($options as $option) {
		$answer->relateTo($question, Q_Utils::normalize($option));
	}
}
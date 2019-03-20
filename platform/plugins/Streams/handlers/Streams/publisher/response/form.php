<?php

function Streams_publisher_response_form() {
	if (isset(Streams::$cache['result'])) {
		return array(
				'publisherId' => Streams::$cache['result']->publisherId,
				'name' => Streams::$cache['result']->name
			);
	} else {
		return false;
	}
}
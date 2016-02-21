<?php

function Invites_welcome_response($params) {
	Q::event("Streams/invited/response", $params);
}
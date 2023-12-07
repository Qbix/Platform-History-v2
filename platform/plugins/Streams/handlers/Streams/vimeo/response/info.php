<?php
function Streams_vimeo_response_info () {
	$videoId = $_REQUEST['videoId'];
	$vimeo = new Q_Video_Vimeo();
	$info = $vimeo->getInfo($videoId);

	return Q::take($info, array("status", "duration", "width", "height", "type"));
}
<?php
function Assets_NFTcollections_response_content ($params) {
	Q::event('Assets/NFTcollections/response/column', $params);
	return Q::view('Assets/content/columns.php');
}
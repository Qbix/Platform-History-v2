<?php
function Assets_NFTowned_response_content ($params) {
	Q::event('Assets/NFTowned/response/column', $params);
	return Q::view('Assets/content/columns.php');
}
<?php
function Assets_NFTcontests_response_content ($params) {
	Q::event('Assets/NFTcontests/response/column', $params);
	return Q::view('Assets/content/columns.php');
}
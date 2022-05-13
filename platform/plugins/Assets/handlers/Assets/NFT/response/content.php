<?php
function Assets_NFT_response_content ($params) {
	Q::event('Assets/NFT/response/column', $params);
	return Q::view('Assets/content/columns.php');
}
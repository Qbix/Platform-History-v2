<?php
function Assets_NFTprofile_response_content ($params) {
	Q::event('Assets/NFTprofile/response/column', $params);
	return Q::view('Assets/content/columns.php');
}
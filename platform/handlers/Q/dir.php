<?php

/**
 * Default Q/dir handler.
 * Just displays a simple directory listing,
 * and prevents further processing by returning true.
 */
function Q_dir()
{
	$filename = Q_Request::filename();

	// TODO: show directory listing
	echo Q::view('Q/dir.php', @compact('filename'));
	
	return true;
}

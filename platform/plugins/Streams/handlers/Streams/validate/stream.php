<?php

function Streams_validate_stream($params)
{
	extract($params);
	switch ($stream->name) {
		case 'Streams/user/firstName':
		case 'Streams/user/lastName':
		case 'Streams/user/description':
			if (empty($stream->content) or strlen(trim($stream->content)) === 0) {
				throw new Q_Exception("Content can't be empty", 'content');
			}
			break;
	}
}

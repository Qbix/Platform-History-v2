<?php

function Websites_after_Streams_fetch_Websites_webpage($params, &$result)
{
	$streams = $params['streams'];
	if (!empty($params['options']['duringInternal'])) {
		return;
	}

	foreach ($streams as $streamName => $stream) {
		if (!$stream || $stream->type != "Websites/webpage") {
			continue;
		}
		// if interests undefined
		if (!$stream->getAttribute('interest')) {
			$stream->interest = Q::json_encode(Websites_Webpage::getInterests($stream));
		}

		// if keywords undefined
		if (!$stream->getAttribute('keywords')) {
			$keywords = Websites_Webpage::getKeywords($stream);

			$stream->keywords = '';
			if (is_array($keywords)) {
				foreach ($keywords as $keyword) {
					$stream->keywords .= $keyword->title.',';
				}
			}
		}
	}
}
<?php

function Websites_after_Streams_fetch_Websites_webpage($params)
{
	$streams = $params['streams'];

	foreach ($streams as $streamName => $stream) {
		// if interests undefined
		if (!$stream->getAttribute('interest')) {
			$streams[$streamName]->interest = Q::json_encode(Websites_Webpage::getInterests($stream));
		}

		// if keywords undefined
		if (!$stream->getAttribute('keywords')) {
			$keywords = Websites_Webpage::getKeywords($stream);

			$streams[$streamName]->keywords = '';
			if (is_array($keywords)) {
				foreach ($keywords as $keyword) {
					$streams[$streamName]->keywords .= $keyword->title.',';
				}
			}
		}
	}
}
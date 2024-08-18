<?php

function Assets_1_0_177_Streams_mysql()
{
    // forgot to do this in database migration script 1.0.175
    Streams::updateStreamNames(array(
        'Assets/category/credits' => 'Assets/category/credits'
    ), array(
        'publisherId' => 'Assets',
        'newPublisherId' => Users::communityId()
    ));

    // now, add relations
    echo "Adding relations for 'peak' attribute indexing".PHP_EOL;
    $i = 0;
    $offset = 0;
	while (1) {
		$streams = Streams_Stream::select()
            ->where(array('name' => new Db_Range('Assets/credits/', false, false, true)))
			->limit(100, $offset)
			->fetchDbRows();
		if (!$streams) {
			break;
		}
		foreach ($streams as $stream) {
            $peak = $stream->getAttribute('peak', null);
            if (!isset($peak)) {
                continue;
            }
            // set the peak to current amount, best we can do:
            $stream->updateRelations(array('firstTimeAddingAttributes' => array(
                'peak' => true
            )));
			++$i;
			echo "\033[100D";
			echo "Updated $i streams";
		}
		$offset += 100;
	};
	echo PHP_EOL;	
}

Assets_1_0_177_Streams_mysql();
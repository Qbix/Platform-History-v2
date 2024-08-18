<?php

function Assets_1_0_176_Streams_mysql()
{
    echo "Adding 'peak' attribute for Assets/credits streams".PHP_EOL;
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
            $amount = $stream->getAttribute('amount', null);
            if (!isset($amount)
             || $amount <= $stream->getAttribute('peak', 0)) {
                continue;
            }
            // set the peak to current amount, best we can do:
            $stream->setAttribute('peak', $amount);
			++$i;
			echo "\033[100D";
			echo "Updated $i streams";
		}
		$offset += 100;
	};
	echo PHP_EOL;	
}

Assets_1_0_176_Streams_mysql();
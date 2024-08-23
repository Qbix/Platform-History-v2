<?php

function Assets_after_Db_Row_Streams_Stream_insertManyAndExecute($params)
{
    // TODO: implement bulk actions.
    // For now, just execute existing functions 1 row at a time:
    foreach ($params['rows'] as $row) {
		Q::event("Db/Row/".get_class($row)."/saveExecute", compact("row"), 'after');
    }
}
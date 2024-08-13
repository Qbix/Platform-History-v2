<?php

function Assets_after_Db_Row_Streams_Stream_insertManyAndExecute($params)
{
    // TODO: implement bulk actions.
    // For now, just execute existing functions 1 row at a time:
    Q::includeFile("handlers/Assets/after/Streams_save.php");
    foreach ($params['rows'] as $row) {
        $p = array('stream' => $row);
        Assets_NFT_update_attributes_relations($p);
        Assets_grant_credits_for_filling_personal_streams($p);
        Assets_grant_credits_for_invited_users($p);
    }
}
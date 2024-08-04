<?php

function Assets_1_0_174_Streams()
{
    $communityId = Users::communityId();
    echo "Inserting Assets/credits access rows...".PHP_EOL;
    Streams_Access::insert(array(
        'publisherId', 'streamName', 'ofUserId',
        'ofContactLabel', 'ofParticipantRole',
        'readLevel', 'writeLevel', 'adminlevel'
    ))->select(array(
        new Db_Expression("'$communityId'"), 'name', 'publisherId',
        new Db_Expression("''"), new Db_Expression("''"),
        new Db_Expression(40), new Db_Expression(-1), new Db_Expression(20)
    ), Streams_Stream::table())->where(array(
        'name' => 'Assets/user/credits'
    ))->execute();
    echo "Renaming Assets/credits streams...".PHP_EOL;
    Streams::updateStreamNames(array(
        'Assets/user/credits' => new Db_Expression('CONCAT("Assets/credits/", {{publisherId}})')
    ), array(
        'newPublisherId' => Users::communityId()
    ));
}

Assets_1_0_174_Streams();
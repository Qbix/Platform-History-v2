<?php

function Assets_1_0_174_Streams()
{
    $communityId = Users::communityId();
    echo "Renaming Assets/credits streams";
    Streams_Access::insert(array(
        'publisherId', 'streamName', 'ofUserId',
        'ofContactLabel', 'ofParticipantRole',
        'readLevel'
    ))->select(array(
        new Db_Expression("'$communityId'"), 'name', 'publisherId',
        new Db_Expression("''"), new Db_Expression("''"),
        new Db_Expression("40")
    ), Streams_Stream::table())->where(array(
        'name' => 'Assets/user/credits'
    ))->execute();
    Streams::updateStreamNames(array(
        'Assets/user/credits' => new Db_Expression('CONCAT("Assets/credits/", {{publisherId}})')
    ), array(
        'newPublisherId' => Users::communityId()
    ));
}

Assets_1_0_174_Streams();
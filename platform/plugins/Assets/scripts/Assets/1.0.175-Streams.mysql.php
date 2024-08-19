<?php

function Assets_1_0_175()
{
    $communityId = Users::communityId();
    $offset = 0;
    echo "Creating Assets/category/credits relations for each user".PHP_EOL;
    $i = 0;
    while (1) {
        $users = Users_User::select()
            ->limit(100, $offset)
            ->fetchDbRows();
        if (!$users) {
            break;
        }
        foreach ($users as $user) {
            $stream = Streams_Stream::fetch($communityId, $communityId, "Assets/credits/" . $user->id);
            if (!$stream) {
                continue;
            }
            $stream->updateRelations(array('firstTimeAddingAttributes' => array(
                'amount' => true
            )));
            ++$i;
            echo "\033[100D";
            echo "Created $i relations";
        }
        $offset += 100;
    };
    echo PHP_EOL;
}

Assets_1_0_175();
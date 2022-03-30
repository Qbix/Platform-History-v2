<?php

function Users_after_Q_update_discourse_avatar($params, &$return)
{
    return Users_ExternalTo_Discourse::updateForumUserAvatar();
}

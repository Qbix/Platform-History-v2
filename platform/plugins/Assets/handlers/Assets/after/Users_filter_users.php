<?php

function Assets_after_Users_filter_users($params, &$result)
{
    
    $result = array_slice($result, 0, 2);
}
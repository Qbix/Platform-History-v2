<?php

function Broadcast_control_response_delete($params)
{
  $user = Users::loggedInUser(true);
  $agreement = new Broadcast_Agreement();
  $agreement->userId = $user->id;
  $agreement->publisherId = $_REQUEST['publisherId'];
  $agreement->streamName = 'Broadcast/main';
  $agreement->platform = 'facebook';
  $agreement->remove();
  return array('success' => 'true');
}

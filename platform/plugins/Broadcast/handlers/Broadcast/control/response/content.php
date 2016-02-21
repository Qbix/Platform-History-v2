<?php

function Broadcast_control_response_content($params)
{
  $user = Users::loggedInUser(true);
  
  $organizations = Broadcast_Agreement::select('a.userId, a.publisherId, u.organization_title, u.organization_domain', 'a')
      ->join(Broadcast_User::table().' u', array('a.publisherId' => 'u.userId'))
      ->where(array('a.userId' => $user->id))->fetchAll(PDO::FETCH_ASSOC);
  
  foreach ($organizations as $k => $org)
  {
    $messages = Streams_Message::select('content')
                                      ->where(array('publisherId' => $org['publisherId'], 'streamName' => 'Broadcast/main'))
                                      ->orderBy('sentTime')
                                      ->fetchAll(PDO::FETCH_ASSOC);
    $organizations[$k]['messages'] = array();
    foreach ($messages as $msg)
    {
      $content = json_decode($msg['content'], true);
      if (isset($content['link']))
      {
        $ch = curl_init();
        $timeout = 5;
        curl_setopt($ch, CURLOPT_URL, $content['link']);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $timeout);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (X11; U; Linux i686; cs-CZ; rv:1.7.12) Gecko/20050929");
        $page_contents = curl_exec($ch);
        curl_close($ch);
        preg_match('/<title>([^<]+)<\/title>/', $page_contents, $matches);
        if (isset($matches[1]))
          $content['link_title'] = $matches[1];
      }
      $organizations[$k]['messages'][] = $content;
    }
  }
  
	Q_Config::set('Q', 'response', 'Broadcast', 'layout_html', 'Broadcast/layout/canvas.php');
	Q_Response::addStylesheet('css/canvas.css');
	Q_Response::addScript('http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js');
	Q_Response::addScript('js/canvas.js');
	return Q::view('Broadcast/content/control.php', compact('organizations'));
}

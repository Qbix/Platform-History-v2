<?php

function Streams_description_response_data()
{
    Q_Request::requireFields(array('subject'), true);
    $subject = $_REQUEST['subject'];

    // check quota
    $asUserId = Users::loggedInUser(true)->id;
    $roles = Users::roles();
    $quota = Users_Quota::check($asUserId, '', "Streams/description", true, 1, $roles);
    
    $communityId = Users::communityId();
    $normalizedSubject = Q_Utils::normalize($subject);
    $streamName = "Streams/description/$normalizedSubject";
    $stream = Streams_Stream::fetch($communityId, $communityId, $streamName);
    if ($stream) {
        return $stream->content;
    }

    $LLM = new Streams_LLM_OpenAI();
    $completions = $LLM->chatCompletions(array(
        'system' => 'You are describing a specific item, object or concept',
        'user' => 'Please write a paragraph that describes ' . $subject . ' to a general audience.'
    ));
    $choices = Q::ifset($completions, 'choices', array());
    $quota->used();
    $content = '';
    foreach ($choices as $choice) {
        $content = $choice['message']['content'];
    }
    $title = "Description of $subject";
    Streams::create($communityId, $communityId, $streamName, array(
        'fields' => compact('title', 'content')
    ));
    $stream->save();
    return $content;
}
<?php

function Streams_discourse_post()
{
    $authorized = Q_Config::get('Users', 'discourse', 'requireAuthorizedRole', false);
    if ($authorized && !Users::roles(null, $authorized)) {
        throw new Users_Exception_NotAuthorized();
    }
    Q_Request::requireFields(array('userId', 'apiKey', 'topicUrl', 'attitude'), true);
    $userId = $_REQUEST['userId'];
    $topicUrl = $_REQUEST['topicUrl'];
    $apiKey = $_REQUEST['apiKey'];
    $attitude = $_REQUEST['attitude'];
    if ($language = Q::ifset($_REQUEST, 'language', '')) {
        $info = Q_Text::languagesInfo();
        $languageName = Q::ifset($info, $language, 'name', 'en');
    } else {
        $languageName = '';
    }

    $parts = explode('?', $topicUrl);
    $topicUrl = reset($parts);
    if (!preg_match('/(.*)(\/t\/)(.*)/', $topicUrl, $matches)) {
        throw new Q_Exception_WrongType(array(
            'field' => 'topicUrl',
            'type' => 'a valid Discourse topic URL'
        ));
    }
    $baseUrl = $matches[1];
    $tail = $matches[3];
    if (preg_match('/(.*)\/(.*)\/(.*)/', $tail, $matches)) {
        $topicId = $matches[1];
        $replyToPostIndex = intval($matches[3]) - 1;
    } else {
        $topicId = $tail;
        $replyToPostIndex = 0;
    }

    // create a user if one isn't already there
    Q::event('Users/discourse/post', compact('baseUrl'));

    // get the topic contents
    $uxt = (new Users_ExternalTo_Discourse(array(
        'userId' => $userId,
        'platform' => 'discourse',
        'appId' => $baseUrl
    )))->retrieve();
    $uxt->setExtra(compact('baseUrl', 'apiKey'));
    $ret = $uxt->getTopic($topicUrl);
    $input = substr($ret['post_stream']['posts'][$replyToPostIndex]['cooked'], 0, 1000);
    $topicTitle = $ret['title'];
    $username = $uxt->getExtra('username');

    $languageClause = $languageName
        ? "Speak using $languageName language"
        : 'Speak in the same language as the post';
    
    // generate text completion using gpt-3.5-turbo
    // (currently 10x cheaper than gpt-3)
    $LLM = new Streams_LLM_OpenAI();
    $instructions = array(
        'agree + actionable' => "What follows is HTML of a post. Write one or two paragraphs expressing agreement with the post, without explicitly saying the words 'I agree'. Add interesting insights or ideas that can accomplish what is being discussed. The post: " . "\n" . $input,
        'agree + emotive' => "What follows is HTML of a post. Write one paragraph expressing agreement with the post. Be enthusiastic and express emotion about the subject.\n$languageClause\nThe post:\n" . $input,
        'agree + expand' => "What follows is HTML of a post. Write one sentence expressing general agreement (avoiding saying 'I agree'), but then two paragraphs discusing a much larger and more important vision everyone should consider.\n$languageClause\nThe post:\n" . $input,
        'agree + changeSubject' => "What follows is HTML of a post. Write one sentence expressing general agreement (avoiding saying 'I agree'), but then two paragraphs discusing a related but different issue, and explain why it is more important. The post:\n" . $input,
        'disagree + respectful' => "What follows is HTML of a post. Write two sentences explaining the best reasons to disagree with this post. Be very respectful but thorough.\n$languageClause\nThe post:\n" . $input,
        'disagree + emotive' => "What follows is HTML of a post. Write two sentences explaining the best reasons to disagree with this post. Use spunky and emotional language, and be opinionated, citing well known aphorisms.\n$languageClause\nThe post:\n" . $input,
        'disagree + absurd' => "What follows is HTML of a post. Write a paragraph in the style of an internet forum, disagreeing with it, by using sarcastic examples and analogies that show why what is being advocated can actually be absurd. Avoid overly formal language and structure, speak plainly and to the point.\n$languageClause\nThe post:\n" . $input,
        'disagree + authority' => "What follows is HTML of a post. Write a single paragraph mildly disagreeing with it (without saying 'mildly disagree'), and naming other important authorities on the subject who also disagree, who haven't been mentioned yet, and summarizing their points. Avoid overly formal language and structure, speak plainly and to the point.\n$languageClause\nThe post:\n" . $input
    );

    // $messages = array(
    //     'system' => 'You are a forum member commenting.',
    //     'user' => $instructions[$attitude]
    // );
    // $completions = $LLM->chatCompletions($messages);
    // $choices = Q::ifset($completions, 'choices', array());
    // foreach ($choices as $choice) {
    //     $content = $choice['message']['content'];
    //     break;
    // }

    // // post to the forum
    // $result = $uxt->postOnTopic($ret['id'], $content);
    // $postIndex = Q::ifset($result, 'post_number', null);
    // if (isset($postIndex)) {
    //     --$postIndex;
    // }

    // save the result
    $appId = Q::app();
    $communityId = Users::communityId();
    $categoryName = 'Streams/external/posts';
    Streams_Stream::fetchOrCreate($communityId, $communityId, $categoryName, array(
        'type' => 'Streams/category'
    ));
    Streams::create($communityId, $communityId, 'Streams/external/post', array(
        'title' => "By $username on $topicTitle",
        'content' => substr($content, 0, 2000),
        'attributes' => compact('topicUrl', 'topicTitle', 'topicId', 'replyToPostIndex', 'postIndex', 'username', 'userId')
    ), array(
        'publisherId' => $communityId,
        'streamName' => $categoryName,
        'type' => 'Streams/external/posts',
        'weight' => time()
    ));

    $username = $uxt->getExtra('username');
    Q_Response::setSlot('data', compact('username', 'content'));
}
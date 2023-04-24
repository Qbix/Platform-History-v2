<?php

class Streams_LLM_OpenAI extends Streams_LLM implements Streams_LLM_Interface
{
    /**
     * @method chatCompletions
     * @param {array} messages An array of role => content, where role can be "system", "user", "assistant"
     */
    function chatCompletions(array $messages) {
        $apiKey = Q_Config::expect('Streams', 'openAI', 'key');
        $headers = array(
            "Content-Type: application/json",
            "Authorization: Bearer $apiKey"
        );
        $m = array();
        foreach ($messages as $role => $content) {
            $m[] = compact('role', 'content');
        }
        $payload = array(
            "model" => "gpt-3.5-turbo",
            "max_tokens" => 3000,
            "temperature" => 0.9,
            "n" => 1,
            "presence_penalty" => 2,
            "frequency_penalty" => 2,
            "messages" => $m
        );
        $json = Q_Utils::post('https://api.openai.com/v1/chat/completions', $payload, null, null, $headers);
        return json_decode($json, true);
    }
    
}
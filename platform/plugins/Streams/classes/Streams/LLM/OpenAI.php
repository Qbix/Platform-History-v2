<?php

class Streams_LLM_OpenAI extends Streams_LLM implements Streams_LLM_Interface
{
    /**
     * @method chatCompletions
     * @param {array} messages An array of role => content, where role can be "system", "user", "assistant"
     * @param {array} $options
     * @param {string} [$model="gpt-3.5-turbo"] You can override which chat model to use
     * @param {integer} [$max_tokens=3000] Maximum number of tokens to return
     * @param {integer} [$temperature=0.9] How many results to return
     * @param {integer} [$numResults=1] How many results to return
     * @param {integer} [$presencePenalty=2]
     * @param {integer} [$frequencyPenalty=2]
     * @return {array} Contains "errors" or "choices" keys
     */
    function chatCompletions(array $messages, $options = array()) {
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
            "model" =>Q::ifset($options, 'numResults', "gpt-3.5-turbo"),
            "max_tokens" => Q::ifset($options, 'numResults', 3000),
            "temperature" => Q::ifset($options, 'numResults', 0.9),
            "n" => Q::ifset($options, 'numResults', 1),
            "presence_penalty" => 2,
            "frequency_penalty" => 2,
            "messages" => $m
        );
        $json = Q_Utils::post('https://api.openai.com/v1/chat/completions', $payload, null, null, $headers);
        return json_decode($json, true);
    }
    
}
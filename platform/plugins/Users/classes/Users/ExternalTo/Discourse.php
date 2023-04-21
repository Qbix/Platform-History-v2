<?php

/**
 * @module Users
 */

/**
 *
 *
 * @class Users_ExternalTo_Discourse
 * @extends Users_ExternalTo
 */
class Users_ExternalTo_Discourse extends Users_ExternalTo implements Users_ExternalTo_Interface
{
	protected $apiKey = null;
	protected $baseUrl = null;
    protected $apiUsername = null;

	protected function _loadConfig () {
        // list($appId, $appInfo) = Users::appInfo($this->platform, $this->appId);
        if ($apiKey = $this->getExtra('apiKey')) {
            $this->apiKey = $apiKey;
        }
        if ($baseUrl = $this->getExtra('baseUrl')) {
            $this->baseUrl = $baseUrl;
        }
		$this->apiUsername = 'system';
        if (empty($this->apiKey)) {
            list($appId, $appInfo) = Users::appInfo($this->platform, $this->appId);
            if (empty($appInfo)) {
                throw new Q_Exception_MissingConfig(array(
                    'fieldpath' => 'Users/apps/'.$this->platform.'/'.$this->appId.'/keys/users'
                ));
            }
            $this->apiKey = $appInfo['keys']['users'];
            $this->baseUrl = $appInfo['baseUrl'];
        }
	}

    /**
     * @method getTopic
     * @param {string} $source Can be the URL of a topic, or a topic ID
     * @return {array}
     */
    public function getTopic($source)
    {
        $this->_loadConfig();
        $url = Q_Valid::url($source) ? $source : $this->baseUrl."t/$source.json";
        if (substr($url, -5) !== '.json') {
            $url .= '.json';
        }
        $headers = array(
            "Api-Key: ".$this->apiKey,
            "Api-Username: ".$this->getExtra('username', 'system')
        );
        $json = Q_Utils::get($url, null, null, $headers);
        return json_decode($json, true);
    }

    /**
     * @method postOnTopic
     * @param {string} $topicId If you don't have it, call getTopic() and then fetch "id"
     * @param {string} $content The raw content that the person would have typed (in markdown)
     * @return {array}
     */
    public function postOnTopic($topicId, $content)
    {
        $this->_loadConfig();
        $url = $this->baseUrl."/posts.json";
        $username = $this->getExtra('username');
        if (!$username) {
            throw new Q_Exception_MissingObject(array('name' => 'username'));
        }
        $headers = array(
            "Api-Key: ".$this->apiKey,
            "Api-Username: ".$username
        );
        $data = array(
            'topic_id' => $topicId,
            'raw' => $content
        );
        return Q_Utils::post($url, $data, null, null, $headers);
    }

    /**
     * Creates or updates a user in the Discourse forum
     * corresponding to this Users_ExternalTo row
     * @method create
     * @return {array}
     */
    public function create()
    {
        $this->_loadConfig();
        $user = Users::fetch($this->userId, true);

        // SECURITY: don't save api key to any request logs!
        $url = sprintf("%s/users", $this->baseUrl);
        $defaultEmailAddress = Q::interpolate(
            Q_Config::get('Users', 'bots', 'defaults', 'email', ''),
            array('random' => Q_Utils::randomHexString(8))
        );
        $displayName = $user->displayName();
        $email = isset($user->emailAddress) ? $user->emailAddress : $defaultEmailAddress;
        $password = Q_Utils::randomHexString(16);
        $username = (!empty($user->username) ? $user->username : Q_Utils::normalize($displayName));
        $fields = array(
            'name' => $displayName,
            'email' => $email,
            'password' => $password,
            'username' => $username,
            'active' => true,
            'approved' => true
        );
        $headers = array(
            "Api-Key: ".$this->apiKey,
            "Api-Username: system"
        );

        $response = Q_Utils::get($this->baseUrl."/u/$username.json", null, null, $headers);
        $result = json_decode($response);
        if (Q::ifset($result, 'error_type', null) !== 'not_found') {
            $user_id = Q::ifset($result, 'user', 'id', null);
            $registered = false;
        } else {
            $response = Q_Utils::post($url, $fields, null,null, $headers);
            $result = json_decode($response);
            $user_id = Q::ifset($result, 'user_id', null);
            if ($result) {
                $registered = true;
            }
            // // try up to 10 times with different usernames
            // for ($i = 0; !$success && $i < 10; ++$i) {
            //     $errorMessage = strtolower(Q::ifset($result, 'message', ''));
            //     if (Q::startsWith(strtolower($errorMessage), 'username must be unique')) {
            //         $parts = explode("_", $username);
            //         if (count($parts) > 1 && is_numeric(end($parts))) {
            //             $parts[count($parts)-1] += 1;
            //             $fields['username'] = implode("_", $parts);
            //         } else {
            //             $fields['username'] .= '_' . rand()%1000;
            //         }
            //     }
            //     $response = Q_Utils::post($url, $fields, null,null, $headers);
            //     $result = json_decode($response);
            //     $success = Q::ifset($result, 'success', false);
            //     $user_id = Q::ifset($result, 'user_id', null);
            // }
        }

        $text = Q_Text::get('Users/content');
        Q_Utils::put($this->baseUrl."/u/$username.json", array(
            'title' => Q::ifset($text, 'external', 'defaults', 'title', ''),
            'bio_raw' => Q::ifset($text, 'external', 'defaults', 'bio', ''),
            'website' => Q::ifset($text, 'external', 'defaults', 'website', 'https://engageusers.ai')
        ), null, null, $headers);
        
        $url = sprintf("%s/admin/users/%d/trust_level", $this->baseUrl, $user_id);
        $response = Q_Utils::put($url, array(
            'level' => 3
        ), null,null, $headers);

        $this->setExtra('user_id', $user_id);
        $this->setExtra('username', $fields['username']);
        $this->clearExtra('apiKey'); // shouldn't save it in the database
        $this->save(true);

        if ($registered) {
            $this->updateAvatar();
        }
    }

    function updateAvatar()
    {
        self::_loadConfig();
        $user_id = $this->getExtra('user_id');
        $username = $this->getExtra('username');
        Q_Valid::requireFields(
            array('user_id', 'username'),
            compact('user_id', 'username'), 
            true
        );

        $user = Users::fetch($this->userId, true);
        $avatarUrl = $user->iconUrl('400.png');
        $baseUrl = Q_Request::baseUrl();
        $app = Q::app();
        $head = APP_FILES_DIR.DS.$app.DS.'uploads';
        $tail = str_replace($baseUrl . '/Q/uploads/', DS, $avatarUrl);
        $filename = $head . $tail;
        if (!file_exists($filename)) {
            throw new Q_Exception_MissingFile(compact('filename'));
        }

        $imageInfo = getimagesize($filename);
        $cfile = curl_file_create($filename, $imageInfo['mime'], basename($filename));

        $uploadsUrl = sprintf("%s/uploads.json", $this->baseUrl);

        $fields = array(
            'type' => 'avatar',
            'user_id' => $user_id,
            'files[]' => $cfile,
            'synchronous' => true
        );

        // SECURITY: don't save api key to any request logs
        $headers = array(
            "Api-Key: ".$this->apiKey,
            "Api-Username: ".$username,
            "Content-Type: multipart/form-data"
        );

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $uploadsUrl);
        curl_setopt($ch, CURLOPT_HTTPHEADER,$headers);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $fields);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
        $response = curl_exec($ch);
        curl_close($ch);
        $result = json_decode($response);
        // Q::log('RESULT', 'discourse');
        // Q::log(print_r($result, true), 'discourse');

        $uploadId = Q::ifset($result, 'id', null);

        if($uploadId) {
            $updateAvatarUrl = sprintf("%s/u/%s/preferences/avatar/pick.json", $this->baseUrl, $username);

            $data = array(
                'upload_id' => $uploadId,
                'type' => 'uploaded'
            );

            array_pop($headers);
            // $headers[2] = 'Content-Type: application/json';
            $response = Q_Utils::put($updateAvatarUrl, $data, null, null, $headers);
        }
    }

    function logout($userId) {
        self::_loadConfig();
        Q_Utils::post($this->baseUrl . "/admin/users/$userId/log_out", array(), null, array(
            'Content-Type' => 'multipart/form-data',
            'Api-Key' => $this->apiKey,
            'Api-Username' => 'system'
        ));
    }

    function fetchXids(array $roleIds, array $options = array())
    {
        return array();
    }
}
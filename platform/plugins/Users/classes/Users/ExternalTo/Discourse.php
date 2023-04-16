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
	protected $apiHost = null;
	protected $apiUsername = null;

	protected function _loadConfig () {
        list($appId, $appInfo) = Users::appInfo($this->platform, $this->appId);
		$this->apiKey = $appInfo['keys']['users'];
		$this->apiHost = $appInfo['url'];
		$this->apiUsername = 'system';
	}

    public function create()
    {
        $this->_loadConfig();
        $user = Users::fetch($this->userId, true);

        // SECURITY: don't save api key to any request logs!
        $url = sprintf("%s/users", $this->apiHost);
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
            "Api-Username: ".$this->apiUsername
        );

        // Q_Utils::put($this->apiHost."/u/$username.json", array(
        //     'title' => 'Forum Engagement Bot',
        //     'bio_raw' => 'Powered by https://engageusers.ai',
        //     'website' => 'https://engageusers.ai'
        // ), null, null, $headers);

        $response = Q_Utils::get($this->apiHost."/u/$username.json", null, null, $headers);
        $result = json_decode($response);
        if (Q::ifset($result, 'error_type', null) !== 'not_found') {
            $user_id = Q::ifset($result, 'user', 'id', null);
        } else {
            $response = Q_Utils::post($url, $fields, null,null, $headers);
            $result = json_decode($response);
            $user_id = Q::ifset($result, 'user_id', null);
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
        
        $url = sprintf("%s/admin/users/%d/trust_level", $this->apiHost, $user_id);
        $response = Q_Utils::put($url, array(
            'level' => 3
        ), null,null, $headers);

        $this->setExtra('user_id', $user_id);
        $this->setExtra('username', $fields['username']);
        $this->save(true);

        $this->updateAvatar();
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

        $uploadsUrl = sprintf("%s/uploads.json", $this->apiHost);

        $fields = array(
            'type' => 'avatar',
            'user_id' => $user_id,
            'files[]' => $cfile,
            'synchronous' => true
        );

        // SECURITY: don't save api key to any request logs
        $headers = array(
            "Api-Key: ".$this->apiKey,
            "Api-Username: ".$this->apiUsername,
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
            $updateAvatarUrl = sprintf("%s/u/%s/preferences/avatar/pick.json", $this->apiHost, $username);

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
        Q_Utils::post($this->apiHost . "/admin/users/$userId/log_out", array(), null, array(
            'Content-Type' => 'multipart/form-data',
            'Api-Key' => $this->apiKey,
            'Api-Username' => $this->apiUsername
        ));
    }

    function fetchXids(array $roleIds, array $options = array())
    {
        return array();
    }
}
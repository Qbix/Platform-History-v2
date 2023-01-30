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
	protected static $apiKey = null;
	protected static $apiHost = null;
	protected static $apiUsername = null;

	protected static function _contract () {
		self::$apiKey = Q_Config::get("Discourse", "API", "key", null);
		self::$apiHost = Q_Config::get("Discourse", "API", "host", null);
		self::$apiUsername = Q_Config::get("Discourse", "API", "username", null);
	}
    public static function createForumUser ($name, $email, $password, $platformId) {
		    self::_contract();

        // don't save api key to logs
        $url = sprintf("%s/users", self::$apiHost);

        $fields = array(
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'username' => Q_Utils::normalize($name),
            'active' => true,
            'approved' => true
        );
        Q::log("Request to ".$url, "discourse");
        $f = $fields; $f['password'] = '***';
        Q::log(print_r($f, true), "discourse");

        $headers = array(
            "Api-Key: ".self::$apiKey,
            "Api-Username: ".self::$apiUsername
        );

        $result = Q_Utils::post($url, $fields, null,null, $headers);

        $result = json_decode($result);
        $success = Q::ifset($result, 'success', false);
        $userId = Q::ifset($result, 'user_id', null);

        Q::log('RESULT', 'discourse');
        Q::log($result, 'discourse');

        // errors handle
        if (!$success) {
            $errorMessage = strtolower(Q::ifset($result, 'message', null));

            if (Q::startsWith(strtolower($errorMessage), 'username must be unique')) {
                // trying to unique username
                $parts = explode("_", $name);
                if (count($parts) > 1 && is_numeric(end($parts))) {
                    $parts[count($parts)-1] += 1;
                    $name = implode("_", $parts);
                } else {
                    $name .= rand()%100;
                }

                self::createForumUser($name, $email, $password, $platformId);
            }

            return Q::log($result, "discourse");
        }
        // if user registered, try to deactivate and activate
        // this trick need to approve email (https://meta.discourse.org/t/api-to-create-a-user-without-sending-out-activation-email/23432/9)
        if ($userId) {
            $deactivateUrl = sprintf("%s/admin/users/%s/deactivate.json", self::$apiHost, $userId);
            $activateUrl = sprintf("%s/admin/users/%s/activate.json", self::$apiHost ,$userId);

            $data = array(
                'api_key' => self::$apiKey,
                'api_username' => self::$apiUsername
            );

            // deactivate user
            Q_Utils::put($deactivateUrl, $data);

            // activate user
            Q_Utils::put($activateUrl, $data);

            Q::log("DATA", 'discourse');
            Q::log($data, 'discourse');
        }

        if($userId && $name) {
            $stream = Streams::create($platformId, $platformId, 'Streams/users', array(
                'name' => 'Streams/user/discourse'
            ));
            $stream->setAttribute("username", $name);
            $stream->setAttribute("userId", $userId);
            $stream->save();

            self::updateForumUserAvatar();
        }

        Q::log($result, "discourse");
    }

    public static function updateForumUserAvatar() {
		    self::_contract();

        $qbixUserId = Users::loggedInUser(true)->id;
        $stream = Streams_Stream::fetch($qbixUserId, $qbixUserId, 'Streams/user/discourse');

        if(!$stream) {
            return;
        }

        $discourseUserId = $stream->getAttribute("userId");
        $discourseUsername = $stream->getAttribute("username");

        if(empty($discourseUserId) || empty($discourseUsername)) {
            return;
        }

        $usersAvatar = new Streams_Avatar();
        $usersAvatar->toUserId = '';
        $usersAvatar->publisherId = $qbixUserId;
        $usersAvatar->retrieve();
        $avatarUrl = Q_Uri::interpolateUrl($usersAvatar->fields['icon']) . '/400.png';
        $baseUrl = Q_Request::baseUrl();
        $app = Q::app();
        $head = APP_FILES_DIR.DS.$app.DS.'uploads';
        $tail = str_replace($baseUrl . '/Q/uploads/', DS, $avatarUrl);
        $imagePath = $head . $tail;
        if (!file_exists($imagePath)) {
            Q::log("File doesn't exist: ".$imagePath, "discourse");
            return;
        }

        $imageInfo = getimagesize($imagePath);
        $cfile = curl_file_create($imagePath, $imageInfo['mime'], basename($imagePath));

        $uploadsUrl = sprintf("%s/uploads.json", self::$apiHost);

        $fields = array(
            'type' => 'avatar',
            'user_id' => $discourseUserId,
            'files[]' => $cfile,
            'synchronous' => true
        );
        Q::log("Request to ".$uploadsUrl, "discourse");
        Q::log(print_r($fields, true), "discourse");

        // don't save api key to logs
        $headers = array(
            "Api-Key: ".self::$apiKey,
            "Api-Username: ".self::$apiUsername,
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
        Q::log('RESULT', 'discourse');
        Q::log(print_r($result, true), 'discourse');

        $uploadId = Q::ifset($result, 'id', null);

        if($uploadId) {
            $updateAvatarUrl = sprintf("%s/u/%s/preferences/avatar/pick.json", self::$apiHost, $discourseUsername);

            $data = array(
                'upload_id' => $uploadId,
                'type' => 'uploaded'
            );

            Q_Utils::put($updateAvatarUrl, $data, null, null, $headers);
        }
    }

    function fetchXids(array $roleIds, array $options = array())
    {
        return array();
    }
}
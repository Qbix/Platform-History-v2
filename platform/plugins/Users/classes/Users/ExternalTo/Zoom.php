<?php

/**
 * @module Users
 */

/**
 * Class representing Zoom app user.
 *
 * @class Users_ExternalTo_Zoom
 * @extends Users_ExternalTo
 */
class Users_ExternalTo_Zoom extends Users_ExternalTo implements Users_ExternalTo_Interface
{
	function refreshToken()
	{
		$token = $this->getExtra('refreshToken');
		if (!$token) {
			throw new Q_Exception_MissingObject(array('name' => 'refreshToken'));
		}
		$info = Users::appInfo($this->platform, $this->appId, true);
		$params = array(
			'grant_type' => 'refresh_token',
			'refresh_token' => $token,
			'platform' => $info['platform'],
			'client_id' => $this['appId']
		);
		$basic = base64_encode($info['appId'].':'.$info['secret']);
		$response = Q_Utils::post($tokenUri, $params, null, array(), array(
			'Authorization' => "Basic $basic"
		));
		$data = Q::json_decode($response, true);
		$this->processPlatformResponse($data);
	}
}
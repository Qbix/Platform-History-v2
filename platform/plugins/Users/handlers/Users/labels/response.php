<?php

/**
 * @module Users
 */

function Users_labels_response($params = array())
{
    header("Content-type: application/json");
    
    $uri = Q_Dispatcher::uri();
    
    $userId = $uri->userId;
    $chainId = $uri->chainId;
    $roleId = $uri->roleId;
    
    // make hex if integer present
    $chainId = (substr($chainId, 0, 2) === '0x') ? $chainId : '0x' . dechex($chainId);

    $label = '<<< web3_'.$chainId.'/'.$roleId;
    
    $l = new Users_Label();
    $l->label = $label;
    $l->userId = $userId;

    $res = $l->retrieve();
    
    if (!$res) {
        echo json_encode(array());
    } else {
        
        if ($res->icon == Q_Config::get('Users', 'icon', 'labels', 'labels/default')) {
            //Q.url("{{Users}}/img/icons/default/200.png");
            $img = Users::iconUrl('default', "200.png");
        } else {
            $img = Users::iconUrl($res->icon, "200.png");
        }
        echo json_encode(array(
            'image' => $img,
            'name' => $res->title
        ));
    }
        
    return false;
}

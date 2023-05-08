<?php

function Users_contractMetadata_response()
{
    header("Content-type: application/json");
    
    $uri = Q_Dispatcher::uri();
    $communityId = $uri->communityId;
    $user = Users::fetch($communityId, true);
    
    echo json_encode(array(
	"communityId"=> $communityId
    ));
    
    return false;
}
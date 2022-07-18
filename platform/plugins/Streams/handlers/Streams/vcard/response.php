<?php
function Streams_vcard_response ($params) {
    $uesrId = Q_Dispatcher::uri()->userId;
    $communityName = Users::communityName();
    $communityId = Users::communityId();

    $vcr = "BEGIN:VCARD\n";
    $vcr .= "VERSION:3.0\n";

    $user = Users::fetch($uesrId, true);
    $fn = $user->displayName();
    $vcr .= "FN:$fn\n";

    $firstNameStream = Streams::fetchOne(null, $user->id, "Streams/user/firstName");
    $lastNameStream = Streams::fetchOne(null, $user->id, "Streams/user/lastName");
    $firstName = $firstNameStream->fields['content'];
    $lastName = $lastNameStream->fields['content'];
    if(!empty($firstName) && !empty($lastName) ){
        $firstNameStream->calculateAccess($user->id);
        $lastNameStream->calculateAccess($user->id);
        if ($lastNameStream->testReadLevel('content') && $firstNameStream->testReadLevel('content')) {
            $vcr .= "N:$lastName;$firstName;;;\n";
        }

    }

    $userUrl = Q_Uri::interpolateUrl("{{baseUrl}}/profile/$user->id");
    $vcr .= "item1.URL:$userUrl\n";
    $vcr .= "item1.X-ABLABEL: My Profile\n";

    $photo = Q_Uri::interpolateUrl($user->icon.'/400.png');
    $type = pathinfo($photo, PATHINFO_EXTENSION);
    $data = file_get_contents($photo);
    $base64 = base64_encode($data);
    //$vcr .= "PHOTO;MEDIATYPE=image/png:$photo\n";
    //$vcr .= "PHOTO;TYPE=PNG;VALUE=URI:$photo\n";
    //$vcr .= "PHOTO;PNG;$photo\n";
    //$vcr .= "PHOTO;$type;ENCODING=BASE64:$base64\n"; //v 3.0
    $vcr .= "PHOTO;ENCODING=BASE64;$type:$base64\n";

    $nickname = $user->username;
    if(!empty($nickname)){
        $vcr .= "NICKNAME:$nickname\n";
    }

    $emailAddress = !empty($user->emailAddress) ? $user->emailAddress : $user->emailAddressPending;
    if(!empty($emailAddress)){
        $vcr .= "EMAIL:$emailAddress\n";
    }

    $telNumber = $user->mobileNumber;
    if(!empty($telNumber)){
        $vcr .= "TEL;TYPE=cell:$telNumber\n";
    }

    $greetingStream = Streams::fetchOne(null, $user->id, "Streams/greeting/" . $communityName);
    if($greetingStream) {

        $greetingStream->calculateAccess($user->id);
        if ($greetingStream->testReadLevel('content')) {
            $note = preg_replace("/\n/m", "\\n", $greetingStream->fields['content']);

            if(!empty($note)){
                $vcr .= "NOTE:$note\n";
            }
        }
    }

    $genderStream = Streams::fetchOne(null, $user->id, "Streams/user/gender");
    if($genderStream) {
        $genderStream->calculateAccess($user->id);
        if ($genderStream->testReadLevel('content')) {
            $gender = $genderStream->fields['content'];
            if(!empty($gender)){
                $vcr .= "GENDER:$gender\n";
            }
        }
    }

    $birthdayStream = Streams::fetchOne(null, $user->id, "Streams/user/birthday");
    if($birthdayStream) {
        $birthdayStream->calculateAccess($user->id);
        if ($birthdayStream->testReadLevel('content')) {
            $birthday = $birthdayStream->fields['content'];
            if(!empty($birthday)){
                $vcr .= "BDAY:" . date('Ymd', strtotime($birthday)) . "\n";
            }        }
    }

    $org = $communityName;
    if(!empty($org)){
        $vcr .= "ORG:$org\n";
    }

    $userCommunityRoles = Users::roles($communityId, null, array(), $user->id);
    $rolesArr = [];
    foreach ($userCommunityRoles as $key => $value) {
        $rolesArr[] = $key;
    }
    if(count($rolesArr) != 0) {
        $roles = implode(', ', $rolesArr);
        $vcr .= "ROLE:$roles\n";
    }

    $adrStream = Streams::fetchOne(null, $user->id, "Places/user/location/home");
    if($adrStream) {
        $adrStream->calculateAccess($user->id);
        if ($adrStream->testReadLevel('content')) {
            $adress = $adrStream->getAttribute('address');
            if(!empty($adress)){
                $vcr .= "ADR;TYPE=HOME;LABEL=\"$adress\":;;\n";
            }
        }
    }

    $locationStream = Streams::fetchOne(null, $user->id, "Places/user/location");
    if($locationStream) {
        $locationStream->calculateAccess($user->id);
        if ($locationStream->testReadLevel('content')) {
            $geolocLatitude = $locationStream->getAttribute('latitude');
            $geolocLongitude = $locationStream->getAttribute('longitude');
            if(!empty($geolocLatitude) && !empty($geolocLongitude)) {
                $vcr .= "GEO:$geolocLatitude;$geolocLongitude\n";
            }
        }
    }

    $linkedinStream = Streams::fetchOne(null, $user->id, "Streams/user/linkedin");
    if($linkedinStream) {
        $linkedinStream->calculateAccess($user->id);
        if ($linkedinStream->testReadLevel('content')) {
            $linkedinName = $linkedinStream->fields['content'];
            if(!empty($linkedinName)){
                $vcr .= "item2.URL:https://www.linkedin.com/in/$linkedinName\n";
                $vcr .= "item2.X-ABLABEL: My Linkedin\n";
            }
        }
    }

    $facebookStream = Streams::fetchOne(null, $user->id, "Streams/user/facebook");
    if($facebookStream) {
        $facebookStream->calculateAccess($user->id);
        if ($facebookStream->testReadLevel('content')) {
            $fbProfile = $facebookStream->fields['content'];
            if(!empty($fbProfile)){
                $vcr .= "item3.URL:https://www.facebook.com/profile.php?id=$fbProfile\n";
                $vcr .= "item3.X-ABLABEL: My Facebook\n";
            }
        }
    }

    $twitterStream = Streams::fetchOne(null, $user->id, "Streams/user/twitter");
    if($twitterStream) {
        $twitterStream->calculateAccess($user->id);
        if ($twitterStream->testReadLevel('content')) {
            $twitterName = $twitterStream->fields['content'];
            if(!empty($twitterName)){
                $vcr .= "item4.URL:https://twitter.com/$twitterName\n";
                $vcr .= "item4.X-ABLABEL: My Twitter\n";
            }
        }
    }

    $instagramStream = Streams::fetchOne(null, $user->id, "Streams/user/instagram");
    if($instagramStream) {
        $instagramStream->calculateAccess($user->id);
        if ($instagramStream->testReadLevel('content')) {
            $instagramName = $instagramStream->fields['content'];
            if(!empty($instagramName)){
                $vcr .= "item5.URL:https://instagram.com/$instagramName\n";
                $vcr .= "item5.X-ABLABEL: My Instagram\n";
            }
        }
    }

    $lang = $user->fields['preferredLanguage'];
    if(!empty($lang)){
        $vcr .= "LANG:$lang\n";
    }

    //$vcr .="REV:20080424T195243Z\n";
    $vcr .="END:VCARD\n";
    $vcr .="VCR;";


    header('Content-type: text/vcard; charset=utf-8');
    header('Content-Disposition: inline; filename=' . $uesrId . '.vcf');
    echo Q_Utils::lineBreaks($vcr);
    exit;

}
<?php

function Streams_participating_response_content()
{
	$user = Users::loggedInUser(true);
	$loggedUserId = $user->id;
	$dbStreams = Db::connect('Streams');
	$participants = $dbStreams->rawQuery("select srt.*, sp.state, sp.subscribed, sp.streamType, sp.publisherId, ss.name, ss.title, ss.icon from 
	streams_related_to srt, streams_participant sp, streams_stream ss 
	where srt.toPublisherId='".$loggedUserId."' and srt.toStreamname='Streams/participating'
	and sp.publisherId=srt.fromPublisherId and sp.streamName=srt.fromStreamName and sp.userId='".$loggedUserId."'
	and ss.name=srt.fromStreamName and ss.publisherId=srt.fromPublisherId
	order by sp.subscribed")->fetchDbRows();

	$skipOwnStreams = Q_Config::get('Streams', 'participating', 'skipOwnStreams', true);

	// group by stream type
	$participantsGrouped = array();
	foreach($participants as $participant) {
		if ($skipOwnStreams && $participant->publisherId == $loggedUserId) {
			continue;
		}

		if (!is_array($participantsGrouped[$participant->streamType])) {
			$participantsGrouped[$participant->streamType] = array();
		}

		$checked = $participant->subscribed == 'yes' ? 'true' : 'false';

		$iconUrl = Streams::iconUrl($participant, '40.png');

		$participantsGrouped[$participant->streamType][] = Q::view("Streams/content/participatingItem.php",
			@compact('participant', 'iconUrl', 'checked')
		);
	}

	Q_Response::addStylesheet("{{Streams}}/css/pages/participants.css");
	Q_Response::addScript("{{Streams}}/js/pages/participants.js");

	$emailSubscribed = Users_Email::select()->where(array(
		'userId' => $loggedUserId,
		'address' => $user->emailAddress
	))->fetchDbRow();
	$emailSubscribed = Q::ifset($emailSubscribed, 'state', null) == 'active';

	$mobileSubscribed = Users_Mobile::select()->where(array(
		'userId' => $loggedUserId,
		'number' => $user->mobileNumber
	))->fetchDbRow();
	$mobileSubscribed = Q::ifset($mobileSubscribed, 'state', null) == 'active';

	$devices = Users_Device::select()->where(array('userId' => $loggedUserId))->fetchDbRows();
	$devicesGrouped = array();
	foreach($devices as $device) {
		$devicesGrouped[$device->formFactor.' '.$device->platform.' '.$device->version][] = $device;
	}

	return Q::view("Streams/content/participating.php", @compact('participantsGrouped', 'user', 'emailSubscribed', 'mobileSubscribed', 'devicesGrouped'));
}

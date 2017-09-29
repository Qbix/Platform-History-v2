<?php
	
function Calendars_newEvent_tool()
{
	$app = Q::app();
	$user = Users::loggedInUser(true);
	$category = Streams_Category::getRelatedTo(
		$user->id, 'Streams/user/interests', 'Streams/interests'
	);
	$category = $category ? $category : array();
	$interests = array();
	foreach ($category as $info) {
		$publisherId = $info[0];
		$title = $info[2];
		$parts = explode(": ", $title, 2);
		if (count($parts) == 1) {
			$parts = array('', $parts[0]);
		}
		$normalized = Q_Utils::normalize($title);
		$interests[$publisherId][$parts[0]][$normalized] = $parts[1];
		foreach ($interests[$publisherId] as $c => $arr) {
			asort($interests[$publisherId][$c]);
		}
	}
	$interests['-']['-']['+'] = 'Manage my interests...';
	
	$times = array();
	for ($i = 0; $i < 24; ++$i) {
		$h = $i % 24;
		for ($m = 0; $m < 60; $m += 15) {
			$hh = sprintf("%02d", $h);
			$mm = sprintf("%02d", $m);
			$times["$hh:$mm"] = ($h < 12) 
				? ($h ? $h : 12).":$mm am"
				: ($h > 12 ? $h - 12 : $h).":$mm pm";
		}
	}
	$days = array();
	
	$labelRows = Users_Label::fetch($user->id, 'Users/');
	$labels = array("$app/*" => 'People');
	foreach ($labelRows as $label => $row) {
		$labels[$label] = $row->title;
	}
	$selectedLabels = '';
	
	$l = Streams::fetchOne(null, Users::loggedInUser(), 'Places/user/location');
	$locationSetClass = $l && $l->getAttribute('latitude') && $l->getAttribute('longitude')
		? "Calendars_location_set"
		: "Calendars_location_unset";
	
	Q_Response::addStylesheet('{{Q}}/css/filter.css');

	return Q::view('Groups/columns/newGroup.php', compact(
		'interests', 'locations', 'times', 'days',
		'labels', 'selectedLabels', 'locationSetClass',
		'areas'
	));
}
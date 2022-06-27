<?php
	
function Websites_article_put()
{
	// only a logged-in user can do this
	$user = Users::loggedInUser(true);
	$publisherId = Streams::requestedPublisherId();
	if (empty($publisherId)) {
		$publisherId = $_REQUEST['publisherId'] = $user->id;
	}
	$name = Streams::requestedName(true);
	$article = Streams_Stream::fetch($user->id, $publisherId, $name);
	if (!$article) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'stream',
			'criteria' => "{publisherId: '$publisherId', name: '$name'}"
		));
	}
	$article->getintouch = isset($_REQUEST['getintouch'])
		? $_REQUEST['getintouch']
		: '';
	$article->save();
	Q_Response::setSlot('form', '');
}
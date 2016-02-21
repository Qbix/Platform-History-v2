<?php

function Broadcast_page_post()
{
	$user = Users::loggedInUser(true);
	if (empty($_REQUEST['page_ids'])) {
		throw new Q_Exception_RequiredField(array('field' => 'page_ids'));
	}
	$page_ids = explode(',', $_REQUEST['page_ids']);
	foreach ($page_ids as $page_id) {
		$page = new Broadcast_Page();
		$page->page_id = $page_id;
		$page->publisherId = $user->id;
		$page->heading = "";
		$page->save(true); // we just trust the user agent that this page id is really owned by the user
	}
	
	// TODO: Figure out a way to check whether it is owned by this user's fb_uid
	// The graph api seems to not give out the admins of a page, so how are we supposed to
	// prevent a logged-in user from spoofing a page_id and claiming they own it?
	
}
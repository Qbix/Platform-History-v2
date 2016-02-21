<?php

function Broadcast_pagetab_response_content()
{
	$page = new Broadcast_Page();
	$req = Users::facebook('Broadcast')->getSignedRequest();
	if (empty($req['page']['id'])) {
		return "No page";
	}
	$page->page_id = $req['page']['id'];
	if (!$page->retrieve()) {
		return "No publisher";
	}
	$heading = "Spread Our Message";
	return Q::view('Broadcast/content/pagetab.php', compact('heading', 'page'));
}
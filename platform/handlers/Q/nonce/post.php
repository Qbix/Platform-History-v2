<?php

function Q_nonce_post()
{
	Q_Session::setNonce(false, true);
}
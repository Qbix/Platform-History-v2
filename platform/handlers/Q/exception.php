<?php

function Q_exception($params)
{
	Q::event('Q/exception/native', $params);
}

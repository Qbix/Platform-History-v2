<?php echo '<?xml version="1.0" encoding="UTF-8" ?>' ?> 
<!DOCTYPE html 
     PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
    "DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
  <head>
    <title>Minimal XHTML 1.0 Document</title>
  </head>
  <body>
	<h1>Default Qbix 404</h1>
	<h2>
		The url <span class='url'><?php echo $url ?></span> doesn't point to anything.
	</h2>
	<div>
		You should implement your own handlers for "Q/noModule" and "Q/notFound". A simple one will suffice, such as
<pre>

<?php echo "&lt;?php" ?>

/**
 * My custom Q/noModule handler.
 */
function Q_noModule($params)
{
        header("HTTP/1.1 404 Not Found");
        $url = Q_Request::url();
        Q_Dispatcher::uri()->module = 'myModule';
        Q::event('Q/response', array());
}
</pre>
		
	</div>
	<!-- this webpage needs to be bigger than 512 bytes, for Chrome to not use its own 404 page -->
  </body>
</html>

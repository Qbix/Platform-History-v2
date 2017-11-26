<!DOCTYPE html>
<html <?php echo Q_Response::htmlAttributes() ?>>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<?php echo Q_Response::metas(true, "\n\t") ?>
	<meta name="HandheldFriendly" content="True" />
	<meta name="viewport" content="minimal-ui, shrink-to-fit=no, width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0<?php if (Q_Request::platform() == 'android'): ?>, target-densitydpi=medium-dpi<?php endif ?>" />
	<meta name="mobile-web-app-capable" content="yes" />
	<link rel="manifest" href="<?php echo Q_Html::themedUrl('manifest.json') ?>">
	<meta name="apple-mobile-web-app-status-bar-style" content="translucent" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-title" content="<?php Q_Html::text(Users::communityName()) ?>">
	<title id="title_slot"><?php echo $title; ?></title>
</head>
<body>
<?php echo Q_Response::scripts(true, "\n\t") ?>
<script>

	var params = getParams();
	var storageVar = 'facebookToken';
	if (!params.access_token) {
		throw(new Error('Undefined token'));
	}

	setTimeout(function(){
		window.location.replace('qcordova://nothing?someParameter=value')
		//window.open('qcordova://nothing');
		//alert(window.open);
	}, 1);

/*
	localStorage.setItem(storageVar, null);
	setTimeout(function(){
		localStorage.setItem(storageVar, params.access_token);
	}, 5000);
*/

	function getParams() {
		var res = {};
		try {
			var str = window.location.href.split('#')[1];
			var pieces = str.split('&');
			console.log(pieces)
			for (var i = 0; i < pieces.length; i++) {
				var val = pieces[i].split('=');
				if (val.length !== 2) {
					continue;
				}
				res[val[0]] = val[1];
			}
		} catch(err) {
			console.warn('Error parsing params');
			throw(err);
		}
		return res;
	}

</script>
</body>
</html>
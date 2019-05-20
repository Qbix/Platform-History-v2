Q.page("Users/session", function () {
	var url = Q.getObject("Q.Cordova.handoff.url");

	console.log("Trying to redirect to:", url);

	var timeId = setInterval(function () {
		if (typeof handleOpenURL === 'function') {
			clearInterval(timeId);
			handleOpenURL(url);
		}
	}, 500);

	return function () {
		// code to execute before page starts unloading
	};
}, 'Users');
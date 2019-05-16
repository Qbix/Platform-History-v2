Q.page("Users/session", function () {
	var url = Q.getObject("Q.Cordova.handoff.url");

	console.log("Trying to redirect to:", url);

	document.location.href = url;

	return function () {
		// code to execute before page starts unloading
	};
}, 'Users');
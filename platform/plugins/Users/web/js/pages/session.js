Q.page("Users/session", function () {
	
	document.location.href = Q.getObject("Q.Cordova.handoff.url");

	return function () {
		// code to execute before page starts unloading
	};
}, 'Users');
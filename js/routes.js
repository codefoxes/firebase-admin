fba.config(function($routeProvider,$locationProvider) {

	$routeProvider.when('/', {
		templateUrl : 'templates/main.html',
	})

	.otherwise({
		redirectTo:'/'
	});
});

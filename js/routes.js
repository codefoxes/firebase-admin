fba.config(function($routeProvider,$locationProvider) {

	$routeProvider.when('/', {
		templateUrl : 'templates/main.html',
	})

	.when('/profile', {
		templateUrl : 'templates/profile.html',
		controller  : 'profileController'
	})

	.when('/sellers', {
		templateUrl : 'templates/sellers.html',
		controller  : 'sellerController'
	})

	.otherwise({
		redirectTo:'/'
	});
});
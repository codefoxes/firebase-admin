var appBaseUrl = document.getElementsByTagName('base')[0].href;

var fba = angular.module('fba', ['ngRoute', 'angularResizable', 'jsonFormatter']).run(function($http,dataFactory,$rootScope) {
	var config = {
	   apiKey: "apiKey",
	   authDomain: "authDomain",
	   databaseURL: "databaseURL"
	};
	var fireApp = firebase.initializeApp(config);
})

.controller('mainController', function(dataFactory,dataBin,$rootScope,$scope,$location,taxonomy) {

	$scope.result = 'Loading';

	var dbRef = firebase.database().ref('/');

	dbRef.on("value", function(snapshot) {
		$scope.$apply(function () {
			$scope.result = snapshot.val();
		});
	}, function (err) {
		$scope.result = 'The read failed: ' + err.code;
	});
})

.factory('dataFactory', function($http) {
	var myService = {
		httpRequest: function(url,method,params,dataPost,upload) {
			var passParameters = {};
			passParameters.url = url;

			if (typeof method == 'undefined'){
				passParameters.method = 'GET';
			}else{
				passParameters.method = method;
			}

			if (typeof params != 'undefined'){
				passParameters.params = params;
			}

			if (typeof dataPost != 'undefined'){
				passParameters.data = dataPost;
			}

			if (typeof upload != 'undefined'){
				passParameters.upload = upload;
			}

			var promise = $http(passParameters).then(function (response) {
				if(typeof response.data == 'string' && response.data != 1){
					$.gritter.add({
						title: 'Shopvel',
						text: response.data
					});
					return false;
				}
				if(response.data.jsMessage){
					$.gritter.add({
						title: response.data.jsTitle,
						text: response.data.jsMessage
					});
				}
				return response.data;
			},function(){
				$.gritter.add({
					title: 'Shopvel',
					text: 'An error occured.'
				});
			});
			return promise;
		}
	};
	return myService;
})

.directive('tooltip', function(){
	return {
		restrict: 'A',
		link: function(scope, element){
			$(element).hover(function(){
				$(element).tooltip('show');
			}, function(){
				$(element).tooltip('hide');
			});
		}
	}
})

.service('dataBin', function (){
	return {
		getData: function (key){
			return JSON.parse(localStorage.getItem(key));
		},
		setData: function(key, value){
			localStorage.setItem(key, JSON.stringify(value));
		},
		delData: function(key){
			localStorage.removeItem(key);
		}
	}
});

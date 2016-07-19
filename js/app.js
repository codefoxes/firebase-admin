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

.controller('pageController', function(dataFactory,$scope,$routeParams,$sce) {
	$('.overlay').show();
	$scope.page = {};
	dataFactory.httpRequest('pages/'+$routeParams.page).then(function(data) {
		$scope.page = data;
		$scope.page.content = $sce.trustAsHtml(data.content);
		$('.overlay').hide();
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

.filter('htmlToText', function(){
	return function(text){
		return  text ? String(text).replace(/<[^>]+>/gm, '') : '';
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
})

.service('anchorSmoothScroll', function(){
	this.scrollTo = function(eID) {
		var startY = currentYPosition();
		var stopY = elmYPosition(eID);
		var distance = stopY > startY ? stopY - startY : startY - stopY;
		if (distance < 100) {
			scrollTo(0, stopY); return;
		}
		var speed = Math.round(distance / 10);
		if (speed >= 20) speed = 20;
		var step = Math.round(distance / 25);
		var leapY = stopY > startY ? startY + step : startY - step;
		var timer = 0;
		if (stopY > startY) {
			for ( var i=startY; i<stopY; i+=step ) {
				setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
				leapY += step; if (leapY > stopY) leapY = stopY; timer++;
			} return;
		}
		for ( var i=startY; i>stopY; i-=step ) {
			setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
			leapY -= step; if (leapY < stopY) leapY = stopY; timer++;
		}

		function currentYPosition() {
			if (self.pageYOffset) return self.pageYOffset;
			if (document.documentElement && document.documentElement.scrollTop)
				return document.documentElement.scrollTop;
			if (document.body.scrollTop) return document.body.scrollTop;
			return 0;
		}

		function elmYPosition(eID) {
			var elm = document.getElementById(eID);
			var y = elm.offsetTop;
			var node = elm;
			while (node.offsetParent && node.offsetParent != document.body) {
				node = node.offsetParent;
				y += node.offsetTop;
			} return y;
		}
	};
})

.factory('taxonomy', function() {
	return {
		get : function(term, field) {
			var t = null;
			switch (term){
				case 'category':
				case 'categories':
					t = {name: 'category', path: 'categories', singular: 'Category', plural: 'Categories'};
					break;
				case 'mtype':
				case 'types':
					t = {name: 'mtype', path: 'types', singular: 'Machine Type', plural: 'Machine Types'};
					break;
				case 'brand':
				case 'brands':
					t = {name: 'brand', path: 'brands', singular: 'Brand', plural: 'Brands'};
					break;
				case 'location':
				case 'locations':
					t = {name: 'location', path: 'locations', singular: 'Location', plural: 'Locations'};
					break;
				case 'yom':
				case 'yoms':
					t = {name: 'yom', path: 'yoms', singular: 'YOM', plural: 'YOMs'};
					break;
				case 'fleet':
				case 'fleets':
					t = {name: 'fleet', path: 'fleet', singular: 'Fleet', plural: 'Fleet'};
					break;
			}
			if (typeof field !== 'undefined') return t[field];
			return t;
		}
	}
});

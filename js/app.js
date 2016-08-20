var fba = angular.module('fba', ['ngRoute', 'angularResizable', 'jsonFormatter']).run(function ($http, dataFactory, $rootScope) {
  $rootScope.userPath = electron.app.getPath('userData')
  const fs = require('graceful-fs')
  $rootScope.online = navigator.onLine
  try {
    var config = fs.readFileSync($rootScope.userPath + '/fba-config.json', 'utf8')
	  $rootScope.config = JSON.parse(config)
  } catch (err) {
	  $rootScope.config = false
  }
  if (!$rootScope.config) {
    ipc.send('open-create-window')
  }
})

.controller('mainController', function (dataFactory, dataBin, $rootScope, $scope, $timeout) {
  $scope.apps = [];
  $scope.os = process.platform
  $scope.result = 'No Data'
  $scope.collections = []
  $scope.query = ''
  $scope.activeUrl = ''
  $scope.listShown = false
  $scope.m = {'searchMenu': ''}
  $scope.menuHidden = false
  $scope.copiedNow = false;
  let query = ''

  $scope.menuHidden = !navigator.onLine

  $timeout(function(){
    $scope.menuHidden = $scope.collections.length <= 0
  }, 10000)

  $scope.connect = (connection) => {
    $('.menu-overlay').show()
    let keySplits = connection.serviceAccount.privateKey.split('\\n')
    connection.serviceAccount.privateKey = ''
    keySplits.forEach(function (v, k) {
      connection.serviceAccount.privateKey += (k === 0) ? v : '\n' + v
    })
    let id = connection.serviceAccount.projectId
    if (typeof $scope.apps[id] === 'undefined') {
      $scope.apps[id] = firebase.initializeApp(connection, id)
    }
    $scope.currentApp = $scope.apps[id]
    $scope.update()
  }

  $scope.update = () => {
    $scope.dbRef = $scope.currentApp.database().ref('/')
    const baseURL = $scope.dbRef.root.toString()

    $scope.dbRef.on('value', function (snapshot) {
      let tempCols = []
      snapshot.forEach(function (childSnapshot) {
        tempCols.push(childSnapshot.key)
      })
      $timeout(function() {
        $scope.collections = tempCols
        $scope.menuHidden = false
      }, 0)
      $('.menu-overlay').hide()
    }, function (err) {
      $scope.result = 'The read failed: ' + err.code
    })
  }

  if ($rootScope.config) {
    $scope.connect($rootScope.config.connections[0])
  } else {
    $('.menu-overlay').hide()
  }

  $scope.create = () => ipc.send('open-create-window')
  
  $scope.delete = (connection) => {
    if (window.confirm('Do you really want to delete?')) {
      let index = $rootScope.config.connections.indexOf(connection);
      $rootScope.config.connections.splice(index, 1);
      try {
        writeFile.sync($rootScope.userPath + '/fba-config.json', angular.toJson($rootScope.config, 4), {mode: parseInt('0600', 8)})
      } catch (err) {
        if (err.code === 'EACCES') {
          err.message = err.message + '\nYou don\'t have access to this file.\n'
        }
        throw err
      }
    }
  }

  $scope.get = function (name) {
    $scope.dbRef.child(name).on('value', function (snapshot) {
      $scope.result = snapshot.val()
      // query = baseURL + name
      query = `database().ref('/').child('${name}')`
      $('#query').val(query).trigger('input')
      $scope.activeUrl = name
    }, function (err) {
      $scope.result = 'The read failed: ' + err.code
    })
  }

  $scope.run = function () {
    query = '$scope.currentApp.' + $('#query').val()
    try {
      eval(query).on('value', function (snapshot) {
        $scope.result = snapshot.val()
      }, function (err) {
        $scope.result = 'The read failed: ' + err.code
      })
    } catch (err) {
      $scope.result = 'Ooops.. There is an error":\n"' + err.message
    }
  }

  $scope.copy = () => {
    let copyText = JSON.stringify($scope.result, null, '\t');
    clipboard.writeText(copyText)
    $scope.copiedNow = true
    $timeout(function(){
      $scope.copiedNow = false
    }, 2000)
  }

  $scope.goConsole = () => electron.shell.openExternal($scope.currentApp.options.databaseURL)
})

.controller('connectionController', function ($scope) {
  $scope.apiKey = ''
  $scope.authDomain = ''
  $scope.databaseURL = ''

  $scope.save = function () {
    const userPath = electron.app.getPath('userData')
    let val = {
      connections: [
        {
          apiKey: $scope.apiKey,
          authDomain: $scope.authDomain,
          databaseURL: $scope.databaseURL
        }
      ]
    }

    try {
      writeFile.sync(userPath + '/fba-config.json', JSON.stringify(val, null, '\t'), {mode: parseInt('0600', 8)})
    } catch (err) {
      if (err.code === 'EACCES') {
        err.message = err.message + '\nYou don\'t have access to this file.\n'
      }
      throw err
    }
  }
})

.factory('dataFactory', function ($http) {
  var myService = {
    httpRequest: function (url, method, params, dataPost, upload) {
      var passParameters = {}
      passParameters.url = url

      if (typeof method === 'undefined') {
        passParameters.method = 'GET'
      } else {
        passParameters.method = method
      }

      if (typeof params !== 'undefined') {
        passParameters.params = params
      }

      if (typeof dataPost !== 'undefined') {
        passParameters.data = dataPost
      }

      if (typeof upload !== 'undefined') {
        passParameters.upload = upload
      }

      var promise = $http(passParameters).then(function (response) {
        if (typeof response.data === 'string' && response.data !== 1) {
          $.gritter.add({
            title: 'Shopvel',
            text: response.data
          })
          return false
        }
        if (response.data.jsMessage) {
          $.gritter.add({
            title: response.data.jsTitle,
            text: response.data.jsMessage
          })
        }
        return response.data
      }, function () {
        $.gritter.add({
          title: 'Shopvel',
          text: 'An error occured.'
        })
      })
      return promise
    }
  }
  return myService
})

.directive('tooltip', function () {
  return {
    restrict: 'A',
    link: function (scope, element) {
      $(element).hover(function () {
        $(element).tooltip('show')
      }, function () {
        $(element).tooltip('hide')
      })
    }
  }
})

.service('dataBin', function () {
  return {
    getData: function (key) {
      return JSON.parse(localStorage.getItem(key))
    },
    setData: function (key, value) {
      localStorage.setItem(key, JSON.stringify(value))
    },
    delData: function (key) {
      localStorage.removeItem(key)
    }
  }
})

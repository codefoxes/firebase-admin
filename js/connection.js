var fbaC = angular.module('fba-c', []).run(function ($rootScope) {
  const userPath = electron.app.getPath('userData')
  const fs = require('graceful-fs')
  try {
    var config = fs.readFileSync(userPath + '/fba-config.json', 'utf8')
    $rootScope.config = JSON.parse(config)
  } catch (err) {
    $rootScope.config = {connections: []}
  }
})

.controller('connectionController', function ($scope, $rootScope) {
  $scope.apiKey = ''
  $scope.authDomain = ''
  $scope.databaseURL = ''

  $scope.save = function () {
    const userPath = electron.app.getPath('userData')
    let connection = {
      apiKey: $scope.apiKey,
      authDomain: $scope.authDomain,
      databaseURL: $scope.databaseURL
    }
    $rootScope.config.connections.push(connection)
    try {
      writeFile.sync(userPath + '/fba-config.json', JSON.stringify($rootScope.config, null, '\t'), {mode: parseInt('0600', 8)})
    } catch (err) {
      if (err.code === 'EACCES') {
        err.message = err.message + '\nYou don\'t have access to this file.\n'
      }
      throw err
    }
  }
})

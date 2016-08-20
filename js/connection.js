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
  $scope.projectID = ''
  $scope.privateKey = ''
  $scope.clientEmail = ''
  $scope.databaseURL = ''

  $scope.save = function () {
    const userPath = electron.app.getPath('userData')
    let updated = false
    let connection = {
      serviceAccount: {
        projectId: $scope.projectID,
        privateKey: $scope.privateKey,
        clientEmail: $scope.clientEmail
      },
      databaseURL: $scope.databaseURL
    }
    for (var i = 0; i < $rootScope.config.connections.length; i++) {
      if ($rootScope.config.connections[i].serviceAccount.projectId == $scope.projectID) {
        $rootScope.config.connections[i] = connection
        updated = true
        break;
      }
    }
    if (!updated) {
      $rootScope.config.connections.push(connection)
    }
    try {
      writeFile.sync(userPath + '/fba-config.json', angular.toJson($rootScope.config, 4), {mode: parseInt('0600', 8)})
      window.close()
    } catch (err) {
      if (err.code === 'EACCES') {
        err.message = err.message + '\nYou don\'t have access to this file.\n'
      }
      throw err
    }
  }

  $scope.close = () => window.close()
})

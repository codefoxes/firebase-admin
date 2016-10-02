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

.controller('connectionController', function ($scope, $rootScope, $timeout) {
  $scope.projectID = ''
  $scope.privateKey = ''
  $scope.clientEmail = ''
  $scope.databaseURL = ''
  $scope.apps = []
  $scope.message = ''
  $scope.error = false
  $scope.testing = false
  const userPath = electron.app.getPath('userData')
  let longTimer, tooLongTimer

  $scope.saveConnection = (connection) => {
    $timeout.cancel( longTimer )
    let updated = false
    for (var i = 0; i < $rootScope.config.connections.length; i++) {
      if ($rootScope.config.connections[i].serviceAccount.projectId == $scope.projectID) {
        $rootScope.config.connections[i] = connection
        updated = true
        break
      }
    }
    if (!updated) {
      $rootScope.config.connections.push(connection)
    }
    try {
      writeFile.sync(userPath + '/fba-config.json', angular.toJson($rootScope.config, 4), {mode: parseInt('0600', 8)})
      ipc.send('reload-window')
      window.close()
    } catch (err) {
      if (err.code === 'EACCES') {
        err.message = err.message + '\nYou don\'t have access to this file.\n'
      }
      throw err
    }
  }

  $scope.save = function () {
    let message = `We could not connect to firebase with the service account credentials you provided.\n\nFirebase admin will not connect to firebase on this connection. Still want to save?`
    $scope.testing = true
    let connection = {
      serviceAccount: {
        projectId: $scope.projectID,
        privateKey: $scope.privateKey,
        clientEmail: $scope.clientEmail
      },
      databaseURL: $scope.databaseURL
    }
    let id = $scope.projectID
    if (typeof $scope.apps[id] === 'undefined') {
      $scope.apps[id] = firebase.initializeApp(connection, id)
    }
    $scope.currentApp = $scope.apps[id]

    $scope.testConnection().then(() => {
      $scope.saveConnection(connection)
      $scope.saving = true
    }).catch(() => {
      if (!$scope.saving && window.confirm(message)) {
        $scope.saveConnection(connection)
        $scope.saving = true
      }
      $scope.testing = false
    })

    longTimer = $timeout(() => {
      if (!$scope.saving && window.confirm(message)) {
        $scope.saveConnection(connection)
        $scope.saving = true
      }
      $scope.testing = false
    }, 10000)
  }

  $scope.import = (elem) => {
    if(elem.files.length > 0) {
      const fs = require('graceful-fs')
      let tempconfig = null
      tempconfig = fs.readFileSync(elem.files[0].path, 'utf8')
      tempconfig = JSON.parse(tempconfig)
      $timeout(() => {
        if (tempconfig.project_id) {
          $scope.projectID = tempconfig.project_id
          $scope.databaseURL = `https://${tempconfig.project_id}.firebaseio.com`
        }
        if (tempconfig.private_key) {
          $scope.privateKey = tempconfig.private_key
        }
        if (tempconfig.client_email) {
          $scope.clientEmail = tempconfig.client_email
        }
      })
    }
  }

  $scope.testConnection = () => {
    return new Promise((resolve, reject) => {
      $scope.currentApp.database().ref('/').once('value', (snapshot) => {
        resolve('Connection success.')
      }, () => {
        reject('Could not connect to firebase.')
      })
    })
  }

  $scope.showTestMessage = () => {
    $timeout.cancel( longTimer )
    $timeout.cancel( tooLongTimer )
    $scope.testConnection().then((msg) => {
      $timeout(() => {
        $scope.message = `${msg} Click "Create" to save.`
        $scope.testing = false
      })
    }).catch((err) => {
      $timeout(() => {
        $scope.message = 'Could not connect to firebase. Please check details.'
        $scope.error = true
        $scope.testing = false
      })
    })

    longTimer = $timeout(() => {
      if ($scope.testing) {
        $scope.message = 'Test taking longer than usual. Please check details.'
        $scope.error = true
      }
    }, 10000)

    tooLongTimer = $timeout(() => {
      if ($scope.testing) {
        $scope.message = 'Could not connect to firebase. Please check details.'
        $scope.error = true
        $scope.testing = false
      }
    }, 30000)
  }

  $scope.test = () => {
    // Validate fields.
    if (!$scope.projectID) {
      $scope.message = 'Please enter valid Project ID'
      $scope.error = true
      return
    }
    if (!$scope.privateKey || !$scope.privateKey.includes('BEGIN')) {
      $scope.message = 'Please enter valid Private Key'
      $scope.error = true
      return
    }
    if (!$scope.clientEmail || !$scope.clientEmail.includes('gserviceaccount.com')) {
      $scope.message = 'Please enter valid Client Email'
      $scope.error = true
      return
    }
    if (!$scope.databaseURL || !$scope.databaseURL.includes('firebaseio.com')) {
      $scope.message = 'Please enter valid Database URL'
      $scope.error = true
      return
    }

    $scope.message = ''
    $scope.error = false

    // Details seems normal. Test connection.
    $scope.testing = true
    let connection = {
      serviceAccount: {
        projectId: $scope.projectID,
        privateKey: $scope.privateKey,
        clientEmail: $scope.clientEmail
      },
      databaseURL: $scope.databaseURL
    }
    let id = $scope.projectID
    if (typeof $scope.apps[id] !== 'undefined') {
      $scope.apps[id].delete().then(() => {
        $scope.apps[id] = firebase.initializeApp(connection, id)
        $scope.currentApp = $scope.apps[id]
        $scope.showTestMessage()
      })
    } else {
      $scope.apps[id] = firebase.initializeApp(connection, id)
      $scope.currentApp = $scope.apps[id]
      $scope.showTestMessage()
    }
  }

  $scope.goDocs = () => electron.shell.openExternal('http://docs.codefoxes.com/firebase-admin/')

  $scope.close = () => window.close()
})

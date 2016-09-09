var fbaP = angular.module('fba-p', []).run(function () {
})

.controller('settingsController', function ($scope, $timeout) {
  $scope.view = {}
  $scope.view.theme = true
  $scope.activeUrl = 'theme'
  $scope.saved = false
  $scope.jsonThemes = []
  $scope.items = [{
    name: 'Theme',
    url: 'theme'
  },{
    name: 'Fonts',
    url: 'fonts'
  }]

  const userPath = electron.app.getPath('userData')
  const fs = require('graceful-fs')
  try {
    var settings = fs.readFileSync(userPath + '/fba-settings.json', 'utf8')
    $scope.form = JSON.parse(settings)
  } catch (err) {
    $scope.form = false
  }
  if (!$scope.form) {
    $scope.form = require('./js/default-settings')
  }

  try {
    fs.readdir(`${__dirname}/css/codemirror`, (err, files) => {
      $timeout(() => {
        files.forEach((file) => {
          $scope.jsonThemes.push(file.substr(0, file.lastIndexOf('.')))
        })
      }, 0)
    })
  } catch (err) {}

  $scope.save = () => {
    try {
      writeFile.sync(userPath + '/fba-settings.json', JSON.stringify($scope.form, null, '\t'), {mode: parseInt('0600', 8)})
      $scope.saved = true
      $timeout(() => {
        $scope.saved = false
      }, 2000)
      ipc.send('reload-window')
    } catch (err) {
      if (err.code === 'EACCES') {
        err.message = err.message + '\nYou don\'t have access to this file.\n'
      }
      throw err
    }
  }

  $scope.changeView = (view) => {
    angular.forEach($scope.view, (v, k) => {
      $scope.view[k] = false
    })
    $scope.view[view] = true
    $scope.activeUrl = view
  }

  $scope.close = () => window.close()
})

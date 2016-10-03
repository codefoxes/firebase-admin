var fbaU = angular.module('fba-u', [])

.controller('updateController', function ($scope, $rootScope) {
  $scope.destination = 'desktop'
  let updateData = electron.getCurrentWindow().updateData
  $scope.message = updateData.message

  if (updateData.update) {
    $scope.update = updateData.update
    $scope.version = updateData.version
    $scope.changes = updateData.changes
  }

  let os = process.platform
  $scope.download = () => {
    electron.shell.openExternal(`https://firebaseadmin.com/download.php?os=${os}`)
  }

  $scope.close = () => window.close()
})

var fba = angular.module('fba', ['ngRoute', 'angularResizable', 'ui.codemirror']).run(function ($http, dataFactory, $rootScope) {
  $rootScope.userPath = electron.app.getPath('userData')
  const fs = require('graceful-fs')
  $rootScope.rootError = false
  $rootScope.online = navigator.onLine
  if (!$rootScope.online) {
    $rootScope.rootError = true
  }
  $rootScope.titleBar = true
  try {
    var config = fs.readFileSync($rootScope.userPath + '/fba-config.json', 'utf8')
    $rootScope.config = JSON.parse(config)
  } catch (err) {
    $rootScope.config = false
  }
  if (!$rootScope.config || $rootScope.config.connections.length === 0) {
    ipc.send('open-create-window')
  }

  try {
    var settings = fs.readFileSync($rootScope.userPath + '/fba-settings.json', 'utf8')
    $rootScope.settings = JSON.parse(settings)
  } catch (err) {
    $rootScope.settings = require('./js/default-settings')
  }

  $rootScope.removeTitleBar = () => {
    $rootScope.titleBar = false
    document.documentElement.style.setProperty('--chrome-height', '38px')
  }
  if (process.platform !== 'darwin') {
    $rootScope.removeTitleBar()
  }

  if ($rootScope.settings.theme === 'dark') {
    document.documentElement.style.setProperty('--color-main', '#fff');
    document.documentElement.style.setProperty('--color-sec', '#ccc');
    document.documentElement.style.setProperty('--color-sec-bg', '#3c474c');
    document.documentElement.style.setProperty('--bg-button-top', '#556167');
    document.documentElement.style.setProperty('--bg-button-bottom', '#3c474c');
    document.documentElement.style.setProperty('--color-border-button', '#3c474c #242d31 #242d31');
    document.documentElement.style.setProperty('--bg-chrome-top', '#556167');
    document.documentElement.style.setProperty('--bg-chrome-bottom', '#3c474c');
    document.documentElement.style.setProperty('--color-border-chrome', '#3c474c #242d31 #242d31');
    document.documentElement.style.setProperty('--bg-button-light-top', '#556167');
    document.documentElement.style.setProperty('--bg-button-light-bottom', '#3c474c');
    document.documentElement.style.setProperty('--color-border-button-light', '#3c474c #242d31 #242d31');
    document.documentElement.style.setProperty('--bg-menu', '#3c474c');
  }

  if ($rootScope.settings.fonts !== 'system') {
    document.documentElement.style.setProperty('--font-main', $rootScope.settings.fonts)
  }
})

.controller('mainController', function (dataFactory, dataBin, $rootScope, $scope, $timeout) {
  $scope.apps = []
  $scope.os = process.platform
  $scope.result = 'No Data'
  $scope.results = ['No Data']
  $scope.collections = []
  $scope.query = ''
  $scope.activeUrl = ''
  $scope.listShown = false
  $scope.m = {'searchMenu': ''}
  $scope.menuOverlay = navigator.onLine
  $scope.menuHidden = !navigator.onLine
  $scope.copiedNow = false
  $scope.view = {}
  $scope.view.tree = true
  $scope.mode = 'explorer'
  $scope.collection = {url: ''}
  $scope.codeResult = 'No Data'
  $scope.query = ''
  $scope.mode = 'explorer'

  if (process.env.mode && process.env.mode === 'dev') {
    console.oldLog = console.log
  }
  console.log = (...value) => {
    if (console.oldLog) {
      console.oldLog(value)
    }
    if (Array.isArray($scope.$log)) {
      $scope.$log = $scope.$log.concat(value)
    } else {
      $scope.$log = value
    }
  }

  $timeout(() => {
    $scope.menuHidden = $scope.collections.length <= 0
  }, 10000)

  $scope.changeQueryBoxHeight = (height) => {
    document.documentElement.style.setProperty('--height-query-box', `${height}px`)
  }

  $scope.$on("angular-resizable.resizing", function (event, args) {
    if (args.id === 'query-box') {
      let minHeight = 48
      let maxHeight = document.getElementById('query-box').parentElement.offsetHeight * .8
      if (args.height > maxHeight) {
        args.height = maxHeight
      }
      if (args.height < minHeight) {
        args.height = minHeight
      }
      $scope.changeQueryBoxHeight(args.height)
    }
  })

  $scope.setJsonTheme = (cm, theme) => {
    let cssId = `theme-${theme}`
    if (!document.getElementById(cssId)) {
      var head  = document.getElementsByTagName('head')[0]
      var link  = document.createElement('link')
      link.id   = cssId
      link.rel  = 'stylesheet'
      link.type = 'text/css'
      link.href = `css/codemirror/${theme}.css`
      head.appendChild(link)
    }
    cm.setOption('theme', theme)
  }

  $scope.codeViewLoaded = (cm) => {
    $scope.codeView = cm
    if ($rootScope.settings.theme === 'dark' && $rootScope.settings.jsonTheme === 'default') {
      $scope.setJsonTheme(cm, 'monokai')
    } else if ($rootScope.settings.jsonTheme === 'custom') {
      $scope.setJsonTheme(cm, $rootScope.settings.customTheme)
    }
  }

  $scope.queryViewLoaded = (cm) => {
    $scope.queryView = cm
    if ($rootScope.settings.theme === 'dark') {
      $scope.setJsonTheme(cm, 'monokai')
    }
  }

  $scope.codeOptions = {
    lineWrapping : true,
    lineNumbers: true,
    onLoad: $scope.codeViewLoaded,
    readOnly: 'nocursor',
    mode: 'application/json',
    extraKeys: {"Ctrl-Q": function(cm){ cm.foldCode(cm.getCursor()); }},
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
  }

  $scope.codeQueryOptions = {
    lineWrapping : true,
    lineNumbers: false,
    onLoad: $scope.queryViewLoaded,
    mode: 'javascript',
    matchBrackets: true,
    extraKeys: {"Ctrl-Q": function(cm){ cm.foldCode(cm.getCursor()); }}
  }

  $scope.rightClick = () => {
    ipc.send('show-context-menu', {copy: $scope.codeView.getSelection()})
  }

  $scope.connect = (connection, openCon) => {
    $rootScope.rootError = !navigator.onLine
    try {
      $scope.menuOverlay = true
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
      dataBin.setData('openCon', openCon)
    } catch (err) {
      $scope.menuOverlay = false
      $scope.menuHidden = true
      $rootScope.rootError = true
      $scope.errorMessage = `Failed to connect ${connection.databaseURL}.`
    }
  }

  $scope.update = () => {
    $scope.dbRef = $scope.currentApp.database().ref('/')
    $scope.baseURL = $scope.dbRef.root.toString()

    $scope.dbRef.on('value', function (snapshot) {
      let tempCols = []
      snapshot.forEach(function (childSnapshot) {
        tempCols.push({
          name: childSnapshot.key,
          url: childSnapshot.key,
          leaf: !childSnapshot.hasChildren()
        })
      })
      $timeout(() => {
        $scope.collections = tempCols
        $scope.menuOverlay = false
        $scope.menuHidden = false
      }, 0)
      $scope.changeQuery()
    }, function (err) {
      $scope.result = 'The read failed: ' + err.code
    })
  }

  if (navigator.onLine && $rootScope.config && $rootScope.config.connections.length > 0) {
    let openCon = dataBin.getData('openCon')
    if (openCon === null) {
      openCon = 0
    }
    if ($rootScope.config.connections[openCon]) {
      $scope.connect($rootScope.config.connections[openCon], openCon)
    }
  } else {
    $scope.menuOverlay = false
    $scope.menuHidden = true
    $rootScope.rootError = true
    $scope.errorMessage = 'No connection yet!'
  }

  $scope.create = () => ipc.send('open-create-window')

  $scope.delete = (connection) => {
    if (window.confirm('Do you really want to delete?')) {
      let index = $rootScope.config.connections.indexOf(connection)
      $rootScope.config.connections.splice(index, 1)
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

  $scope.updateResult = (obj, url) => {
    let tempCols = []
    angular.forEach(obj, (val, key) => {
      let tempObj = {
        name: key,
        url: url ? (url + '/' + key) : key
      }
      if (typeof val === 'object') {
        tempObj.collections = $scope.updateResult(val, tempObj.url)
      } else {
        tempObj.value = val
        tempObj.leaf = true
      }
      tempCols.push(tempObj)
    })
    return tempCols
  }

  $scope.get = function (collection) {
    $scope.results = []
    $scope.collection = {}
    $scope.dbRef.child(collection.url).on('value', function (snapshot) {
      $scope.result = snapshot.val()
      $scope.results.push(snapshot.val())
      $scope.codeResult = JSON.stringify($scope.result, null, 2)
      $scope.collection.name = collection.name
      $scope.collection.url = collection.url
      if (typeof $scope.result === 'object') {
        $scope.collection.collections = $scope.updateResult($scope.result, collection.url)
      } else {
        $scope.collection.value = $scope.result
        $scope.collection.leaf = true
      }
      $scope.collection.open = true
      $scope.changeQuery()
      $scope.activeUrl = collection.url
    }, function (err) {
      $scope.result = 'The read failed: ' + err.code
    })
  }

  $scope.open = (collection) => {
    if (collection.open || collection.collections) {
      collection.open = !collection.open
      return
    }
    $scope.dbRef.child(collection.url).on('value', (snapshot) => {
      let tempCols = []
      snapshot.forEach(function (childSnapshot) {
        tempCols.push({
          name: childSnapshot.key,
          url: collection.url + '/' + childSnapshot.key,
          leaf: !childSnapshot.hasChildren()
        })
      })
      $timeout(() => {
        collection.open = true
        collection.collections = tempCols
      }, 0)
    }, (err) => {
      $scope.result = 'The read failed: ' + err.code
    })
  }

  $scope.run = function () {
    let query = $scope.queryView.getValue()
    $scope.results = []
    if($scope.mode === 'explorer') {
      $scope.collection = {}
      try {
        if(!query.endsWith('/')) {
          query = query + '/'
        }
        query = query.substring($scope.baseURL.length, query.length - 1)
        $scope.currentApp.database().ref(query).on('value', function (snapshot) {
          $scope.result = snapshot.val()
          $scope.results.push(snapshot.val())
          if(!snapshot.key) {
            $scope.collection.name = $scope.currentApp.name
            $scope.collection.url = ''
          } else {
            $scope.collection.name = snapshot.key
            $scope.collection.url = query
          }
          if (typeof $scope.result === 'object') {
            $scope.collection.collections = $scope.updateResult($scope.result, $scope.collection.url)
          } else {
            $scope.collection.value = $scope.result
            $scope.collection.leaf = true
          }
          $scope.collection.open = true
          $scope.codeResult = JSON.stringify($scope.result, null, 2)
          $scope.activeUrl = $scope.collection.url
        }, function (err) {
          $scope.result = 'The read failed: ' + err.code
        })
      } catch (err) {
        $scope.result = 'Ooops.. There is an error":\n"' + err.message
      }
    } else if($scope.mode === 'query') {
      let regex = 'firebase().'
      query = query.replace(regex, '$scope.currentApp.')
       try {
        eval(query)
        if (typeof $scope.$log !== 'undefined' && $scope.$log.length > 0) {
          $scope.$log.forEach((res) => {
            $scope.results.push(res)
          })
        }
        $scope.$log = null
      } catch (err) {
        $scope.result = 'Ooops.. There is an error":\n"' + err.message
      }
    }
  }

  $scope.copy = () => {
    let copyText = JSON.stringify($scope.result, null, '\t')
    clipboard.writeText(copyText)
    $scope.copiedNow = true
    $timeout(() => {
      $scope.copiedNow = false
    }, 2000)
  }

  $scope.goConsole = () => electron.shell.openExternal($scope.currentApp.options.databaseURL)

  $scope.refreshCodeView = () => {
    $timeout(() => {
      $scope.codeView.refresh()
    }, 0)
  }

  $scope.refreshQueryView = () => {
    $timeout(() => {
      $scope.queryView.refresh()
    }, 0)
  }

  $scope.changeView = (view) => {
    angular.forEach($scope.view, (v, k) => {
      $scope.view[k] = false
    })
    $scope.view[view] = true
    $scope.refreshCodeView()
  }

  $scope.changeMode = (mode) => {
    $scope.mode = mode
    $scope.changeView('raw')
    $scope.changeQuery()
  }

  $scope.changeQuery = () => {
    if ($scope.mode === 'explorer') {
      $scope.query = $scope.baseURL
      if ($scope.collection.url) {
        $scope.query = $scope.baseURL + $scope.collection.url + '/'
      }
      $scope.queryView.setValue($scope.query)
      $scope.changeQueryBoxHeight(48)
    } else if ($scope.mode === 'query') {
      if ($scope.collection.url) {
        $scope.query = $scope.collection.url + '/'
      } else {
        $scope.query = ''
      }
      $scope.queryView.setValue(`firebase().database().ref('/${$scope.query}').on('value', function (snapshot) {\n\tconsole.log(snapshot.val())\n})`)
      $scope.changeQueryBoxHeight(90)
    }
    $scope.refreshQueryView()
  }

  $scope.addChild = (collection) => {
    collection.open = true
    collection.adding = true
  }

  $scope.saveChild = (collection) => {
    let tempObj = {}
    tempObj[collection.newKey] = collection.newValue
    $scope.dbRef.child(collection.url).update(tempObj)
  }

  $scope.remove = (url) => {
    let notice = `!! All data at this location, including nested data, will be permanently deleted !!\n\nData Location: ${url}\n\nDo you really want to remove?`
    if (window.confirm(notice)) {
      $scope.dbRef.child(url).remove()
    }
  }

  $scope.updateChild = (collection) => {
    $scope.dbRef.child(collection.url).set(collection.value)
  }
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

.directive('ngRightClick', ($parse) => {
  return (scope, element, attrs) => {
    var fn = $parse(attrs.ngRightClick)
    element.bind('contextmenu', (event) => {
      scope.$apply(() => {
        event.preventDefault()
        fn(scope, {$event:event})
      })
    })
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

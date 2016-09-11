const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const name = electron.app.getName()

let template = [{
  label: 'File',
  submenu: [{
    label: 'Create',
    accelerator: 'CmdOrCtrl+N',
    click: (item, focusedWindow) => {
      if (focusedWindow.createWindow) {
        focusedWindow.createWindow('conWin', 'create.html', {parent: focusedWindow, width: 600, height: 300})
      }
    }
  }]
}, {
  label: 'Edit',
  submenu: [{
    label: 'Undo',
    accelerator: 'CmdOrCtrl+Z',
    role: 'undo'
  }, {
    label: 'Redo',
    accelerator: 'Shift+CmdOrCtrl+Z',
    role: 'redo'
  }, {
    type: 'separator'
  }, {
    label: 'Cut',
    accelerator: 'CmdOrCtrl+X',
    role: 'cut'
  }, {
    label: 'Copy',
    accelerator: 'CmdOrCtrl+C',
    role: 'copy'
  }, {
    label: 'Paste',
    accelerator: 'CmdOrCtrl+V',
    role: 'paste'
  }, {
    label: 'Select All',
    accelerator: 'CmdOrCtrl+A',
    role: 'selectall'
  }]
}, {
  label: 'View',
  submenu: [{
    label: 'Reload',
    accelerator: 'CmdOrCtrl+R',
    click: function (item, focusedWindow) {
      if (focusedWindow) {
        // on reload, start fresh and close any old
        // open secondary windows
        if (focusedWindow.id === 1) {
          BrowserWindow.getAllWindows().forEach(function (win) {
            if (win.id > 1) {
              win.close()
            }
          })
        }
        focusedWindow.reload()
      }
    }
  }, {
    label: 'Toggle Full Screen',
    accelerator: (function () {
      if (process.platform === 'darwin') {
        return 'Ctrl+Command+F'
      } else {
        return 'F11'
      }
    })(),
    click: function (item, focusedWindow) {
      if (focusedWindow) {
        focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
      }
    }
  }, {
    label: 'Toggle Developer Tools',
    accelerator: (function () {
      if (process.platform === 'darwin') {
        return 'Alt+Command+I'
      } else {
        return 'Ctrl+Shift+I'
      }
    })(),
    click: function (item, focusedWindow) {
      if (focusedWindow) {
        focusedWindow.toggleDevTools()
      }
    }
  }]
}, {
  label: 'Window',
  role: 'window',
  submenu: [{
    label: 'Minimize',
    accelerator: 'CmdOrCtrl+M',
    role: 'minimize'
  }, {
    label: 'Close',
    accelerator: 'CmdOrCtrl+W',
    role: 'close'
  }, {
    type: 'separator'
  }, {
    label: 'Reopen Window',
    accelerator: 'CmdOrCtrl+Shift+T',
    enabled: false,
    key: 'reopenMenuItem',
    click: function () {
      electron.app.emit('activate')
    }
  }]
}, {
  label: 'Help',
  role: 'help',
  submenu: [{
    label: 'Visit Website',
    click: function () {
      electron.shell.openExternal('http://docs.codefoxes.com/firebase-admin/')
    }
  }, {
    label: 'Learn More',
    click: function () {
      electron.shell.openExternal('http://docs.codefoxes.com/firebase-admin/')
    }
  }]
}]

if (process.platform === 'darwin') {
  template.unshift({
    label: name,
    submenu: [{
      label: `About ${name}`,
      click: (item, focusedWindow) => {
        if (focusedWindow.createWindow) {
          focusedWindow.createWindow('abtWin', 'about.html', {parent: focusedWindow, width: 400, height: 300, frame: false, resizable: false})
        }
      }
    }, {
      type: 'separator'
    }, {
      label: 'Preferences',
      click: (item, focusedWindow) => {
        if (focusedWindow.createWindow) {
          focusedWindow.createWindow('setWin', 'settings.html', {parent: focusedWindow, width: 600, height: 400})
        }
      }
    }, {
      type: 'separator'
    }, {
      label: `Hide ${name}`,
      accelerator: 'Command+H',
      role: 'hide'
    }, {
      label: 'Hide Others',
      accelerator: 'Command+Alt+H',
      role: 'hideothers'
    }, {
      label: 'Show All',
      role: 'unhide'
    }, {
      type: 'separator'
    }, {
      label: 'Quit',
      accelerator: 'Command+Q',
      click: function () {
        electron.app.quit()
      }
    }]
  })

  // Window menu.
  template[3].submenu.push({
    type: 'separator'
  }, {
    label: 'Bring All to Front',
    role: 'front'
  })
} else {
  template[0].submenu.push({
    label: 'Exit',
    accelerator: 'CmdOrCtrl+W',
    role: 'close'
  })
  template[4].submenu = template[4].submenu.concat([{
    type: 'separator'
  }, {
    label: `About ${name}`,
    click: (item, focusedWindow) => {
      if (focusedWindow.createWindow) {
        focusedWindow.createWindow('abtWin', 'about.html', {parent: focusedWindow, width: 400, height: 300, frame: false, resizable: false})
      }
    }
  }])
  template.splice(4, 0, {
    label: 'Settings',
    click: (item, focusedWindow) => {
      if (focusedWindow.createWindow) {
        focusedWindow.createWindow('setWin', 'settings.html', {parent: focusedWindow, width: 600, height: 400})
      }
    }
  })
}

exports = module.exports = template

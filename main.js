const electron = require('electron')
const app = electron.app
const Menu = electron.Menu
const BrowserWindow = electron.BrowserWindow
const ipc = electron.ipcMain

let template = require('./js/menu')
if (process.mas) app.setName('Firebase Admin')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let subWindows = []

function createMainWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600, minWidth: 600, minHeight: 500, titleBarStyle: 'hidden'})

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  mainWindow.createWindow = (name, file, options) => createWindow(name, file, options)

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createWindow(name, file, options) {
  if (!subWindows[name]) {
    subWindows[name] = new electron.BrowserWindow(options)
    subWindows[name].on('closed', () => { subWindows[name] = null })
    subWindows[name].loadURL(`file://${__dirname}/${file}`)
    subWindows[name].setMenu(null)
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createMainWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createMainWindow()
  }
})

let contextMenu
app.on('browser-window-created', function (event, win) {
  win.webContents.on('context-menu', function (e, params) {
    const contextTemplate = require('./js/context-menu')({win: win, params: params})
    contextMenu = Menu.buildFromTemplate(contextTemplate)
    contextMenu.popup(win, params.x, params.y)
  })
})

ipc.on('show-context-menu', (e, args) => {
  let win = BrowserWindow.fromWebContents(e.sender)
  if (contextMenu) {
    contextMenu.popup(win)
  }
})

ipc.on('reload-window', () => mainWindow.reload())

ipc.on('open-create-window', function (event) {
  createWindow('conWin', 'create.html', {parent: mainWindow, width: 600, height: 300})
})

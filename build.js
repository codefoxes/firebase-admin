'use strict'

let packager = require('electron-packager')
let options = {
  dir: '.',
  name: 'Firebase Admin',
  version: '1.3.5',
  arch: process.arch,
  platform: process.platform,
  asar: true,
  icon: 'img/icons/firebase-admin',
  ignore: [
    '/img/icons($|/)',
    '/node_modules/spectron($|/)',
    '/node-modules/mocha($|/)',
    '/node-modules/chai($|/)'
  ]
}

packager(options, (err, appPaths) => {
  if (err) {
    console.log(err)
  }
  if (appPaths) {
    console.log(appPaths)
  }
})

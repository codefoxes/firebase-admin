'use strict'

const Application = require('spectron').Application
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const path = require('path')
const fs = require('fs')
const electronBin = require('electron-bin-path')

chai.should()
chai.use(chaiAsPromised)

describe('application launch', function () {
  this.timeout(10000)

  before(function () {
    // If invoking electron directly doesn't work, use built application.
    // `${__dirname}/../Firebase\ Admin-darwin-x64/Firebase\ Admin.app/Contents/MacOS/Firebase\ Admin`
    return electronBin().then(path => {
      this.app = new Application({
        path: path,
        args: [`${__dirname}/../`]
      })
      return this.app.start()
    })
  })

  before(function () {
    chaiAsPromised.transferPromiseness = this.app.transferPromiseness
  })

  after(function () {
    this.timeout(10000)
    if (this.app && this.app.isRunning()) {
      return this.app.stop()
    }
  })

  it('opens main window', function () {
    return this.app.client.waitUntilWindowLoaded()
      .getWindowCount().should.eventually.be.below(3)
      .browserWindow.isMinimized().should.eventually.be.false
      .browserWindow.isDevToolsOpened().should.eventually.be.false
      .browserWindow.isVisible().should.eventually.be.true
      .browserWindow.getBounds().should.eventually.have.property('width').and.be.above(0)
      .browserWindow.getBounds().should.eventually.have.property('height').and.be.above(0)
  })

  it('opens create window', function () {
    return this.app.client.waitUntilWindowLoaded().click('#create').windowByIndex(1)
      .browserWindow.getURL().should.eventually.include('create')
      .browserWindow.getBounds().should.eventually.have.property('width').and.be.above(0)
      .browserWindow.getBounds().should.eventually.have.property('height').and.be.above(0)
  })
})

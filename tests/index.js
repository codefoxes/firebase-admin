'use strict'

const Application = require('spectron').Application
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const path = require('path')
const fs = require('fs')

chai.should()
chai.use(chaiAsPromised)

describe('Test', function () {
  it('passes', function () {
    true.should.be.true
  })
})

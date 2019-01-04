const config = require('../config/config');
const fs = require('fs');
const os = require('os');
const rpiTempModuleFile = (os.type() === 'Darwin' || config.mock) ? './mock-rpi-temperature' : './rpi-temperature';
const rpiTemperature = require(rpiTempModuleFile);
const BASE_DIR = '/srv/thermo-pi/';
const roomDesignatorFile = `${BASE_DIR}roomDesignator.json`;
const desiredTempFile = `${BASE_DIR}desiredTemp.json`;
const lowToleranceFile = `${BASE_DIR}lowTolerance.json`;
const upperToleranceFile = `${BASE_DIR}upperTolerance.json`;
const overrideModeFile = `${BASE_DIR}overrideMode.json`;
const deviceInitializedFile = `${BASE_DIR}initialized.json`;

function ConfigController() {

}

function readFile(filename) {
  return new Promise((resolve, reject) => {
    resolve(JSON.parse(fs.readFileSync(filename, 'utf8')));
  })
}

function writeFile(filename, value) {
  return new Promise((resolve, reject) => {
    const obj = {
      value,
      timestamp: new Date()
    }
    fs.writeFile(filename, JSON.stringify(obj), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  })
}

ConfigController.prototype.getAllConfig = function() {
  var config = {}
  return readFile(desiredTempFile)
    .then(desiredTemp => {
      config.desiredTemp = desiredTemp;
      return readFile(lowToleranceFile);
    })
    .then(lowTolerance => {
      config.lowTolerance = lowTolerance;
      return readFile(upperToleranceFile);
    })
    .then(upperTolerance => {
      config.upperTolerance = upperTolerance;
      return readFile(roomDesignatorFile)
    })
    .then(roomDesignator => {
      config.roomDesignator = roomDesignator;
      return readFile(overrideModeFile)
    })
    .then(overrideMode => {
      config.overrideMode = overrideMode;
      return Promise.resolve(config)
    })
}

ConfigController.prototype.setDeviceInitialized = function() {
  return writeFile(deviceInitializedFile, 'true');
}

ConfigController.prototype.setDeviceNOTInitialized = function() {
  return writeFile(deviceInitializedFile, 'false');
}

ConfigController.prototype.getRoomDesignator = function() {
  return readFile(roomDesignatorFile);
}

ConfigController.prototype.setRoomDesignator = function(roomDesignator) {
  return writeFile(roomDesignatorFile, roomDesignator);
}

ConfigController.prototype.getOverrideMode = function() {
  return readFile(overrideModeFile);
}

ConfigController.prototype.getCurrentTemp = function() {
  return rpiTemperature.getTemperature();
}

ConfigController.prototype.getDesiredTemp = function() {
  return readFile(desiredTempFile);
}

ConfigController.prototype.setDesiredTemp = function(temp) {
  return writeFile(desiredTempFile, temp)
    .then(() => {
      return readFile(desiredTempFile);
    })
}

ConfigController.prototype.getLowerTolerance = function() {
  return readFile(lowToleranceFile);
}

ConfigController.prototype.setLowerTolerance = function(lowTolerance) {
  return writeFile(lowToleranceFile, lowTolerance);
}

ConfigController.prototype.getUpperTolerance = function() {
  return readFile(upperToleranceFile);
}

ConfigController.prototype.setUpperTolerance = function(upperTolerance) {
  return writeFile(upperToleranceFile, upperTolerance);
}

module.exports = ConfigController;

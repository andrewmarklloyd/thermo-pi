const PinController = require('./pinController');
const ConfigController = require('./configController');
const configController = new ConfigController();
var pinController;

function ProgramController() {
  pinController = new PinController();
}

function runProgram() {
  configController.getRoomDesignator()
    .then(designator => {
      console.log(`Starting program, room designator "${designator.value}"`)
    })
  setInterval(function(){
    configController.getAllConfig()
    .then(config => {
      var upperLimit = parseFloat(config.desiredTemp.value) + parseFloat(config.upperTolerance.value);
      var lowerLimit = parseFloat(config.desiredTemp.value) - parseFloat(config.lowTolerance.value);
      var currentTemp = configController.getCurrentTemp();
      var overrideMode = config.overrideMode.value;
      if ((currentTemp < lowerLimit) && !overrideMode) {
        pinController.closeRelay();
      } else if ((currentTemp > upperLimit) && !overrideMode) {
        pinController.openRelay();
      } else {

      }
    })
  }, 10000)
}

ProgramController.prototype.runProgram = function() {
  runProgram();
}

ProgramController.prototype.increaseDesiredTemp = function() {
  return configController.getDesiredTemp()
    .then(data => {
      return configController.setDesiredTemp(parseFloat(data.value) + 1);
    })
}

ProgramController.prototype.decreaseDesiredTemp = function() {
  return configController.getDesiredTemp()
    .then(data => {
      return configController.setDesiredTemp(parseFloat(data.value) - 1);
    })
}

ProgramController.prototype.setDesiredTemp = function(temp) {
  return configController.setDesiredTemp(temp);
}

ProgramController.prototype.setLowerTolerance = function(temp) {
  return configController.setLowerTolerance(temp);
}

ProgramController.prototype.setUpperTolerance = function(temp) {
  return configController.setUpperTolerance(temp);
}

module.exports = ProgramController;

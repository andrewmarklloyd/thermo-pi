const rpio = require('rpio');

// Value of the pin number, not the GPIO number
const pinMap = require('../models/pins');


/*
 * Set the initial state to low.  The state is set prior to the pin
 * being actived, so is safe for devices which require a stable setup.
 */
function RelayController() {
	const keys = Object.keys(pinMap);
	keys.forEach(key => {
		rpio.open(pinMap[key], rpio.OUTPUT, rpio.LOW);
	})
}

/*
* Private helper function
*/
function closeRelay() {
	return new Promise((resolve, reject) => {
		const PIN = pinMap.default;
		// console.log('closing relay')
		rpio.write(PIN, rpio.HIGH);
		resolve();
	})
}

/*
* Private helper function
*/
function openRelay() {
	return new Promise((resolve, reject) => {
		const PIN = pinMap.default;
		// console.log('opening relay')
		rpio.write(PIN, rpio.LOW);
		resolve();
	})
}

/*
* Private helper function
*/
function checkPin() {
	const PIN = pinMap.default;
	return rpio.read(PIN);
}

RelayController.prototype.openRelay = function() {
	return openRelay();
}

RelayController.prototype.closeRelay = function() {
	return closeRelay();
}

RelayController.prototype.checkRelay = function() {
	return checkRelay();
}

module.exports = RelayController;

const config = require('../config/config')
const osc = require('node-osc');
const oscServer = new osc.Server(config.osc.port, '0.0.0.0');
// Disable client for now
// const client = new osc.Client('192.168.0.101', 3333);

var heaterListener = null;

function TouchOSCController() {
	oscServer.on('message', function (message, rinfo) {
		const messageType = message[0];
		const messageValue = message[1] === 1 ? 'ON' : 'OFF';

		if (messageType.indexOf('/heater/') == 0) {
			heaterListener({
				room: messageType.slice('/heater/'.length),
				status: messageValue
			}, (error) => {
				if (error) {
					console.log(error)
					//TODO add an error indicator on osc, set to red temporarily
				} else {
					console.log(messageType.slice('/heater/'.length), 'worker node status set successfully to', messageValue)
				}
			});
		}
	});
}

TouchOSCController.prototype.setHeaterListener = function(listener) {
	heaterListener = listener;
}

module.exports = TouchOSCController;

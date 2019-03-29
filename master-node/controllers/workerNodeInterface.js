const config = require('../config/config');
const request = require('request');

const roomAddressMap = {};

function WorkerNodeInterface() {

}

WorkerNodeInterface.prototype.setRoomTemp = function(data, callback) {
	const address = roomAddressMap[data.room];
	if (address === undefined) {
		return callback(`${data.room} room node hasn't checked in yet.`)
	}
	const options = {
    headers: {
    	'content-type': 'application/json'
    },
    url: `http://${address}:8888/control`,
    method: 'POST',
    body: JSON.stringify({
    	status: data.direction
    })
	}
	request(options, function(error, response, body) {
    if (error) {
      callback(error)
    } else {
      if (response.statusCode === 200) {
        callback(null, body);
      } else {
        callback(body, null);
      }
    }
  });
}

WorkerNodeInterface.prototype.setRoomAddress = function(data) {
	console.log('Setting worker room address', data)
	roomAddressMap[data.roomFunction] = data.address;
}

WorkerNodeInterface.prototype.removeRoomAddress = function(roomFunction) {
	console.log('Removing worker room address', roomFunction, roomAddressMap[roomFunction])
	delete roomAddressMap[roomFunction];
}

module.exports = WorkerNodeInterface;

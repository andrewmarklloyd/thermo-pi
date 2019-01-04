const colors = require('colors')
const findLocalDevices = require('local-devices')
const os = require('os');
const request = require('request');
const ConfigController = require('./configController');
const configController = new ConfigController();
const io = require('socket.io-client');
var leadershipSocketNamespace;
var updatesSocketNamespace;
var numCurrentReconnectAttempts = 0;
var currentlyElecting = false;
var currentlyFindingMaster = false;
const maxMasterNodeReconnectAttempts = 4;
const maxMasterNodeConnectTimeout = 10000;
var masterConnected = false;
//TODO: set in env vars
const TEMP_UPDATE_INTERVAL_SECONDS = 5;
var workerNodesListener;
var clientTempInterval;

var roomDesignator;
configController.getRoomDesignator()
	.then(data => {
		roomDesignator = data.value;
	})

function LeaderController() {
	// on startup if we don't connect to master within timeout, begin leader election
	setTimeout(function() {
		if (!masterConnected && !currentlyElecting && !currentlyFindingMaster) {
			console.log('Max timeout waiting for master node, electing new leader')
			leaderElection();
		}
	}, maxMasterNodeConnectTimeout)

	getMasterNode()
	.then(masterNodes => {
		var masterNodeRunning = false;
		var nodeAddress;
		masterNodes.forEach(node => {
			if (!node.error) {
				masterNodeRunning = true;
				nodeAddress = node.address;
				return;
			}
		})

		if (masterNodeRunning) {
			console.log(colors.green('Master node found at', nodeAddress))
			initSocketNamespaces(`http://${nodeAddress}:5555`);
		} else {
			console.log(colors.yellow('Master node not running, beginning leader election'))
			currentlyFindingMaster = false;
			leaderElection();
		}
	})

	// const reportSocket = io(`${leadershipUrl}/reports`)
	// reportSocket.on('connect', function(){
	// 	console.log('master reports connected')
	// });
	// reportSocket.on('event', function(data){
	// 	console.log('event')
	// });
	// reportSocket.on('disconnect', function(){
	// 	console.log('master reports disconnected')
	// });
}

function getNewNamespaceSocket(masterNodeAddress, namespace) {
	return io(`${masterNodeAddress}/${namespace}`);
}

function initSocketNamespaces(masterNodeAddress) {
	leadershipSocketNamespace = getNewNamespaceSocket(masterNodeAddress, 'leadership');
	leadershipSocketNamespace.on('connect', function() {
		currentlyFindingMaster = false;
		masterConnected = true;
		workerNodesListener([]);
		currentlyElecting = false;
		numCurrentReconnectAttempts = 0;
		console.log('connected to master node');
		leadershipSocketNamespace.emit('register', roomDesignator);
	});

	leadershipSocketNamespace.on('disconnect', function() {
		masterConnected = false;
		console.log('disconnected from master node')
	});

	leadershipSocketNamespace.on('reconnect_attempt', function() {
		console.log(`master leadership reconnect attempt number ${numCurrentReconnectAttempts}`)
		if (!currentlyElecting && numCurrentReconnectAttempts >= maxMasterNodeReconnectAttempts) {
			leaderElection();
		}
		numCurrentReconnectAttempts++;
	});

	updatesSocketNamespace = getNewNamespaceSocket(masterNodeAddress, 'updates.worker');
	updatesSocketNamespace.on('connect', function(){
		configController.getDesiredTemp()
			.then(data => {
				updatesSocketNamespace.emit('desired', {room: roomDesignator, temp: data.value})
			})
	})
	updatesSocketNamespace.on('request-desired', function(){
		configController.getDesiredTemp()
			.then(data => {
				updatesSocketNamespace.emit('desired', {
					room: roomDesignator,
					temp: data.value
				})
			})
	})
	updatesSocketNamespace.on('request-current', function(){
		updatesSocketNamespace.emit('current', {
			room: roomDesignator,
			temp: configController.getCurrentTemp()
		})
	})

	//TODO: use same interval for programController
	clientTempInterval = setInterval(() => {
		updatesSocketNamespace.emit('current', {
			room: roomDesignator,
			temp: configController.getCurrentTemp()
		})
		configController.getDesiredTemp()
			.then(data => {
				updatesSocketNamespace.emit('desired', {
					room: roomDesignator,
					temp: data.value
				})
			})
	}, TEMP_UPDATE_INTERVAL_SECONDS * 1000);
}

function leaderElection() {
	currentlyElecting = true;

	const rank = randomIntFromInterval();
	getAllWorkerNodes()
		.then(workerNodes => {
			const workerNodeList = workerNodes.filter(node => {
				return !node.error;
			})
			const localIp = getLocalIpAddress();
			var currentNodeFound = false;
			workerNodeList.forEach(node => {
				if (node.address === localIp) {
					currentNodeFound = true;
				}
			})
			if (!currentNodeFound) {
				workerNodeList.push({address: localIp});
			}

			workerNodesListener(workerNodeList);
			const promises = workerNodeList.filter(node => {
				if (!node.error) {
					return sendRank(rank, node.address, localIp);
				}
			})

			Promise.all(promises)
			.then(workerAddresses => {
				console.log('sent rank to all other worker nodes', workerAddresses)
			})
			.catch(err => {
				console.log(err)
			})
		})
}

function getAllWorkerNodes() {
	return findLocalDevices().then(devices => {
		var workerNodePromises = devices.map(device => {
			return isWorkerNode(device.ip);
		})
		return Promise.all(workerNodePromises);
	})
}

function getMasterNode() {
	currentlyFindingMaster = true;
	return findLocalDevices().then(devices => {
		var masterNodePromises = devices.map(device => {
			return isMasterNode(device.ip);
		})
		return Promise.all(masterNodePromises);
	})
}

function isMasterNode(node) {
	const options = {
    headers: {
    	'content-type': 'application/json'
    },
    url: `http://${node}:5555/challenge`,
    method: 'POST',
    timeout: 2000,
    body: JSON.stringify({
			code: process.env.CHALLENGE_TOKEN
    })
	}
	return new Promise((resolve, reject) => {
		request(options, function(error, response, body) {
	    if (error) {
	      resolve({error: true})
	    } else {
	      if (response.statusCode === 200) {
	        resolve({address: node});
	      } else {
	        resolve({error: true});
	      }
	    }
	  });
	})
}


function isWorkerNode(node) {
	const options = {
    headers: {
    	'content-type': 'application/json'
    },
    url: `http://${node}:8888/challenge`,
    method: 'POST',
    timeout: 2000,
    body: JSON.stringify({
			code: process.env.CHALLENGE_TOKEN
    })
	}
	return new Promise((resolve, reject) => {
		request(options, function(error, response, body) {
	    if (error) {
	      resolve({error: true})
	    } else {
	      if (response.statusCode === 200) {
	        resolve({address: node});
	      } else {
	        resolve({error: true});
	      }
	    }
	  });
	})
}

function getLocalIpAddress() {
	var ifs = require('os').networkInterfaces();
	var result = Object.keys(ifs)
	  .map(x => [x, ifs[x].filter(x => x.family === 'IPv4')[0]])
	  .filter(x => x[1])
	  .map(x => x[1].address);
	// return result[result.length - 1];
	return result[1];
}

function sendRank(rank, node, localIp) {
	const options = {
    headers: {
    	'content-type': 'application/json'
    },
    url: `http://${node}:8888/election`,
    method: 'POST',
    body: JSON.stringify({
    	rank,
			hostname: localIp
    })
	}
	return new Promise((resolve, reject) => {
		request(options, function(error, response, body) {
	    if (error) {
	      reject(error)
	    } else {
	      if (response.statusCode === 200) {
	        resolve(body);
	      } else {
	        reject(body);
	      }
	    }
	  });
	})
}

function randomIntFromInterval() {
  return Math.floor(Math.random()*(10001));
}

LeaderController.prototype.addWorkerNodeListener = function(listener) {
	workerNodesListener = listener;
}

LeaderController.prototype.setMasterNodeAddress = function(address) {
	console.log('setting new master node address', address)
	if (leadershipSocketNamespace) {
		leadershipSocketNamespace.removeAllListeners();
		updatesSocketNamespace.removeAllListeners();
	}
	if (clientTempInterval) {
		clearInterval(clientTempInterval);
	}
	initSocketNamespaces(`http://${address}:5555`)
}

module.exports = LeaderController;

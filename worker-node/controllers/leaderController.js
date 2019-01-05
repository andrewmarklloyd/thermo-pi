const config = require('../config/config');
const colors = require('colors');
const findLocalDevices = require('local-devices');
const nodeSSDP = require('node-ssdp');
//TODO: append uuid env var to this
//https://github.com/nicholaswilde/rpi-smartthings/blob/master/server.js
const WORKER_SERVICE_URN = 'urn:schemas-upnp-org:service:ThermoPi:Worker';
const MASTER_SERVICE_URN = 'urn:schemas-upnp-org:service:ThermoPi:Master';
const SSDPServer = nodeSSDP.Server;
const SSDPClient = nodeSSDP.Client;
const workerssdpServer = new SSDPServer();
const ssdpClient = new SSDPClient();
workerssdpServer.addUSN(WORKER_SERVICE_URN);
workerssdpServer.start();

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
	.then(masterNodeAddress => {
		console.log(masterNodeAddress)
		var masterNodeRunning = masterNodeAddress !== null;

		if (masterNodeRunning) {
			console.log(colors.green('Master node found at', masterNodeAddress))
			initSocketNamespaces(`http://${masterNodeAddress}:5555`);
		} else {
			console.log(colors.yellow('Master node not running, beginning leader election'))
			currentlyFindingMaster = false;
			leaderElection();
		}
	})
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
	const localIp = getLocalIpAddress();
	const rank = randomIntFromInterval();
	getAllWorkerNodesSSDP().then(nodes => {
		const promises = [];
		workerNodesListener(Array.from(nodes));
		nodes.forEach(node => {
			promises.push(sendRank(rank, node.address, localIp));
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

function getAllWorkerNodesSSDP() {
	const workerNodes = new Set();
	ssdpClient.on('response', function (headers, statusCode, rinfo) {
		workerNodes.add({address: rinfo.address});
	});
	ssdpClient.search(WORKER_SERVICE_URN);

	return new Promise((resolve, reject) => {
		setTimeout(() => {
			ssdpClient.stop();
			resolve(workerNodes);
		}, 3000)
	});
}

function getMasterNode() {
	currentlyFindingMaster = true;
	var masterNodeAddress = null;
	ssdpClient.on('response', function (headers, statusCode, rinfo) {
		masterNodeAddress = rinfo.address;
	});
	ssdpClient.search(MASTER_SERVICE_URN);

	return new Promise((resolve, reject) => {
		setTimeout(() => {
			ssdpClient.stop();
			resolve(masterNodeAddress);
		}, 3000)
	});
}

function getLocalIpAddress() {
	return require('ip').address();
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
	        resolve({address: node});
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

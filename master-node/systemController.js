const config = require('./config/config');

function setupIngress(callback) {
	const IngressController = require('./controllers/ingressController');
	const ingressController = new IngressController();
	ingressController.openIngress().then(() => {
		console.log('Ingress OPENED for device')
		callback();
	})
	.catch(err => {
		console.log(err)
		console.log('****** Device has no ingress, app is not accessible from outside of network!')
		callback();
	})
}

function initialize() {
	const nodeSSDP = require('node-ssdp');
	const SSDPServer = nodeSSDP.Server;
	const masterssdpServer = new SSDPServer();
	const MASTER_SERVICE_URN = 'urn:schemas-upnp-org:service:ThermoPi:Master';
	masterssdpServer.addUSN(MASTER_SERVICE_URN);
	masterssdpServer.start();

	const WorkerNodeInterface = require('./controllers/workerNodeInterface.js');
	const workerNodeInterface = new WorkerNodeInterface();

	const ServerController = require('./controllers/serverController.js');
	const serverController = new ServerController();

	serverController.addWorkerRegisterListener((data) => {
		workerNodeInterface.setRoomAddress(data)
	});

	serverController.addWorkerDisconnectListener((data) => {
		workerNodeInterface.removeRoomAddress(data)
	});

	serverController.setRoomTempListener((roomTemp, callback) => {
		workerNodeInterface.setRoomTemp(roomTemp, callback);
	})
}

if (config.env === 'production') {
	setupIngress(() => {
		initialize();
	});
} else {
	initialize();
}

function initialize() {
	const IngressController = require('./controllers/ingressController');
	const ingressController = new IngressController();
	ingressController.openIngress().then(() => {
	  console.log('Ingress OPENED for device')
	})
	.catch(err => {
	  console.log(err)
		console.log('****** Device has no ingress, app is not accessible from outside of network!')
	})

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

initialize();

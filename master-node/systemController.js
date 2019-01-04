function initialize() {
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

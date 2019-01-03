const config = require('./config/config')

function initialize() {
	const WorkerNodeInterface = require('./controllers/workerNodeInterface.js');
	const workerNodeInterface = new WorkerNodeInterface();

	const ServerController = require('./controllers/serverController.js');
	const serverController = new ServerController();

	serverController.addWorkerRegisterListener((data) => {
		//TODO what if we lose a worker. We need to notify the workernode interface
		workerNodeInterface.setRoomAddress(data)
	});

	serverController.setRoomTempListener((roomTemp, callback) => {
		workerNodeInterface.setRoomTemp(roomTemp, callback);
	})
}


initialize();

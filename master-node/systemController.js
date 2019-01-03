const config = require('./config/config')

function initialize() {
	// const TouchOSCController = require('./controllers/touchOscController.js');
	// const touchOscController = new TouchOSCController();

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

	// touchOscController.setHeaterListener((roomStatus, callback) => {
	// 	workerNodeInterface.setHeaterStatus(roomStatus, callback);
	// })
}


initialize();

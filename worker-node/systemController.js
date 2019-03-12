const config = require('./config/config');
const colors = require('colors');
var restServer;

if (process.argv[2] === '--initialize') {
  const initServer = require('./initServer')
} else {
  runApplication();
}

function runApplication() {
  restServer = require('./restServer');

  console.log(colors.yellow(`Running worker node in ${config.env} environment`))
  restServer.addStartMasterProcessListener(() => {
    console.log(colors.green('Worker node was elected leader, starting master process'))
    startMasterProcess();
  });

  const ProgramController = require('./controllers/programController');
  programController = new ProgramController();
  programController.runProgram();
  restServer.setProgramController(programController);
}


function startMasterProcess() {
  console.log(colors.yellow('Starting master node process'));
  var command;
  const masterSystemController = require('../master-node/systemController');
  console.log(masterSystemController)
}

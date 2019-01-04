const config = require('./config/config');
const colors = require('colors');
const { exec } = require('child_process');
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
  var command;
  if (config.env === 'production') {
    command = 'npm start --prefix /home/pi/thermo-pi/master-node';
  } else {
    command = 'cd ../master-node && npm start';
  }
  console.log(colors.yellow('Starting master node process'));
  const childProcess = exec(command, {
    shell: true
  });

  childProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  childProcess.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  childProcess.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
}

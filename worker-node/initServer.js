const config = require('./config/config');
const fs = require('fs');
const colors = require('colors');
const express = require('express');
const bodyParser = require('body-parser');
const ConfigController = require('./controllers/configController');
const configController = new ConfigController();
const { exec } = require('child_process');

var app = express();
app.use(bodyParser.json())

//TODO: use ssdp to get config?
//https://github.com/ddavignon/pi-connectivity
app.get('/', function(req, res) {
  res.sendFile(`${__dirname}/web/index.html`)
});

app.get('/config.js', function(req, res) {
  res.sendFile(`${__dirname}/web/config.js`);
});

app.post('/', function(req, res) {
  if (!req.body.room) {
    return res.status(500).json({error: 'please send room payload'})
  }
  configController.setRoomDesignator(req.body.room).then(() => {
    return configController.setDeviceInitialized();
  })
  .then(() => {
    res.json({
      result: 'success',
      error: null
    });
    setTimeout(function() {
      if (config.env === 'production') {
        restartDevice();
      }
    }, 1000)
  })
  .catch((err) => {
    res.status(500).json({
      result: 'failed',
      error: err
    })
  })
})

app.listen(8888, '0.0.0.0');

function restartDevice() {
  var command = 'sudo reboot now';

  console.log(colors.red('Restarting node now'));
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

const os = require('os');
const colors = require('colors');
const express = require('express');
const bodyParser = require('body-parser');
const LeaderController = require('./controllers/leaderController');
const leaderController = new LeaderController();
var programController;
var startMasterProcessListener;
var electionCandidates = {}
var registeredWorkerNodes = [];
leaderController.addWorkerNodeListener((workerNodes) => {
  registeredWorkerNodes = workerNodes;
});

var app = express();
app.use(bodyParser.json())

app.post('/control', function(req, res) {
  switch (req.body.status) {
    case 'up':
      programController.increaseDesiredTemp()
      .then(data => {
        successResponse(res, {desiredTemp: data.value});
      })
      break;
    case 'down':
      programController.decreaseDesiredTemp()
      .then(data => {
        successResponse(res, {desiredTemp: data.value});
      })
      break;
    default:
      break;
  }
});

app.post('/challenge', function(req, res) {
  if (req.body.code === '12345') {
    res.status(200).json({result: 'success'})
  } else {
    res.status(500).json({result: 'fail'})
  }
})

// the master node is down, accept the rank
app.post('/election', function(req, res) {
  electionCandidates[req.body.rank] = req.body.hostname;
  var candidateKeys = Object.keys(electionCandidates);
  if (candidateKeys.length == registeredWorkerNodes.length) {
    console.log('All registered worker nodes sent ranks. Beginning leader determination');
    const ordered = {};
    candidateKeys.sort().forEach(function(key) {
      ordered[key] = electionCandidates[key];
    });
    var newMasterNodeAddress = ordered[Object.keys(ordered)[0]];
    console.log('New master node has been elected!', newMasterNodeAddress)
    leaderController.setMasterNodeAddress(newMasterNodeAddress);
    var ifs = require('os').networkInterfaces();
  	var result = Object.keys(ifs)
  	  .map(x => [x, ifs[x].filter(x => x.family === 'IPv4')[0]])
  	  .filter(x => x[1])
  	  .map(x => x[1].address);
    if (result[1] === newMasterNodeAddress) {
      electionCandidates = {}
      startMasterProcessListener();
    } else {
      electionCandidates = {}
      console.log('Worker lost election')
    }
  } else {
    console.log('received rank, current election candidates:', electionCandidates)
  }
  res.json({result: 'received'})
});

function successResponse(res, data) {
  res.status(200).send(data);
}

function errorResponse(res, err) {
  res.status(500).send({
    'error': err
  });
}

module.exports.addStartMasterProcessListener = function(listener) {
  startMasterProcessListener = listener;
}

module.exports.setProgramController = function(controller) {
  programController = controller;
}

app.listen(8888);

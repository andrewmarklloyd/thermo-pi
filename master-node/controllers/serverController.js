const config = require('../config/config')
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const GoogleApi = require('./googleSheetsController');
const googleApi = new GoogleApi();
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(config.google.client.id);
const server = require('http').Server(app);
const io = require('socket.io')(server);
server.listen(5555);
const fs = require('fs');
const registerListeners = [];
var roomTempListener = null;
const TwoWayMap = require('../helpers/TwoWayMap')
var socketClientsTwoWayMap = new TwoWayMap();
const socketClients = {};

const leadershipNamespace = io.of('/leadership');
const clientUpdatesNamespace = io.of('/updates.client');
const workerUpdatesNamespace = io.of('/updates.worker')

async function verify(token) {
	const ticket = await client.verifyIdToken({
      idToken: token,
      audience: config.google.client.id,
  });
  const payload = ticket.getPayload();
  const userid = payload['sub'];
	return Promise.resolve(userid);
}

app.use(bodyParser.json())
app.use(cookieParser());

function requireLogin(req, res, next) {
	if (req.cookies.user === undefined) {
    res.redirect('/login');
  } else {
		next();
	}
};

app.post('/login', function (req, res) {
	verify(req.body.id_token).then(response => {
		const authorizedUsers = config.authorizedUsers;
		var userOk;
		authorizedUsers.forEach(user => {
			if (user === response) {
				userOk = true;
				return;
			}
		})
		if (userOk) {
      res.cookie('user', response, { maxAge: 900000, httpOnly: true });
			res.status(200).json({result: 'success'});
		} else {
			res.status(500).json({result: 'error'})
		}
	}).catch(err => {
		console.log(err)
		res.status(500).json({result: 'error'})
	})
});

app.get('/login', function (req, res) {
	res.sendFile(`${__dirname}/web/login.html`);
});

app.get('/', requireLogin, function (req, res) {
	res.sendFile(`${__dirname}/web/index.html`);
});

app.get('/config.js', function(req, res) {
  res.sendFile(`${__dirname}/web/config.js`);
});

app.get('/login.js', function(req, res) {
  res.sendFile(`${__dirname}/web/login.js`);
});

app.post('/challenge', function(req, res) {
  if (req.body.code === '12345') {
    res.status(200).json({result: 'success'})
  } else {
    res.status(500).json({result: 'fail'})
  }
})

app.post('/temp', function (req, res) {
	if (roomTempListener === null) {
		return res.status(500).json({error: 'Master node not initialized yet, please try again.'})
	}
	if (!req.body || !req.body.room || !req.body.direction) {
		return res.status(500).json({error: 'Send "room" and temperatur "direction" in json body'})
	}
	const room = req.body.room;
	const direction = req.body.direction;

	roomTempListener({room, direction}, (error, data) => {
		if (error) {
			res.status(500).json({error: `An error occurred: ${error}`})
		} else {
			res.status(200).send(data)
		}
	})
});

leadershipNamespace.on('connect', function (socket) {

	socket.on('register', function(roomFunction) {
		socketClientsTwoWayMap.set(socket.id, roomFunction);
		clientUpdatesNamespace.emit('worker-connection', {
			room: roomFunction,
			status: 'connected'
		});
		registerListeners.forEach(listener => {
			listener({
				roomFunction,
				address: socket.request.connection.remoteAddress.replace('::ffff:','')
			});
		})
	})
	socket.on('disconnect', function () {
		clientUpdatesNamespace.emit('worker-connection', {
			room: socketClientsTwoWayMap.get(socket.id),
			status: 'disconnected'
		});
		socketClientsTwoWayMap.delete(socket.id);
	})
})

var bucket = {}
workerUpdatesNamespace.on('connect', function (socket) {
	socket.on('desired', function(data) {
		clientUpdatesNamespace.emit('desired', data)
	})

	socket.on('current', function(data) {
		bucket[data.room] = data.temp;
			googleApi.addTempEntry([
				new Date(),
				!socketClientsTwoWayMap.revGet('laundry') ? null : bucket.laundry,
				!socketClientsTwoWayMap.revGet('living') ? null : bucket.living,
				!socketClientsTwoWayMap.revGet('kitchen') ? null : bucket.kitchen
			])
		clientUpdatesNamespace.emit('current', data)
	})
})

clientUpdatesNamespace.on('connect', function (socket) {
	workerUpdatesNamespace.emit('request-desired');
	workerUpdatesNamespace.emit('request-current');
	var keys = socketClientsTwoWayMap.getAllKeys();
	keys.forEach(key => {
		clientUpdatesNamespace.emit('worker-connection', {
			room: socketClientsTwoWayMap.get(key),
			status: 'connected'
		});
	})
})

function ServerController() {

}

ServerController.prototype.addWorkerRegisterListener = function(listener) {
	registerListeners.push(listener);
}

ServerController.prototype.setRoomTempListener = function(listener) {
	roomTempListener = listener;
}


module.exports = ServerController;

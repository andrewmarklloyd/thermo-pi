// const config = require('../config/config');
const natUpnp = require('../lib/nat-upnp');
var client;

function IngressController() {

}

function createPortMapping(client, host, port) {
  return new Promise((resolve, reject) => {
		const private = !host ? port : {host, port: port}
    client.portMapping({
      public: port,
			private,
      description: 'Thermo-pi master node',
      ttl: 0
    }, function(err) {
      if (err) {
        reject(err)
      } else {
        resolve();
      }
    });
  })
}

function removePortMapping(client, publicPort) {
  return new Promise((resolve, reject) => {
    client.portUnmapping({
      public: publicPort
    }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(publicPort);
      }
    })
  })
}

function removeAllMappings(client) {
  return new Promise((resolve, reject) => {
    client.getMappings(function(err, mappings) {
      if (err) {
        reject(err)
      } else {
        const promises = mappings.map(mapping => {
          return removePortMapping(client, mapping.public.port);
        })
        resolve(Promise.all(promises));
      }
    });
  })
}

IngressController.prototype.openIngress = function(host, port) {
	client = natUpnp.createClient();
	return removeAllMappings(client).then(result => {
	  return createPortMapping(client, host, port);
	})
	.then(d => {
		client.close();
		return Promise.resolve();
	})
	.catch(e => {
		client.close();
		return Promise.reject(e);
	})
}

IngressController.prototype.closeIngress = function() {
	client = natUpnp.createClient();
	return removeAllMappings(client)
		.then(() => {
			client.close();
			return Promise.resolve();
		})
		.catch(e => {
			client.close();
			return Promise.reject(e);
		})
}

module.exports = IngressController;

// const config = require('../config/config');
const natUpnp = require('../lib/nat-upnp');
var client;

function IngressController() {

}

function createPortMapping(client, host) {
  return new Promise((resolve, reject) => {
		const private = !host ? 443 : {host, port: 443}
    client.portMapping({
      public: 443,
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

IngressController.prototype.openIngress = function(host) {
	client = natUpnp.createClient();
	return removeAllMappings(client).then(result => {
	  return createPortMapping(client, host);
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

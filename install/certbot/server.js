// Dependencies
const express = require('express');

// Configure & Run the http server
const app = express();

app.use(express.static(__dirname, { dotfiles: 'allow' } ));

app.listen(5555, () => {
  console.log('HTTP server running on port 80');
});

const IngressController = require('../../master-node/controllers/ingressController');
const ingressController = new IngressController();

ingressController.openIngress(null, 80).then(() => {
  console.log('Ingress OPENED for device on external port 80')
})
.catch(err => {
  console.log(err)
  console.log('****** Device has no ingress, app is not accessible from outside of network!')
  process.exit()
})

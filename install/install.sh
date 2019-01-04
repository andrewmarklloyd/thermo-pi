#!/bin/bash

function updateOS() {
  sudo apt-get update
}

function installNodejs() {
  processor=$(uname -m)
  baseOs=$(uname | tr '[:upper:]' '[:lower:]')
  VERSION=v10.14.2
  DEV="false"
  # need to verify these urls will always be here
  if [[ ${processor} == *ARMv6* ]]; then
    # raspi zero uses ARMv6
    ARCH=armv6l
  elif [[ ${processor} == *ARMv7* ]]; then
    # raspi 2 uses ARMv7
    ARCH=armv7l
  elif [[ ${processor} == *x86_64* ]]; then
    ARCH=x64
    DEV='true'
  else
    ARCH=armv7l
  fi

  wget "https://nodejs.org/dist/${VERSION}/node-${VERSION}-${baseOs}-${ARCH}.tar.gz"
  tar -xzf node-${VERSION}-${baseOs}-${ARCH}.tar.gz
  rm node-${VERSION}-${baseOs}-${ARCH}.tar.gz

  if [[ ${DEV} == 'true' ]]; then
    ./node-${VERSION}-${baseOs}-${ARCH}/bin/node -v
    ./node-${VERSION}-${baseOs}-${ARCH}/bin/npm -v
    echo 'dev environment, not installing node.js'
  else
    cd node-${VERSION}-${baseOs}-${ARCH}
    sudo cp -R * /usr/local/
    node -v
    npm -v
    cd ../
    rm -rf node-${VERSION}-${baseOs}-${ARCH}/
  fi
}

function installApplication() {
  # install the application and dependencies
  cd /home/pi
  sudo apt-get install git -y
  git clone https://github.com/andrewmarklloyd/thermo-pi.git
  cd thermo-pi/master-node
  npm run install.prod
  cd ../worker-node
  npm run install.prod
}

function configureDefaults() {
  CONFIG_DIR=/srv/thermo-pi/
  sudo mkdir -p ${CONFIG_DIR}
  sudo chown -R `whoami`:`whoami` ${CONFIG_DIR}
  echo '{"value":"66"}' > "${CONFIG_DIR}desiredTemp.json"
  echo '{"value":"2"}' > "${CONFIG_DIR}lowTolerance.json"
  echo '{"value":"1"}' > "${CONFIG_DIR}upperTolerance.json"
  echo '{"value":false}' > "${CONFIG_DIR}overrideMode.json"
}

function configureStartup() {
  sudo cp /home/pi/thermo-pi/install/thermo-pi /etc/init.d/thermo-pi
  sudo chmod 755 /etc/init.d/thermo-pi
  sudo update-rc.d thermo-pi defaults
}

function configHardware() {
  sudo bash -c "echo dtoverlay=w1-gpio,gpiopin=4,pullup=on >> /boot/config.txt"
}

function configureProxy() {
  # sudo apt-get install nginx -y
  # sudo /etc/init.d/nginx start
  # sudo nano /etc/nginx/sites-available/default
  # sudo systemctl restart nginx
  # location / {
  #       proxy_pass http://localhost:5555;
  #       proxy_http_version 1.1;
  #       proxy_set_header Upgrade $http_upgrade;
  #       proxy_set_header Connection 'upgrade';
  #       proxy_set_header Host $host;
  #       proxy_cache_bypass $http_upgrade;
  #   }
}

function configCert() {
  sudo add-apt-repository ppa:certbot/certbot
  sudo apt-get update
  sudo apt-get install certbot
  certbot certonly --manual

  # https://itnext.io/node-express-letsencrypt-generate-a-free-ssl-certificate-and-run-an-https-server-in-5-minutes-a730fbe528ca
}

function restartDevice() {
  sudo reboot now
}

installNodejs
# full-run:
# installNodejs
# installApplication
# configureDefaults
# configureStartup
# restartDevice

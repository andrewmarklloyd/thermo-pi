FROM arm32v7/node:8.14.0-jessie

RUN mkdir -p /app

# set /app directory as default working directory
WORKDIR /app

# only copy package.json initially so that `RUN npm install` layer is recreated only
# if there are changes in package.json
ADD package.json package-lock.json /app/

# --no-save: Don’t generate a package-lock.json lockfile
RUN npm install --no-save --only=prod

# copy all file from current dir to /app in container
COPY . /app/

# cmd to start service
CMD [ "npm", "start" ]

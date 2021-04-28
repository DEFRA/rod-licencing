# Guidance for using docker

## Prerequisites

- Node v14+ (to execute npm helper scripts only)
- Docker v18.06.0+ (to run the docker services)

You'll also need to initialise a local docker swarm before you can run the infrastructure or services locally. To do so, run the following
command (you'll only need to do this once):

```shell script
docker swarm init
```

## Infrastructure

The [infrastructure.yml](infrastructure.yml) docker-compose file contains everything that the service depends on to run.

To start the infrastructure, run the following command in the root of the rod-licensing repository:

```shell script
npm run docker:infrastructure
```

This will start a docker stack named `rli` you should be able to see this listed by typing `docker stack ls`
Should you need to, this stack can be terminated by running `docker stack rm rli`

The services exposed when this docker-compose file is executed are described below:

### DynamoDB

A local instance of DynamoDB is exposed on port 4569 and will be configured with the necessary tables to run the digital service locally

#### DynamoDB admin interface

The excellent DynamoDB administration tool by aaronshaf (see [aaronshaf/dynamodb-admin](https://github.com/aaronshaf/dynamodb-admin)) is
exposed on port 8002. This can be opened in your browser by visiting [http://localhost:8002/](http://localhost:8002/) where you will be
able to explore the content of each table and modify/delete records as necessary.

### SQS

A local instance of ElasticMQ is used to emulate SQS. It is exposed on port 9324 and will be configured with the necessary FIFO SQS queues
to run the digital services locally.

Tips:

- You can purge all messages on a queue by executing the PurgeQueue action on a given QueueURL
  - For example: http://0.0.0.0:9324/queue/TransactionsQueue.fifo?Action=PurgeQueue

### S3

A local instance of S3 is exposed on port 4572 and will be created with the necessary buckets to run the service.

### Redis

A local instance of Redis will be exposed on port 6379. It is used by the:

- gafl-webapp-service - to manage sessions
- sales-api-service - to cache reference data

#### Redis Insights

The redis-insights tool can be used to explore the content of the redis store, it can be accessed via [http://localhost:8001/](http://localhost:8001/)

#### Redis Commander

Alternatively you can also use redis-commander which can be accessed via [http://localhost:8003/](http://localhost:8003/)

## Services

To support running the services locally using docker, there are three different docker-compose files:

- [services.build.yml](services.build.yml)
  > This contains the necessary definitions to allow docker images to be built both in development and production mode
- [services.dev.yml](services.dev.yml)
  > This contains the necessary definitions to allow the services to be run in development mode.
  > In development mode, the images mount the filesystem of the host to execute the service in containers. This is useful
  > to quickly run all of the services and containers will automatically restart whenever changes are made to the source.
  > This is accomplished by using pm2-dev which automatically watches the filesystem for changes.
- [services.yml](services.yml)
  > This contains the necessary definitions to allow the services to be run in production mode.
  > Building the containers in production mode takes longer as all node modules need to be installed and additional build
  > steps such as compiling SASS need to be performed.

In order to run the services locally, you'll need to insert the appropriate values into the environment files ending with .secrets.env
in the [env](env) folder.

### How to run

There are a number of convenience scripts setup in the root `package.json`

#### Production mode

Building and running the images in production mode runs a full build of all services using the [rod_licensing/builder](../Dockerfile.build) image
to execute any build steps before copying resources into an image based on the [rod_licensing/base](../Dockerfile.base). The base image only includes
binaries that are essential to run the services and does not include any build-time dependencies.

To build the images:

```shell script
npm run docker:build
```

To run the services:

```shell script
npm run docker:services
```

To stop the running services

```shell script
docker stack rm rls
```

#### Development mode

Building and running the images in development mode does not run any of the build steps and requires that the services are correctly built on the host
system. In development mode, the host filesystem is mounted directly into the container for each service and the services are executed using pm2-dev
which watches the source files for changes, automatically restarting the process when changes are detected.

> Ensure that you have the packages properly setup on your host system by running `npm install` in the root of the repository.

To build the images:

```shell script
npm run docker:build-dev
```

To run the services:

```shell script
npm run docker:services-dev
```

To stop the running services

```shell script
docker stack rm rls
```

### HTTPS

In order for the OAuth 2.0 authentication to work on a users development environment for the telesales version of the service, it is necessary to run the service using HTTPS.

To do this an nginx ssl reverse proxy has been provided which will serve the pages from:

1. [https://localhost:3043]() - websales
2. [https://localhost:3143]() - telesales

The reverse proxy is started as part of the infrastructure stack (rli), however a root certificate will need to be installed on the keychain of the local machine.

The root certificate file can be found at

```
./resources/infrastructure/nginx/ca/ca.pem
```

In order to add the root certificate to the keychain the following command can be used on MAC-OS:

```shell script
sudo security add-trusted-cert -d -r trustRoot -k "/Library/Keychains/System.keychain" ./resources/infrastructure/nginx/ca/ca.pem
```

Alternatively the graphical application `Key Chain access app` may be used. There are analogous processes available for Windows; "Credential Manager" that can be found in "Control Panel" and "update-ca-certificates" for Ubuntu.

This procedure will not work if the user is using Firefox. Firefox uses Mozilla's proprietary root certificate store NSS.

## Logs

To get the logs do `docker stack ps rls`, get the container id of the service you’re interested in, then do `docker service logs <id>`

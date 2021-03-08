# Choirless Application Server

This repository contains the source code for the Choirless project's web-based front end. It is a [Node.js](https://nodejs.org/) [Express](https://expressjs.com/) app designed to run under [Cloud Foundry](https://www.ibm.com/uk-en/cloud/cloud-foundry) on the IBM Cloud.

The application server requires two services to operate correctly. You will need to [create an IBM Cloud account](https://developer.ibm.com/dwwi/jsp/register.jsp?eventid=cfc-2020-projects) in order to provision them.

- [The Choirless API](https://github.com/Choirless/choirlessapi) - a RESTful HTTP API that allows the application server to create & update choirs, songs and song parts. 
- [IBM Cloud Object Storage](https://www.ibm.com/uk-en/cloud/object-storage) - to store uploaded video content. Provision an IBM Cloud Object Storage service and generate HMAC-compatible credentials which the application server will pick up from environment variables.

## Running locally

Clone the repo:

```sh
git clone https://github.com/Choirless/Application-Server.git
cd Application-Server
```

Install the dependencies

```sh
npm install
```

Setup environment variables by editing a `.env` file:

```
SESSION_SECRET=abc123
NODE_ENV=dev
CHOIRLESS_API_ENDPOINT=http://localhost:3000
CHOIRLESS_API_KEY=xyz987
COS_DEFAULT_BUCKET=mybucket
COS_ACCESS_KEY_SECRET=mysecret
COS_ACCESS_KEY_ID=myaccesskeyid
COS_ENDPOINT=my.cos.endpoint.com
COS_REGION=eu-geo
PORT=8000
```

Run the server

```sh
npm run start
```

You can now visit the Choirless website on http://localhost:8000


## Debugging

To view additional debug while running, start the application server with:

```sh
DEBUG=* npm run start
```

## Environment variables

- `SESSION_SECRET` - data used to encrypt session cookie used during authentication.
- `NODE_ENV` - if this is `production` then the app runs in a more secure mode; insisting on `https`, for instance.
- `CHOIRLESS_API_ENDPOINT` - the URL of the Choirless API server e.g. `http://localhost:3000`
- `CHOIRLESS_API_KEY` - the API key used when communicating with the Choirless API server.
- `COS_DEFAULT_BUCKET` - the name of the Cloud Object Storage bucket used to store video uploads.
- `COS_ACCESS_KEY_SECRET` - HMAC credentials for accessing Cloud Object Storage.
- `COS_ACCESS_KEY_ID` - HMAC credentials for accessing Cloud Object Storage.
- `COS_ENDPOINT` - hostname of the [Cloud Object Storage endpoints](https://cloud.ibm.com/docs/cloud-object-storage?topic=cloud-object-storage-endpoints#:~:text=Endpoint%20Types,and%20other%20cloud%20storage%20services.). 
- `PORT` - the HTTP port used to serve out the application. Default 3000.

## Deploying to Cloud Foundry

- Create a new Cloud Foundry application in the IBM Cloud Dashboard
- Install the [IBM Cloud CLI](https://cloud.ibm.com/docs/cli) and follow the instructions to authenticate with your IBM Cloud credentials
- Deploy this app with:

```sh
ic cf push
```

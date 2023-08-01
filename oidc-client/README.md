# DEVELOPER PORTAL CLIENT

## HOW TO RUN

#### DEVELOPMENT
- before running the server change the openIdPath & openIdBaseURL to development.
- run ```npm run build-dev``` to start building client in watch mode
- in new terminal run ```npm run preview```
- client will run on http://localhost:4173
- run ```npm run deploy-dev``` to deploy it on gcp at fw-developerportal-dev.web.app

#### PRODUCTION
- before deploying or building the client change the openIdPath & openIdBaseURL to production
- run ```npm run deploy-prod``` to build and deploy the server
- run ```npm run build``` to build the client
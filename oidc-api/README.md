# FUNDWAVE ID API
## Environmental Variables
- .env is for development environment. 
- .env.yaml & .env.build.yaml is for production environment.
- required variables mentioned inside .env.template & .env.build.template
## Run Command

- #### Development
    - ```npm run dev```
    - Ensure that .env is present with all the env variables present in .env.template
    - Server will run at http://localhost:3000
- #### Production
    - ```npm run deploy```
    - Server will run at GCP.
    - Ensure that .env.yaml is there with all the env present in .env.template & similarly .env.build.yaml is also there

## Possible Error Fixes
- Check if the logged in user is **NOT** Admin. Admin created tokens doesn't have certain fields ,so it will break the app.
- Check if the token is being generated.
- If there is error in refresh token endpoint it's most likely because of invalid parameters.
    -  Format to pass token in oidcConsumer -
    - ```{
        token : {
            access_token : ACCESS_TOKEN,
            refresh_token: REFRESH_TOKEN,
            id_token: ID_TOKEN,
        }
- If the error says **invalid_redirect_uri**
    - make sure the redirect uri is valid
    - make sure the redirect uri is mentioned in Keycloak Client in both redirect_uri and origin.
    - make sure the redirect uri origin is mentioned in CORS.
- If the error is related to JWT_TOKEN in verifyToken.js
    - 99% chances are there is no access token passed or the access token has expired (JWT_COMPACT error is also because the token is expired).
    - Make sure you are passing ID token and it has fields like azp & most importantly email.
        - if email is not there
            - the user logged in is ADMIN. ADMIN doesn't have any email.
            - the email scope is not present in CLIENT.
            - the email scope is not default. If optional pass it in the scopes in /utils/oidcConsumer.js
- If the token is not coming at /callback
    - Check if the callback_route is correct.
    - Check if the origin and the redirect_uri is mentioned in Keycloak Client.
    - Check if you are acquiring the token from res.locals.token.token
    - in dev mode you need to explicitely mention callback_uri.

####  Built & Deployed by Devesh (Full stack intern 2023)

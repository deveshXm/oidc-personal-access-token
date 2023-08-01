import * as dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import { TokenData } from "./mongo/model.js";
import { tokenResponseController } from "./routes/customCallbackRoute.js";
import { revokeController } from "./routes/revokeRoute.js";
import KcAdminClient from "@keycloak/keycloak-admin-client";
import { createOIDCConsumer, expressSession } from "./utils/oidcConsumer.js";
import { Authentication } from "@fundwave/auth-layer";

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}.ymtylvh.mongodb.net/?retryWrites=true&w=majority`
  )
  .then((res) => console.log("mongodb is working"))
  .catch((error) => console.error(error));

const app = express();

const corsOptions = {
  origin: [
    process.env.ENV == "development"
      ? ("http://localhost:5173", "http://localhost:4173")
      : null,
  ],
  methods: ["GET", "HEAD", "DELETE"],
  allowedHeaders: [
    "Authorization",
    "Refresh-Token",
    "_host_Info",
    "Origin",
    "X-Requested-With",
    "contentType",
    "Content-Type",
    "Accept",
  ],
  credentials: true,
  exposedHeaders: ["token", "refreshToken", "Id_Token", "Refresh_Token"],
  optionsSuccessStatus: 200,
};

app.use(helmet());

app.use(express.json());

app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(cors(corsOptions));

app.use(expressSession);

let clientId = process.env.FW_AUTH_CLIENT_ID_master;
let clientSecret = process.env.FW_AUTH_CLIENT_SECRET_master;

let kcAdminClient = new KcAdminClient({
  baseUrl: process.env.FUNDWAVEID_BASEURL,
  realmName: "master",
});

const credentials = {
  username: process.env.ADMIN_USERNAME,
  password: process.env.ADMIN_PASSWORD,
  grantType: "password",
  clientId: process.env.ADMIN_ID,
};

try {
  await kcAdminClient.auth(credentials);
} catch (error) {
  console.log(error);
}

setInterval(async () => {
  try {
    console.log("refreshed");
    await kcAdminClient.auth(credentials);
  } catch (error) {
    console.log(error);
  }
}, 58 * 1000);

let consumer = createOIDCConsumer(
  "master",
  clientId,
  clientSecret,
  "/user/callback"
);

const validTokenPath = (realm) => {
  return [
    `/${realm}/token`,
    `/${realm}/token/callback`,
    `/${realm}/token/scopes`,
  ];
};

app.param("realm", async (_req, res, next, realm) => {
  clientId = process.env[`FW_AUTH_CLIENT_ID_${realm}`];
  clientSecret = process.env[`FW_AUTH_CLIENT_SECRET_${realm}`];
  kcAdminClient.realmName = realm;
  try {
    if (validTokenPath(realm).includes(_req.path)) {
      clientId = process.env[`FW_TOKEN_CLIENT_ID_${realm}`];
      clientSecret = process.env[`FW_TOKEN_CLIENT_SECRET_${realm}`];
      consumer = createOIDCConsumer(
        realm,
        clientId,
        clientSecret,
        "/token/callback"
      );
    } else {
      consumer = createOIDCConsumer(realm, clientId, clientSecret, "/callback");
    }
    next();
  } catch (error) {
    console.error(error);
    if (error.message === "UNSUPPORTED_REALM")
      return res.status(400).json({ message: "UNSUPPORTED CLIENT REALM" });
    return res.sendStatus(500);
  }
});

// user auth endpoint
app.get("/:realm/userAuth", (...params) => consumer.authRedirect(...params));

// callback for userAuth
app.get(
  "/:realm/callback",
  (...params) => consumer.authCallback(...params),
  (req, res, next) => {
    const redirectUri = new URL(res.locals.sessionData.redirect_uri);
    try {
      const result = res.locals.token;
      redirectUri.searchParams.set("refresh_token", result.token.refresh_token);
      redirectUri.searchParams.set("access_token", result.token.access_token);
      redirectUri.searchParams.set("token", result.token.id_token);
      res.redirect(redirectUri.toString());
    } catch (error) {
      console.error(error);
      return res.redirect(redirectUri.toString()).status(500);
    }
  }
);

// custom token issue endpoint
app.get(
  "/:realm/token",
  (req, res, next) => {
    req.headers.authorization = `Bearer ${req.query.token}`;
    next();
  },
  Authentication.verifyToken,
  (req, res, next) => {
    try {
      const tokenName = req.query.name;
      const tokenExpiry = req.query.custom_exp;
      const queryParamsScopes = req.query.scopes;
      const defaultScopes = " openid offline_access";
      if (!tokenName || !tokenExpiry) {
        throw new Error("Invalid params");
      }
      req.session.custom_exp = tokenExpiry;
      req.session.token_name = tokenName;
      consumer.scope = (queryParamsScopes ?? "" + defaultScopes).trim();
      next();
    } catch (error) {
      console.error(error);
      res.redirect(req.query.redirectUri + "/error").status(400);
    }
  },
  (...params) => consumer.authRedirect(...params)
);

// callback for issued token
app.get(
  "/:realm/token/callback",
  async (req, res, next) => {
    try {
      await consumer.authCallback(req, res, next, {
        custom_exp: req.session.custom_exp,
      });
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  },
  (req, res, next) => {
    tokenResponseController(req, res, next, consumer);
  }
);

// logout user
app.get("/:realm/logout", async (req, res, next) => {
  try {
    res.redirect(
      process.env.FUNDWAVEID_BASEURL +
        "/realms/" +
        req.params.realm +
        "/protocol/openid-connect/logout" +
        "?post_logout_redirect_uri=" +
        encodeURIComponent(req.query.redirectUri) +
        "&id_token_hint=" +
        encodeURIComponent(req.query.idToken)
    );
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

// refresh token using refresh token
app.get("/:realm/token/refresh", async (req, res, next) => {
  try {
    const refreshToken = req.header("Refresh-Token");
    const tokenObject = {
      refresh_token: refreshToken,
    };
    const accessToken = await consumer.refresh(tokenObject);
    if (!accessToken.token)
      throw new Error("Access token not found in response from Fundwave ID");
    const payload = {
      token: accessToken.token["id_token"],
      access_token: accessToken.token["access_token"],
      refreshToken: accessToken.token["refresh_token"],
    };
    res.json(payload).status(200);
  } catch (error) {
    console.error(error);
    res.status(500);
  }
});

app.use(Authentication.verifyToken);

// get client scopes
app.get("/:realm/token/scopes", async (req, res) => {
  try {
    const client = await kcAdminClient.clients.find({
      clientId,
    });
    const clientScopes = client[0].optionalClientScopes;
    const allScopes = await kcAdminClient.clientScopes.find();
    const filteredScopes = allScopes.filter((scope) =>
      clientScopes.includes(scope.name)
    );
    res.send(filteredScopes).status(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

// get user issued tokens
app.get("/:realm/token/issued", async (req, res, next) => {
  try {
    const user = req.user.email;
    if (!user || user === "") {
      return res.sendStatus(401);
    }
    const fetchedTokens = await TokenData.find({ username: user }).sort({
      createdOn: -1,
    });
    res.status(200).send(fetchedTokens);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

// introspect token
app.get("/:realm/token/introspect/", async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const formData = new URLSearchParams();
    formData.append("client_id", clientId);
    formData.append("client_secret", clientSecret);
    formData.append("token", token);
    const response = await axios.post(
      `${process.env.FUNDWAVEID_BASEURL}/realms/${req.params.realm}/protocol/openid-connect/token/introspect`,
      formData.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    res.status(200).send(response.data);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

// delete & revoke issued token with id
app.delete("/:realm/token/:id", revokeController);

// DEVELOPMENT
if (process.env.ENV == "development") {
  const port = 3000;
  app.listen(port, () => {
    console.log(`listening on port ${port}`);
  });
}

// PRODUCTION
export const oidcService = (request, response) => {
  if (!request.path) {
    request.url = `/${request.url}`; // prepend '/' to keep query params if any
  }
  return app(request, response);
};

import OidcConsumer from "@fundwave/oidc-consumer";
import crypto from "crypto";
import * as dotenv from "dotenv";
import session, { MemoryStore } from "express-session";
dotenv.config();

export const sessionSecret = crypto.randomBytes(32).toString("hex");

export const expressSession = session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
});

export function createOIDCConsumer(
  realm,
  clientId,
  clientSecret,
  callbackRoute
) {
  const CLIENT_REALM = process.env.CLIENT_REALM;
  if (!CLIENT_REALM) throw new Error("Missing client-realm");

  if (!realm || realm == "") {
    realm = CLIENT_REALM;
  }
  if (!clientSecret || !clientId) throw new Error("UNSUPPORTED_REALM");

  const allowedRedirectURIs = (
    process.env.ALLOWED_REDIRECT_URIS?.split(",") || []
  ).concat([
    /([a-z0-9]+[.])*\.getfundwave[.]com/,
    /([a-z0-9]+[.])*\.fundwave[.]com/,
  ]);
  return new OidcConsumer({
    scope: "openid",
    allowedRedirectURIs,
    callback_route: `/${realm}${callbackRoute}`,
    ...(process.env.ENV == "development"
      ? {
          callback_url: `http://localhost:3000/${realm}${callbackRoute}`,
        }
      : {}),
    clientConfig: {
      client: {
        id: clientId,
        secret: clientSecret,
      },
      auth: {
        tokenHost: process.env.FUNDWAVEID_BASEURL,
        tokenPath: `/realms/${realm}/protocol/openid-connect/token`,
        revokePath: `/realms/${realm}/protocol/openid-connect/logout`,
        authorizePath: `/realms/${realm}/protocol/openid-connect/auth`,
      },
      options: {
        authorizationMethod: "body",
        bodyFormat: "form",
      },
    },
    sessionOptions: {
      name: "app-oidc",
      store: new MemoryStore(),
      secret: sessionSecret,
      resave: false,
      saveUninitialized: true,
    },
  });
}

import { AccessToken, TokenData } from "../mongo/model.js";
import { encrypt } from "../utils/crypto.js";
import * as jose from "jose";

export const tokenResponseController = async (req, res, next) => {
  const redirectUri = new URL(res.locals.sessionData.redirect_uri);
  const responseToken = res.locals.token.token;
  const claims = jose.decodeJwt(responseToken.access_token);
  const user = claims["email"];
  const prefix = "************************";
  try {
    const data = {
      username: user,
      tokenName: res.locals.sessionData.token_name,
      accessToken: prefix + responseToken.access_token.slice(-4),
      scope: responseToken.scope,
      createdOn: new Date(),
      expiresAt: responseToken.expires_at,
    };
    //encrypt refresh token
    const encryptedAccessToken = encrypt(
      JSON.stringify(responseToken.access_token)
    );
    //store refresh token on mongodb
    const accessToken = new AccessToken({
      accessToken: encryptedAccessToken,
    });
    await accessToken.save();

    //store token data on mongodb
    const tokenData = new TokenData(data);
    tokenData.encryptedAccessToken = accessToken._id;
    const mongoTokenDataResponse = await tokenData.save();

    // encoded token and redirect back to user
    const newCreatedToken = {
      ...data,
      accessToken: responseToken.access_token,
      id: mongoTokenDataResponse._id,
    };
    redirectUri.searchParams.set(
      "token",
      encodeURIComponent(JSON.stringify(newCreatedToken))
    );
    res.redirect(redirectUri.toString());
  } catch (error) {
    console.error(error);
    res.redirect(redirectUri.toString());
  }
};

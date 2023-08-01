// import { verifyUserInKeycloak } from "../utils/keycloakAdmin";
import * as jose from "jose";

export const verifyUserGroups = async (req, res, next) => {
  /* VERIFYING USING USERGROUPS CLAIM */
  const redirectUri = new URL(res.locals.sessionData.redirect_uri);
  try {
    const token = req.headers.authorization.split(" ")[1];
    const claims = jose.decodeJwt(token);
    const usergroups = claims["usergroups"];
    res.locals.usergroups = usergroups;
    if (!usergroups || usergroups.length === 0) {
      throw new Error("INVALID USERGROUPS");
    }
    next();
  } catch (error) {
    console.error(error);
    if (redirectUri) {
      res.redirect(redirectUri + "/error=invalid_usergroup");
    } else {
      res.send("Not enough permissions. Contact Support").status(403);
    }
  }

  /* VERIFYING USING USER EMAIL */
  // pass kcAdminClient as argument
  //   const user = res.locals.user;
  //   try {
  //      const kcUser = await kcAdminClient.users.find({ email: userEmail });
  //      const kcGroups = await kcAdminClient.users.countGroups({
  //        id: kcUser[0].id,
  //      });
  //     const valid = kcGroups && kcGroups.count > 0 ? true : false;
  //     if (!valid) {
  //       throw new Error("INVALID USER GROUPS");
  //     }
  //     next();
  //   } catch (error) {
  //     console.error(error);
  //   }
};

import axios from "axios";
import { AccessToken, TokenData } from "../mongo/model.js";
import { decrypt } from "../utils/crypto.js";

export const revokeController = async (req, res) => {
  try {
    //fetch Token Data
    const realm = req.params.realm;
    const fetchedTokenData = await TokenData.findById(req.params.id);
    if (!fetchedTokenData) {
      throw { error: "Couldn't find Token Data." };
    }
    //fetch Access Token
    const fetchedAccessToken = await AccessToken.findById(
      fetchedTokenData.encryptedAccessToken
    );
    if (!fetchedAccessToken) {
      throw { error: "Couldn't find Access Token." };
    }
    //decrypt Access Token
    const decryptedAccessToken = decrypt(fetchedAccessToken.accessToken);
    const token = JSON.parse(decryptedAccessToken);
    const formData = new URLSearchParams();

    const clientId = process.env[`FW_TOKEN_CLIENT_ID_${realm}`];
    const clientSecret = process.env[`FW_TOKEN_CLIENT_SECRET_${realm}`];
    
    formData.append("client_id", clientId);
    formData.append("client_secret", clientSecret);
    formData.append("token", token);
    formData.append("token_type_hint", process.env.TOKEN_TYPE);
    //revoke Access Token
    await axios.post(
      `${process.env.FUNDWAVEID_BASEURL}/realms/${realm}/protocol/openid-connect/revoke`,
      formData.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    //delete Refresh Token from DB
    await TokenData.deleteOne({ _id: fetchedTokenData._id });
    await AccessToken.deleteOne({ _id: fetchedAccessToken._id });
    res.send({ message: "Successfully revoked token" }).status(200);
  } catch (error) {
    console.error(error);
    res.send({ message: "Couldn't revoke token" }).status(500);
  }
};

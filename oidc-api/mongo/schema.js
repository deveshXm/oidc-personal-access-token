import mongoose from "mongoose";
import { AccessToken } from "./model.js";
const { Schema } = mongoose;

const AccessTokenSchema = Schema({
  accessToken: String,
});

const TokenDataSchema = Schema({
  username: String,
  tokenName: String,
  accessToken: String,
  encryptedAccessToken: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AccessToken",
  },
  scope: String,
  createdOn: Date,
  expiresAt: Date,
});

export { TokenDataSchema, AccessTokenSchema };

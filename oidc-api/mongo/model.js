import mongoose from "mongoose";
import { TokenDataSchema, AccessTokenSchema } from "./schema.js";

const TokenData = mongoose.model("token_data", TokenDataSchema);
const AccessToken = mongoose.model("access_tokens", AccessTokenSchema);
export { TokenData, AccessToken };

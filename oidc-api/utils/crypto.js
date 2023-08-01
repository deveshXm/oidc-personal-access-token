import crypto from "crypto";
import * as dotenv from "dotenv";
dotenv.config();

const algorithm = process.env.CRYPTO_ALGORITHM;
const key = Buffer.from(process.env.CRYPTO_KEY.split(","), "hex");
const iv = Buffer.from(process.env.CRYPTO_IV.split(","), "hex");

export function encrypt(data) {
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encryptedData = cipher.update(data, "utf8", "hex");
  encryptedData += cipher.final("hex");
  return encryptedData;
}

export function decrypt(encryptedData) {
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
  let decryptedData = decipher.update(encryptedData, "hex", "utf8");
  decryptedData += decipher.final("utf8");
  return decryptedData;
}

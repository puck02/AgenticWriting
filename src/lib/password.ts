import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const passwordHashPrefix = "scrypt";
const keyLength = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, keyLength)) as Buffer;

  return [passwordHashPrefix, salt, derivedKey.toString("hex")].join(":");
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  const [prefix, salt, expectedKey] = passwordHash.split(":");

  if (prefix !== passwordHashPrefix || !salt || !expectedKey) {
    return false;
  }

  const derivedKey = (await scryptAsync(password, salt, keyLength)) as Buffer;
  const expectedBuffer = Buffer.from(expectedKey, "hex");

  if (derivedKey.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, expectedBuffer);
}

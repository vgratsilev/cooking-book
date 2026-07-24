import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const saltLength = 16;
const keyLength = 64;

export const hashPassword = async (password: string) => {
    const salt = randomBytes(saltLength).toString("hex");
    const derivedKey = (await scryptAsync(password, salt, keyLength)) as Buffer;

    return `${salt}:${derivedKey.toString("hex")}`;
};

export const verifyPassword = async (password: string, storedPassword: string) => {
    const [salt, storedHash] = storedPassword.split(":");

    if (
        !salt ||
        !storedHash ||
        salt.length !== saltLength * 2 ||
        storedHash.length !== keyLength * 2 ||
        !/^[a-f0-9]+$/.test(salt) ||
        !/^[a-f0-9]+$/.test(storedHash)
    ) {
        return false;
    }

    const derivedKey = (await scryptAsync(password, salt, keyLength)) as Buffer;
    const expectedKey = Buffer.from(storedHash, "hex");

    return derivedKey.length === expectedKey.length && timingSafeEqual(derivedKey, expectedKey);
};

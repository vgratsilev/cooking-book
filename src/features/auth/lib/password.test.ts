import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
    it("verifies the original password and rejects another password", async () => {
        const storedPassword = await hashPassword("StrongPass1");

        await expect(verifyPassword("StrongPass1", storedPassword)).resolves.toBe(true);
        await expect(verifyPassword("WrongPass1", storedPassword)).resolves.toBe(false);
    });

    it("rejects malformed stored hashes without throwing", async () => {
        await expect(verifyPassword("StrongPass1", "not-a-hash")).resolves.toBe(false);
        await expect(verifyPassword("StrongPass1", `${"0".repeat(32)}:`)).resolves.toBe(false);
    });
});

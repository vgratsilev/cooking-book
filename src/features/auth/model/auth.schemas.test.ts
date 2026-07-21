import { describe, expect, it } from "vitest";
import { loginSchema, registrationSchema, zodIssuesToFieldErrors } from "./auth.schemas";

describe("auth schemas", () => {
    it("accepts a login payload with any non-empty password", () => {
        expect(
            loginSchema.safeParse({
                email: "  user@example.com ",
                password: "short",
            }),
        ).toMatchObject({
            success: true,
            data: { email: "user@example.com", password: "short" },
        });
    });

    it("rejects an invalid login email and empty password", () => {
        const result = loginSchema.safeParse({ email: "not-an-email", password: "" });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(zodIssuesToFieldErrors(result.error)).toMatchObject({
                email: "Please enter a valid email address",
                password: "Password is required",
            });
        }
    });

    it("reports each registration password rule", () => {
        const result = registrationSchema.safeParse({
            email: "user@example.com",
            password: "short",
            confirmPassword: "short",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(zodIssuesToFieldErrors(result.error).password).toContain(
                "Password must be at least 8 characters",
            );
        }
    });

    it("requires matching confirmation without adding a second error for an empty value", () => {
        const missingConfirmation = registrationSchema.safeParse({
            email: "user@example.com",
            password: "StrongPass1",
            confirmPassword: "",
        });
        const mismatch = registrationSchema.safeParse({
            email: "user@example.com",
            password: "StrongPass1",
            confirmPassword: "OtherPass1",
        });

        expect(missingConfirmation.success).toBe(false);
        expect(mismatch.success).toBe(false);
        if (!missingConfirmation.success && !mismatch.success) {
            expect(zodIssuesToFieldErrors(missingConfirmation.error)).toEqual({
                confirmPassword: "Confirm password is required",
            });
            expect(zodIssuesToFieldErrors(mismatch.error)).toEqual({
                confirmPassword: "Passwords must match",
            });
        }
    });
});

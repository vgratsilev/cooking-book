import { beforeEach, describe, expect, it, vi } from "vitest";

const signIn = vi.hoisted(() => vi.fn());
const MockAuthError = vi.hoisted(
    () =>
        class MockAuthError extends Error {
            type = "CredentialsSignin";
        },
);

import messages from "@/i18n/messages/en.json";

vi.mock("../auth", () => ({ signIn }));
vi.mock("next-auth", () => ({ AuthError: MockAuthError }));
vi.mock("next-intl/server", () => ({
    getTranslations: vi.fn(async (namespace: keyof typeof messages) => {
        const namespaceMessages = messages[namespace];
        return (key: keyof typeof namespaceMessages) => namespaceMessages[key];
    }),
}));

import { loginUser } from "./signin.action";

describe("loginUser", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("creates a session through the Credentials provider", async () => {
        signIn.mockResolvedValue("/");

        await expect(loginUser({ email: "user@example.com", password: "short" })).resolves.toEqual({
            status: "success",
        });

        expect(signIn).toHaveBeenCalledWith("credentials", {
            email: "user@example.com",
            password: "short",
            redirect: false,
        });
    });

    it("returns field errors before calling Auth.js for invalid input", async () => {
        await expect(loginUser({ email: "invalid", password: "" })).resolves.toEqual({
            fieldErrors: {
                email: "Please enter a valid email address",
                password: "Password is required",
            },
            status: "error",
        });

        expect(signIn).not.toHaveBeenCalled();
    });

    it("converts expected Auth.js credentials errors to a form error", async () => {
        signIn.mockRejectedValue(new MockAuthError());

        await expect(loginUser({ email: "user@example.com", password: "short" })).resolves.toEqual({
            formError: "Invalid email or password.",
            status: "error",
        });
    });
});

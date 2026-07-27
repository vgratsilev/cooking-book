import { beforeEach, describe, expect, it, vi } from "vitest";

const createUser = vi.hoisted(() => vi.fn());
const findUniqueUser = vi.hoisted(() => vi.fn());
const signIn = vi.hoisted(() => vi.fn());

import messages from "@/i18n/messages/en.json";

vi.mock("@/utils/prisma", () => ({
    prisma: { user: { create: createUser, findUnique: findUniqueUser } },
}));

vi.mock("../auth", () => ({ signIn }));
vi.mock("next-intl/server", () => ({
    getTranslations: vi.fn(async (namespace: keyof typeof messages) => {
        const namespaceMessages = messages[namespace];
        return (key: keyof typeof namespaceMessages) => namespaceMessages[key];
    }),
}));

import { registerUser } from "./register.action";

const registrationValues = {
    email: "User@Example.com",
    password: "StrongPass1",
    confirmPassword: "StrongPass1",
};
const normalizedEmail = "user@example.com";

describe("registerUser", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        findUniqueUser.mockResolvedValue(null);
        signIn.mockResolvedValue("/");
    });

    it("creates a user after validating values on the server", async () => {
        createUser.mockResolvedValue({ id: "user-id", email: normalizedEmail });

        await expect(registerUser(registrationValues)).resolves.toEqual({ status: "success" });

        expect(findUniqueUser).toHaveBeenCalledWith({
            where: { email: normalizedEmail },
        });

        expect(createUser).toHaveBeenCalledWith({
            data: {
                email: normalizedEmail,
                password: expect.stringMatching(/^[a-f0-9]{32}:[a-f0-9]{128}$/),
            },
        });
        expect(createUser.mock.calls[0][0].data.password).not.toBe(registrationValues.password);
        expect(signIn).toHaveBeenCalledWith("credentials", {
            email: normalizedEmail,
            password: registrationValues.password,
            redirect: false,
        });
    });

    it("keeps the account and asks for manual sign-in when automatic sign-in fails", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
        createUser.mockResolvedValue({ id: "user-id", email: normalizedEmail });
        signIn.mockRejectedValue(new Error("Auth.js unavailable"));

        try {
            await expect(registerUser(registrationValues)).resolves.toEqual({
                formError: "Account created, but automatic sign-in failed. Please sign in manually.",
                status: "error",
            });
        } finally {
            consoleError.mockRestore();
        }

        expect(createUser).toHaveBeenCalledTimes(1);
        expect(signIn).toHaveBeenCalledTimes(1);
    });

    it("returns an email field error before creating a duplicate account", async () => {
        findUniqueUser.mockResolvedValue({ id: "existing-user-id" });

        await expect(registerUser(registrationValues)).resolves.toEqual({
            fieldErrors: { email: "An account with this email already exists." },
            status: "error",
        });

        expect(createUser).not.toHaveBeenCalled();
        expect(signIn).not.toHaveBeenCalled();
    });

    it("returns an email field error when a concurrent create hits P2002", async () => {
        createUser.mockRejectedValue({ code: "P2002" });

        await expect(registerUser(registrationValues)).resolves.toEqual({
            fieldErrors: { email: "An account with this email already exists." },
            status: "error",
        });
        expect(signIn).not.toHaveBeenCalled();
    });
});

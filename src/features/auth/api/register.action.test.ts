import { beforeEach, describe, expect, it, vi } from "vitest";

const createUser = vi.hoisted(() => vi.fn());

vi.mock("@/utils/prisma", () => ({
    prisma: { user: { create: createUser } },
}));

import { registerUser } from "./register.action";

const registrationValues = {
    email: "user@example.com",
    password: "StrongPass1",
    confirmPassword: "StrongPass1",
};

describe("registerUser", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("creates a user after validating values on the server", async () => {
        createUser.mockResolvedValue({ id: "user-id", email: registrationValues.email });

        await expect(registerUser(registrationValues)).resolves.toEqual({ status: "success" });

        expect(createUser).toHaveBeenCalledWith({
            data: {
                email: registrationValues.email,
                password: expect.stringMatching(/^[a-f0-9]{32}:[a-f0-9]{128}$/),
            },
        });
        expect(createUser.mock.calls[0][0].data.password).not.toBe(registrationValues.password);
    });

    it("returns an email field error when the email is already registered", async () => {
        createUser.mockRejectedValue({ code: "P2002" });

        await expect(registerUser(registrationValues)).resolves.toEqual({
            fieldErrors: { email: "An account with this email already exists." },
            status: "error",
        });
    });
});

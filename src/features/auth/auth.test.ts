import { beforeEach, describe, expect, it, vi } from "vitest";

interface AuthConfigShape {
    providers: Array<{
        credentials: {
            email: { label: string; type: string };
            password: { label: string; type: string };
        };
        authorize: (credentials: unknown, request: Request) => Promise<unknown>;
    }>;
}

type AuthConfigFactory = () => Promise<AuthConfigShape>;

const capturedConfig = vi.hoisted(() => ({
    config: undefined as AuthConfigFactory | undefined,
}));
const findUser = vi.hoisted(() => vi.fn());
const verifyPassword = vi.hoisted(() => vi.fn());

vi.mock("next-auth", () => ({
    default: (config: unknown) => {
        capturedConfig.config = config as AuthConfigFactory;
        return { auth: vi.fn(), handlers: {}, signIn: vi.fn(), signOut: vi.fn() };
    },
}));
vi.mock("next-auth/providers/credentials", () => ({
    default: (config: unknown) => config,
}));
vi.mock("@auth/prisma-adapter", () => ({ PrismaAdapter: () => ({}) }));
vi.mock("@/utils/prisma", () => ({ prisma: {} }));
vi.mock("@/utils/user", () => ({ getUserFromDb: findUser }));
vi.mock("./lib/password", () => ({ verifyPassword }));
vi.mock("next-intl/server", () => ({
    getTranslations: vi.fn(async () => (key: string) => `translated:${key}`),
}));

import "./auth";

const getConfig = () => capturedConfig.config!();
const authorize = async () => (await getConfig()).providers[0].authorize;

describe("Auth.js Credentials provider", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("uses localized labels for the Credentials provider", async () => {
        const config = await getConfig();

        expect(config.providers[0].credentials).toEqual({
            email: { label: "translated:emailLabel", type: "email" },
            password: { label: "translated:passwordLabel", type: "password" },
        });
    });

    it("loads by email and verifies the open password outside the DB query", async () => {
        const user = {
            id: "user-id",
            email: "user@example.com",
            name: null,
            image: null,
            password: "salt:hash",
        };
        findUser.mockResolvedValue(user);
        verifyPassword.mockResolvedValue(true);

        await expect(
            (await authorize())(
                { email: "user@example.com", password: "StrongPass1" },
                new Request("http://localhost/"),
            ),
        ).resolves.toMatchObject({ id: "user-id", email: "user@example.com" });

        expect(findUser).toHaveBeenCalledWith({ email: "user@example.com" });
        expect(findUser.mock.calls[0][0]).not.toHaveProperty("password");
        expect(verifyPassword).toHaveBeenCalledWith("StrongPass1", "salt:hash");
    });

    it("rejects an invalid password", async () => {
        findUser.mockResolvedValue({
            id: "user-id",
            email: "user@example.com",
            password: "salt:hash",
        });
        verifyPassword.mockResolvedValue(false);

        await expect(
            (await authorize())(
                { email: "user@example.com", password: "WrongPass1" },
                new Request("http://localhost/"),
            ),
        ).resolves.toBeNull();
    });
});

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getTranslations } from "next-intl/server";
import { createSignInSchema } from "./model/auth.schemas";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/utils/prisma";
import { getUserFromDb } from "@/utils/user";
import { verifyPassword } from "./lib/password";

export const { handlers, signIn, signOut, auth } = NextAuth(async () => {
    const t = await getTranslations("auth");

    return {
        adapter: PrismaAdapter(prisma),
        providers: [
            Credentials({
                credentials: {
                    email: { label: t("emailLabel"), type: "email" },
                    password: { label: t("passwordLabel"), type: "password" },
                },
                authorize: async (credentials) => {
                    const validationResult = createSignInSchema().safeParse(credentials);

                    if (!validationResult.success) {
                        return null;
                    }

                    const user = await getUserFromDb({ email: validationResult.data.email });

                    if (
                        !user ||
                        !(await verifyPassword(validationResult.data.password, user.password))
                    ) {
                        return null;
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        image: user.image,
                    };
                },
            }),
        ],
        session: {
            strategy: "jwt",
            maxAge: 3600,
        },
        secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
        callbacks: {
            async jwt({ token, user }) {
                if (user) {
                    token.id = user.id;
                }
                return token;
            },
        },
    };
});

import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "../generated/prisma/client";

const accelerateUrl = process.env.ACCELERATE_DATABASE_URL;

if (!accelerateUrl) {
    throw new Error("ACCELERATE_DATABASE_URL is not set");
}

const createPrismaClient = () => new PrismaClient({ accelerateUrl }).$extends(withAccelerate());

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

import { prisma } from "./prisma";

export const getUserFromDb = async ({ email }: { email: string }) => {
    return prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            name: true,
            image: true,
            password: true,
        },
    });
};

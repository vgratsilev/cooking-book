"use server";

import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { registrationSchema, zodIssuesToFieldErrors } from "../model/auth.schemas";
import type { AuthSubmitResult, RegistrationValues } from "../model/auth.types";
import { siteConfig } from "@/config/site.config";
import { prisma } from "@/utils/prisma";

const scryptAsync = promisify(scrypt);

const duplicateEmailError = {
    status: "error" as const,
    fieldErrors: { email: siteConfig.duplicateEmailError },
};

const isPrismaUniqueConstraintError = (error: unknown) => {
    return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
};

const hashPassword = async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;

    return `${salt}:${derivedKey.toString("hex")}`;
};

export async function registerUser(
    values: RegistrationValues,
): Promise<AuthSubmitResult<keyof RegistrationValues>> {
    const validationResult = registrationSchema.safeParse(values);

    if (!validationResult.success) {
        return {
            status: "error",
            fieldErrors: zodIssuesToFieldErrors(validationResult.error),
        };
    }

    try {
        const password = await hashPassword(validationResult.data.password);
        await prisma.user.create({ data: { email: validationResult.data.email, password } });
        return { status: "success" };
    } catch (error) {
        if (isPrismaUniqueConstraintError(error)) {
            return duplicateEmailError;
        }

        return {
            status: "error",
            formError: siteConfig.registrationFailedError,
        };
    }
}

"use server";

import { getTranslations } from "next-intl/server";
import {
    createRegistrationSchema,
    getValidationMessages,
    zodIssuesToFieldErrors,
} from "../model/auth.schemas";
import type { AuthSubmitResult, RegistrationValues } from "../model/auth.types";
import { prisma } from "@/utils/prisma";
import { signIn } from "../auth";
import { hashPassword } from "../lib/password";

const duplicateEmailError = (message: string) => ({
    status: "error" as const,
    fieldErrors: { email: message },
});

const isPrismaUniqueConstraintError = (error: unknown) => {
    return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
};

export async function registerUser(
    values: RegistrationValues,
): Promise<AuthSubmitResult<keyof RegistrationValues>> {
    const validationT = await getTranslations("validation");
    const serverErrorT = await getTranslations("serverErrors");
    const validationMessages = getValidationMessages(validationT);
    const validationResult = createRegistrationSchema().safeParse(values);

    if (!validationResult.success) {
        return {
            status: "error",
            fieldErrors: zodIssuesToFieldErrors(validationResult.error, validationMessages),
        };
    }

    const existingUser = await prisma.user.findUnique({
        where: { email: validationResult.data.email },
    });

    if (existingUser) {
        return duplicateEmailError(serverErrorT("duplicateEmailError"));
    }

    try {
        await prisma.user.create({
            data: {
                email: validationResult.data.email,
                password: await hashPassword(validationResult.data.password),
            },
        });
        await signIn("credentials", {
            email: validationResult.data.email,
            password: validationResult.data.password,
            redirect: false,
        });
        return { status: "success" };
    } catch (error) {
        if (isPrismaUniqueConstraintError(error)) {
            return duplicateEmailError(serverErrorT("duplicateEmailError"));
        }

        return {
            status: "error",
            formError: serverErrorT("registrationFailedError"),
        };
    }
}

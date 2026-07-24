"use server";

import { AuthError } from "next-auth";
import { getTranslations } from "next-intl/server";
import { signIn } from "../auth";
import {
    createSignInSchema,
    getValidationMessages,
    zodIssuesToFieldErrors,
} from "../model/auth.schemas";
import type { AuthSubmitResult, SignInValues } from "../model/auth.types";

export async function loginUser(
    values: SignInValues,
): Promise<AuthSubmitResult<keyof SignInValues>> {
    const validationT = await getTranslations("validation");
    const serverErrorT = await getTranslations("serverErrors");
    const validationMessages = getValidationMessages(validationT);
    const validationResult = createSignInSchema().safeParse(values);

    if (!validationResult.success) {
        return {
            status: "error",
            fieldErrors: zodIssuesToFieldErrors(validationResult.error, validationMessages),
        };
    }

    try {
        await signIn("credentials", {
            email: validationResult.data.email,
            password: validationResult.data.password,
            redirect: false,
        });
    } catch (error) {
        if (
            error instanceof AuthError &&
            (error.type === "CredentialsSignin" || error.type === "CallbackRouteError")
        ) {
            return { status: "error", formError: serverErrorT("invalidCredentialsError") };
        }

        throw error;
    }

    return { status: "success" };
}

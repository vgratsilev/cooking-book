import { z } from "zod";
import { siteConfig } from "@/config/site.config";

const emailSchema = z
    .string()
    .trim()
    .superRefine((value, context) => {
        if (!value) {
            context.addIssue({ code: "custom", message: siteConfig.emailRequiredError });
        } else if (!z.string().email().safeParse(value).success) {
            context.addIssue({ code: "custom", message: siteConfig.invalidEmailError });
        }
    });

export const signInSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, siteConfig.passwordRequiredError),
});

export const registrationSchema = z
    .object({
        email: emailSchema,
        password: z
            .string()
            .min(8, siteConfig.passwordMinLengthError)
            .regex(/[A-Z]/, siteConfig.passwordUppercaseError)
            .regex(/[0-9]/, siteConfig.passwordNumberError),
        confirmPassword: z.string().min(1, siteConfig.confirmPasswordRequiredError),
    })
    .superRefine(({ password, confirmPassword }, context) => {
        if (confirmPassword && password !== confirmPassword) {
            context.addIssue({
                code: "custom",
                message: siteConfig.passwordsMismatchError,
                path: ["confirmPassword"],
            });
        }
    });

export type AuthFieldErrorMap = Partial<Record<string, string>>;

export const zodIssuesToFieldErrors = (error: z.ZodError): AuthFieldErrorMap => {
    return error.issues.reduce<AuthFieldErrorMap>((fieldErrors, issue) => {
        const field = issue.path[0];

        if (typeof field !== "string") {
            return fieldErrors;
        }

        fieldErrors[field] = fieldErrors[field]
            ? `${fieldErrors[field]}\n${issue.message}`
            : issue.message;
        return fieldErrors;
    }, {});
};

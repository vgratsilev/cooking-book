import { z } from "zod";
import enMessages from "@/i18n/messages/en.json";

export type ValidationMessages = typeof enMessages.validation;

export const defaultValidationMessages: ValidationMessages = enMessages.validation;

export const getValidationMessages = (translate: (key: string) => string) => {
    return Object.keys(defaultValidationMessages).reduce((messages, key) => {
        messages[key as keyof ValidationMessages] = translate(key);
        return messages;
    }, {} as ValidationMessages);
};

const createEmailSchema = () =>
    z
        .string()
        .trim()
        .toLowerCase()
        .superRefine((value, context) => {
            if (!value) {
                context.addIssue({ code: "custom", message: "emailRequiredError" });
            } else if (!z.string().email().safeParse(value).success) {
                context.addIssue({ code: "custom", message: "invalidEmailError" });
            }
        });

export const createSignInSchema = () =>
    z.object({
        email: createEmailSchema(),
        password: z.string().min(1, "passwordRequiredError"),
    });

export const createRegistrationSchema = () =>
    z
        .object({
            email: createEmailSchema(),
            password: z
                .string()
                .min(8, "passwordMinLengthError")
                .max(32, "passwordMaxLengthError")
                .regex(/[A-Z]/, "passwordUppercaseError")
                .regex(/[0-9]/, "passwordNumberError"),
            confirmPassword: z
                .string()
                .min(1, "confirmPasswordRequiredError")
                .max(32, "passwordMaxLengthError"),
        })
        .superRefine(({ password, confirmPassword }, context) => {
            if (confirmPassword && password !== confirmPassword) {
                context.addIssue({
                    code: "custom",
                    message: "passwordsMismatchError",
                    path: ["confirmPassword"],
                });
            }
        });

export const signInSchema = createSignInSchema();
export const registrationSchema = createRegistrationSchema();

export type AuthFieldErrorMap = Partial<Record<string, string>>;

export const zodIssuesToFieldErrors = (
    error: z.ZodError,
    messages: ValidationMessages = defaultValidationMessages,
): AuthFieldErrorMap => {
    return error.issues.reduce<AuthFieldErrorMap>((fieldErrors, issue) => {
        const field = issue.path[0];

        if (typeof field !== "string") {
            return fieldErrors;
        }

        const message = messages[issue.message as keyof ValidationMessages] ?? issue.message;
        fieldErrors[field] = fieldErrors[field] ? `${fieldErrors[field]}\n${message}` : message;
        return fieldErrors;
    }, {});
};

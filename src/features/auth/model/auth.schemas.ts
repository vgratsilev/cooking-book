import { z } from "zod";

const emailSchema = z
    .string()
    .trim()
    .superRefine((value, context) => {
        if (!value) {
            context.addIssue({ code: "custom", message: "Email is required" });
        } else if (!z.string().email().safeParse(value).success) {
            context.addIssue({ code: "custom", message: "Please enter a valid email address" });
        }
    });

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
});

export const registrationSchema = z
    .object({
        email: emailSchema,
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
            .regex(/[0-9]/, "Password must contain at least one number"),
        confirmPassword: z.string().min(1, "Confirm password is required"),
    })
    .superRefine(({ password, confirmPassword }, context) => {
        if (confirmPassword && password !== confirmPassword) {
            context.addIssue({
                code: "custom",
                message: "Passwords must match",
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
            ? `${fieldErrors[field]} ${issue.message}`
            : issue.message;
        return fieldErrors;
    }, {});
};

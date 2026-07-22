"use client";

import { Button, Description, FieldError, Form, Input, Label, TextField } from "@heroui/react";
import { siteConfig } from "@/config/site.config";
import { signInSchema } from "../model/auth.schemas";
import type { SignInSubmitHandler } from "../model/auth.types";
import { useAuthForm } from "./useAuthForm";

interface SignInFormProps {
    onCancel: () => void;
    onSubmit: SignInSubmitHandler;
    onSuccess: () => void;
    onSwitchMode: () => void;
}

export const SignInForm = ({ onCancel, onSubmit, onSuccess, onSwitchMode }: SignInFormProps) => {
    const { errors, formError, handleBlur, handleSubmit, isPending, setFieldValue, values } =
        useAuthForm({
            initialValues: { email: "", password: "" },
            onSubmit,
            onSuccess,
            schema: signInSchema,
        });

    return (
        <Form
            aria-label={siteConfig.signInFormLabel}
            className="flex w-full flex-col gap-4"
            onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
            }}
            validationBehavior="aria"
        >
            <TextField
                isDisabled={isPending}
                isInvalid={Boolean(errors.email)}
                name="email"
                type="email"
                value={values.email}
                onChange={(value) => setFieldValue("email", value)}
                onBlur={() => handleBlur("email")}
            >
                <Label>{siteConfig.emailLabel}</Label>
                <Input autoComplete="email" placeholder={siteConfig.emailPlaceholder} />
                {errors.email ? <FieldError>{errors.email}</FieldError> : null}
            </TextField>

            <TextField
                isDisabled={isPending}
                isInvalid={Boolean(errors.password)}
                name="password"
                type="password"
                value={values.password}
                onChange={(value) => setFieldValue("password", value)}
                onBlur={() => handleBlur("password")}
            >
                <Label>{siteConfig.passwordLabel}</Label>
                <Input
                    autoComplete="current-password"
                    placeholder={siteConfig.currentPasswordPlaceholder}
                />
                {errors.password ? (
                    <FieldError>{errors.password}</FieldError>
                ) : (
                    <Description>{siteConfig.signInPasswordDescription}</Description>
                )}
            </TextField>

            {formError ? (
                <p aria-live="polite" className="text-danger text-sm" role="alert">
                    {formError}
                </p>
            ) : null}

            <div className="flex w-full flex-col gap-2 pt-4 md:flex-row md:justify-end">
                <Button
                    className="min-h-11 w-full md:min-h-0 md:w-auto"
                    isPending={isPending}
                    type="submit"
                >
                    {siteConfig.signInButton}
                </Button>
                <Button
                    className="min-h-11 w-full md:min-h-0 md:w-auto"
                    onPress={onCancel}
                    variant="secondary"
                >
                    {siteConfig.cancelButton}
                </Button>
            </div>

            <p className="text-muted flex flex-col items-center gap-1 text-center text-sm md:block">
                {siteConfig.dontHaveAccountText} <span className="hidden md:inline"> </span>
                <button
                    className="bg-default hover:bg-default-hover focus-visible:outline-focus md:text-accent md:hover:text-accent-hover min-h-11 w-full cursor-pointer rounded-3xl px-4 text-sm font-medium whitespace-normal transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 md:h-auto md:min-h-0 md:w-auto md:bg-transparent md:p-0 md:whitespace-nowrap md:underline md:decoration-1 md:underline-offset-4 md:hover:bg-transparent"
                    type="button"
                    onClick={onSwitchMode}
                >
                    {siteConfig.signUpButton}
                </button>
            </p>
        </Form>
    );
};

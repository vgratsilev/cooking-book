"use client";

import { Button, Description, FieldError, Form, Input, Label, TextField } from "@heroui/react";
import { useTranslations } from "next-intl";
import { createRegistrationSchema } from "../model/auth.schemas";
import type { RegistrationSubmitHandler } from "../model/auth.types";
import { useAuthForm } from "./useAuthForm";

interface RegistrationFormProps {
    onCancel: () => void;
    onSubmit: RegistrationSubmitHandler;
    onSuccess: () => void;
    onSwitchMode: () => void;
}

export const RegistrationForm = ({
    onCancel,
    onSubmit,
    onSuccess,
    onSwitchMode,
}: RegistrationFormProps) => {
    const t = useTranslations("auth");
    const { errors, formError, handleBlur, handleSubmit, isPending, setFieldValue, values } =
        useAuthForm({
            initialValues: { email: "", password: "", confirmPassword: "" },
            onSubmit,
            onSuccess,
            schema: createRegistrationSchema(),
        });

    return (
        <Form
            aria-label={t("registrationFormLabel")}
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
                <Label>{t("emailLabel")}</Label>
                <Input autoComplete="email" placeholder={t("emailPlaceholder")} />
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
                <Label>{t("passwordLabel")}</Label>
                <Input autoComplete="new-password" placeholder={t("newPasswordPlaceholder")} />
                {errors.password ? (
                    <FieldError className="whitespace-pre-line">{errors.password}</FieldError>
                ) : (
                    <Description>{t("registrationPasswordDescription")}</Description>
                )}
            </TextField>

            <TextField
                isDisabled={isPending}
                isInvalid={Boolean(errors.confirmPassword)}
                name="confirmPassword"
                type="password"
                value={values.confirmPassword}
                onChange={(value) => setFieldValue("confirmPassword", value)}
                onBlur={() => handleBlur("confirmPassword")}
            >
                <Label>{t("confirmPasswordLabel")}</Label>
                <Input autoComplete="new-password" placeholder={t("confirmPasswordPlaceholder")} />
                {errors.confirmPassword ? (
                    <FieldError>{errors.confirmPassword}</FieldError>
                ) : (
                    <Description>{t("confirmPasswordDescription")}</Description>
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
                    {t("signUpButton")}
                </Button>
                <Button
                    className="min-h-11 w-full md:min-h-0 md:w-auto"
                    onPress={onCancel}
                    variant="secondary"
                >
                    {t("cancelButton")}
                </Button>
            </div>

            <p className="text-muted flex flex-col items-center gap-1 text-center text-sm md:block">
                {t("alreadyHaveAccountText")} <span className="hidden md:inline"> </span>
                <button
                    className="bg-default hover:bg-default-hover focus-visible:outline-focus md:text-accent md:hover:text-accent-hover min-h-11 w-full cursor-pointer rounded-3xl px-4 text-sm font-medium whitespace-normal transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 md:h-auto md:min-h-0 md:w-auto md:bg-transparent md:p-0 md:whitespace-nowrap md:underline md:decoration-1 md:underline-offset-4 md:hover:bg-transparent"
                    type="button"
                    onClick={onSwitchMode}
                >
                    {t("signInButton")}
                </button>
            </p>
        </Form>
    );
};

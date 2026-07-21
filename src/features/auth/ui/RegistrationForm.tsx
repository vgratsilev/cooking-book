"use client";

import { Button, Description, FieldError, Form, Input, Label, TextField } from "@heroui/react";
import { registrationSchema } from "../model/auth.schemas";
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
    const { errors, formError, handleBlur, handleSubmit, isPending, setFieldValue, values } =
        useAuthForm({
            initialValues: { email: "", password: "", confirmPassword: "" },
            onSubmit,
            onSuccess,
            schema: registrationSchema,
        });

    return (
        <Form
            aria-label="Registration form"
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
                <Label>Email</Label>
                <Input autoComplete="email" placeholder="john@example.com" />
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
                <Label>Password</Label>
                <Input autoComplete="new-password" placeholder="Create a password" />
                {errors.password ? (
                    <FieldError>{errors.password}</FieldError>
                ) : (
                    <Description>
                        At least 8 characters, 1 uppercase letter, and 1 number.
                    </Description>
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
                <Label>Confirm password</Label>
                <Input autoComplete="new-password" placeholder="Repeat your password" />
                {errors.confirmPassword ? (
                    <FieldError>{errors.confirmPassword}</FieldError>
                ) : (
                    <Description>Repeat your password.</Description>
                )}
            </TextField>

            {formError ? (
                <p aria-live="polite" className="text-danger text-sm" role="alert">
                    {formError}
                </p>
            ) : null}

            <div className="flex w-full flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
                <Button className="w-full sm:w-auto" onPress={onCancel} variant="secondary">
                    Cancel
                </Button>
                <Button className="w-full sm:w-auto" isPending={isPending} type="submit">
                    Sign up
                </Button>
            </div>

            <p className="text-muted text-center text-sm">
                Already have an account?{" "}
                <Button
                    className="h-auto min-h-0 p-0 text-sm"
                    onPress={onSwitchMode}
                    variant="tertiary"
                >
                    Sign in
                </Button>
            </p>
        </Form>
    );
};

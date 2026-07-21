"use client";

import { Button, Description, FieldError, Form, Input, Label, TextField } from "@heroui/react";
import { loginSchema } from "../model/auth.schemas";
import type { LoginSubmitHandler } from "../model/auth.types";
import { useAuthForm } from "./useAuthForm";

interface LoginFormProps {
    onCancel: () => void;
    onSubmit: LoginSubmitHandler;
    onSuccess: () => void;
    onSwitchMode: () => void;
}

export const LoginForm = ({ onCancel, onSubmit, onSuccess, onSwitchMode }: LoginFormProps) => {
    const { errors, formError, handleBlur, handleSubmit, isPending, setFieldValue, values } =
        useAuthForm({
            initialValues: { email: "", password: "" },
            onSubmit,
            onSuccess,
            schema: loginSchema,
        });

    return (
        <Form
            aria-label="Login form"
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
                <Input autoComplete="current-password" placeholder="Enter your password" />
                {errors.password ? (
                    <FieldError>{errors.password}</FieldError>
                ) : (
                    <Description>Enter your password.</Description>
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
                    Sign in
                </Button>
            </div>

            <p className="text-muted text-center text-sm">
                Don&apos;t have an account?{" "}
                <Button
                    className="h-auto min-h-0 p-0 text-sm"
                    onPress={onSwitchMode}
                    variant="tertiary"
                >
                    Create account
                </Button>
            </p>
        </Form>
    );
};

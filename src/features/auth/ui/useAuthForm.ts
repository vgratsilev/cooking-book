"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { z } from "zod";
import { zodIssuesToFieldErrors } from "../model/auth.schemas";
import type { AuthSubmitHandler } from "../model/auth.types";

type StringValues = Record<string, string>;
type FieldName<TValues extends StringValues> = keyof TValues & string;

interface AuthFormSchema<TValues extends StringValues> {
    safeParse: (
        values: unknown,
    ) => { success: true; data: TValues } | { success: false; error: z.ZodError };
}

interface UseAuthFormOptions<TValues extends StringValues> {
    initialValues: TValues;
    onSubmit: AuthSubmitHandler<TValues, FieldName<TValues>>;
    schema: AuthFormSchema<TValues>;
    onSuccess: () => void;
}

export const useAuthForm = <TValues extends StringValues>({
    initialValues,
    onSubmit,
    schema,
    onSuccess,
}: UseAuthFormOptions<TValues>) => {
    const [values, setValues] = useState(initialValues);
    const [touched, setTouched] = useState<Partial<Record<FieldName<TValues>, boolean>>>({});
    const [errors, setErrors] = useState<Partial<Record<FieldName<TValues>, string>>>({});
    const [formError, setFormError] = useState<string>();
    const [isPending, setIsPending] = useState(false);
    const submissionId = useRef(0);

    useEffect(() => {
        return () => {
            submissionId.current += 1;
        };
    }, []);

    const validateValues = useCallback(
        (nextValues: TValues) => {
            const result = schema.safeParse(nextValues);

            return result.success ? {} : zodIssuesToFieldErrors(result.error);
        },
        [schema],
    );

    const validateFields = useCallback(
        (fields: FieldName<TValues>[]) => {
            const nextErrors = { ...errors };
            const fieldErrors = validateValues(values);

            fields.forEach((field) => {
                delete nextErrors[field];
                const error = fieldErrors[field];

                if (error) {
                    nextErrors[field] = error;
                }
            });

            setErrors(nextErrors);
            return nextErrors;
        },
        [errors, validateValues, values],
    );

    const setFieldValue = useCallback(
        (field: FieldName<TValues>, value: string) => {
            const nextValues = { ...values, [field]: value };
            setValues(nextValues);
            setFormError(undefined);

            if (touched[field]) {
                const nextErrors = { ...errors };
                const fieldErrors = validateValues(nextValues);
                delete nextErrors[field];

                if (fieldErrors[field]) {
                    nextErrors[field] = fieldErrors[field];
                }

                const confirmPasswordField = "confirmPassword" as FieldName<TValues>;

                if (field === "password" && touched[confirmPasswordField]) {
                    delete nextErrors[confirmPasswordField];
                    if (fieldErrors[confirmPasswordField]) {
                        nextErrors[confirmPasswordField] = fieldErrors[confirmPasswordField];
                    }
                }

                setErrors(nextErrors);
            }
        },
        [errors, touched, validateValues, values],
    );

    const handleBlur = useCallback(
        (field: FieldName<TValues>) => {
            const fields = [field];

            if (field === "password" && touched.confirmPassword) {
                fields.push("confirmPassword" as FieldName<TValues>);
            }

            setTouched((currentTouched) => ({ ...currentTouched, [field]: true }));
            validateFields(fields);
        },
        [touched.confirmPassword, validateFields],
    );

    const focusFirstInvalidField = useCallback(
        (fieldErrors: Partial<Record<FieldName<TValues>, string>>) => {
            const firstField = Object.keys(values).find((field) => fieldErrors[field]);

            if (firstField) {
                document.querySelector<HTMLInputElement>(`[name="${firstField}"]`)?.focus();
            }
        },
        [values],
    );

    const handleSubmit = useCallback(async () => {
        if (isPending) {
            return;
        }

        setFormError(undefined);
        const result = schema.safeParse(values);

        if (!result.success) {
            const validationErrors = zodIssuesToFieldErrors(result.error) as Partial<
                Record<FieldName<TValues>, string>
            >;
            setTouched(
                Object.keys(values).reduce(
                    (allTouched, field) => ({ ...allTouched, [field]: true }),
                    {},
                ),
            );
            setErrors(validationErrors);
            focusFirstInvalidField(validationErrors);
            return;
        }

        setIsPending(true);
        const currentSubmissionId = submissionId.current;

        try {
            const submitResult = await onSubmit(result.data);

            if (currentSubmissionId !== submissionId.current) {
                return;
            }

            if (submitResult.status === "success") {
                onSuccess();
                return;
            }

            setErrors((currentErrors) => ({
                ...currentErrors,
                ...submitResult.fieldErrors,
            }));
            setFormError(submitResult.formError);
        } catch {
            setFormError("Something went wrong. Please try again.");
        } finally {
            if (currentSubmissionId === submissionId.current) {
                setIsPending(false);
            }
        }
    }, [focusFirstInvalidField, isPending, onSubmit, onSuccess, schema, values]);

    return {
        errors,
        formError,
        handleBlur,
        handleSubmit,
        isPending,
        setFieldValue,
        values,
    };
};

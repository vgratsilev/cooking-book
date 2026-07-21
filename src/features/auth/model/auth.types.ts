import type { z } from "zod";
import type { loginSchema, registrationSchema } from "./auth.schemas";

export type AuthMode = "login" | "registration";
export type LoginValues = z.infer<typeof loginSchema>;
export type RegistrationValues = z.infer<typeof registrationSchema>;

export type AuthSubmitResult<TField extends string = string> =
    | { status: "success" }
    | {
          status: "error";
          fieldErrors?: Partial<Record<TField, string>>;
          formError?: string;
      };

export type AuthSubmitHandler<TValues, TField extends string> = (
    values: TValues,
) => Promise<AuthSubmitResult<TField>>;

export type LoginSubmitHandler = AuthSubmitHandler<LoginValues, keyof LoginValues>;
export type RegistrationSubmitHandler = AuthSubmitHandler<
    RegistrationValues,
    keyof RegistrationValues
>;

import type { z } from "zod";
import type { registrationSchema, signInSchema } from "./auth.schemas";

export type AuthMode = "signIn" | "registration";
export type SignInValues = z.infer<typeof signInSchema>;
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

export type SignInSubmitHandler = AuthSubmitHandler<SignInValues, keyof SignInValues>;
export type RegistrationSubmitHandler = AuthSubmitHandler<
    RegistrationValues,
    keyof RegistrationValues
>;

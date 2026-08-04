"use client";

import { CustomModal } from "@/components/common/CustomModal";
import { useTranslations } from "next-intl";
import type { AuthMode, RegistrationSubmitHandler, SignInSubmitHandler } from "../model/auth.types";
import { SignInForm } from "./SignInForm";
import { RegistrationForm } from "./RegistrationForm";

interface AuthModalProps {
    mode: AuthMode | null;
    onSignInSubmit: SignInSubmitHandler;
    onModeChange: (mode: AuthMode) => void;
    onOpenChange: (isOpen: boolean) => void;
    onRegistrationSubmit: RegistrationSubmitHandler;
    onSuccess: (mode: AuthMode) => void;
}

export const AuthModal = ({
    mode,
    onSignInSubmit,
    onModeChange,
    onOpenChange,
    onRegistrationSubmit,
    onSuccess,
}: AuthModalProps) => {
    const t = useTranslations("auth");
    const isOpen = mode !== null;
    const close = () => onOpenChange(false);
    const renderForm = () => {
        if (mode === "registration") {
            return (
                <RegistrationForm
                    key="registration"
                    onCancel={close}
                    onSubmit={onRegistrationSubmit}
                    onSuccess={() => {
                        close();
                        onSuccess("registration");
                    }}
                    onSwitchMode={() => onModeChange("signIn")}
                />
            );
        }

        if (mode === "signIn") {
            return (
                <SignInForm
                    key="signIn"
                    onCancel={close}
                    onSubmit={onSignInSubmit}
                    onSuccess={() => {
                        close();
                        onSuccess("signIn");
                    }}
                    onSwitchMode={() => onModeChange("registration")}
                />
            );
        }

        return null;
    };

    return (
        <CustomModal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title={mode === "registration" ? t("signUpButton") : t("signInButton")}
            allowFullScreenOnMobile
            size="lg"
        >
            {renderForm()}
        </CustomModal>
    );
};

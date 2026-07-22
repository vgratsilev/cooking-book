"use client";

import { CustomModal } from "@/components/common/CustomModal";
import type { AuthMode, RegistrationSubmitHandler, SignInSubmitHandler } from "../model/auth.types";
import { SignInForm } from "./SignInForm";
import { RegistrationForm } from "./RegistrationForm";
import { siteConfig } from "@/config/site.config";

interface AuthModalProps {
    mode: AuthMode | null;
    onSignInSubmit: SignInSubmitHandler;
    onModeChange: (mode: AuthMode) => void;
    onOpenChange: (isOpen: boolean) => void;
    onRegistrationSubmit: RegistrationSubmitHandler;
}

export const AuthModal = ({
    mode,
    onSignInSubmit,
    onModeChange,
    onOpenChange,
    onRegistrationSubmit,
}: AuthModalProps) => {
    const isOpen = mode !== null;
    const close = () => onOpenChange(false);
    const renderForm = () => {
        if (mode === "registration") {
            return (
                <RegistrationForm
                    key="registration"
                    onCancel={close}
                    onSubmit={onRegistrationSubmit}
                    onSuccess={close}
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
                    onSuccess={close}
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
            title={mode === "registration" ? siteConfig.signUpButton : siteConfig.signInButton}
            allowFullScreenOnMobile
            size="lg"
        >
            {renderForm()}
        </CustomModal>
    );
};

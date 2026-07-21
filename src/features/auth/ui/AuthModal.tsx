"use client";

import { CustomModal } from "@/components/common/CustomModal";
import type { AuthMode, LoginSubmitHandler, RegistrationSubmitHandler } from "../model/auth.types";
import { LoginForm } from "./LoginForm";
import { RegistrationForm } from "./RegistrationForm";
import { siteConfig } from "@/config/site.config";

interface AuthModalProps {
    mode: AuthMode | null;
    onLoginSubmit: LoginSubmitHandler;
    onModeChange: (mode: AuthMode) => void;
    onOpenChange: (isOpen: boolean) => void;
    onRegistrationSubmit: RegistrationSubmitHandler;
}

export const AuthModal = ({
    mode,
    onLoginSubmit,
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
                    onSwitchMode={() => onModeChange("login")}
                />
            );
        }

        if (mode === "login") {
            return (
                <LoginForm
                    key="login"
                    onCancel={close}
                    onSubmit={onLoginSubmit}
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
            title={mode === "registration" ? siteConfig.signUpButton : siteConfig.loginButton}
            size="lg"
        >
            {renderForm()}
        </CustomModal>
    );
};

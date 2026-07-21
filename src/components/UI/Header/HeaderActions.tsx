"use client";

import { Button } from "@heroui/react";
import { siteConfig } from "@/config/site.config";
import type { AuthMode } from "@/features/auth/model/auth.types";
import { ThemeToggle } from "@/features/theme/ThemeToggle";

interface HeaderActionsProps {
    onOpenAuth: (mode: AuthMode) => void;
    orientation: "desktop" | "mobile";
}

export const HeaderActions = ({ onOpenAuth, orientation }: HeaderActionsProps) => {
    const isMobile = orientation === "mobile";

    return (
        <div className={isMobile ? "flex flex-col gap-2" : "flex items-center gap-4"}>
            <Button
                className={isMobile ? "w-full" : undefined}
                onPress={() => onOpenAuth("login")}
                variant="tertiary"
            >
                {siteConfig.loginButton}
            </Button>
            <Button
                className={isMobile ? "w-full" : undefined}
                onPress={() => onOpenAuth("registration")}
            >
                {siteConfig.signUpButton}
            </Button>
            <ThemeToggle />
        </div>
    );
};

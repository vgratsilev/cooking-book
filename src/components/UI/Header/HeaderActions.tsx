"use client";

import type { Session } from "next-auth";
import { useState } from "react";
import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";
import { signOutUser } from "@/features/auth/api/signOut.action";
import type { AuthMode } from "@/features/auth/model/auth.types";
import { ThemeToggle } from "@/features/theme/ThemeToggle";
import { LocaleSwitcher } from "./LocaleSwitcher";

interface HeaderActionsProps {
    onOpenAuth: (mode: AuthMode) => void;
    onAuthChange: () => void;
    orientation: "desktop" | "mobile";
    session?: Session | null;
}

export const HeaderActions = ({
    onOpenAuth,
    onAuthChange,
    orientation,
    session,
}: HeaderActionsProps) => {
    const t = useTranslations("header");
    const isMobile = orientation === "mobile";
    const [isSigningOut, setIsSigningOut] = useState(false);
    const userLabel = session?.user?.name ?? session?.user?.email;

    const handleSignOut = async () => {
        if (isSigningOut) {
            return;
        }

        setIsSigningOut(true);

        try {
            await signOutUser();
            onAuthChange();
        } finally {
            setIsSigningOut(false);
        }
    };

    return (
        <div className={isMobile ? "flex flex-col gap-2" : "flex items-center gap-3"}>
            {session ? (
                <span aria-label={t("authenticatedUserLabel")} className="text-sm">
                    {userLabel}
                </span>
            ) : (
                <>
                    <Button
                        className={isMobile ? "w-full" : undefined}
                        onPress={() => onOpenAuth("signIn")}
                        variant="tertiary"
                    >
                        {t("signInButton")}
                    </Button>
                    <Button
                        className={isMobile ? "w-full" : undefined}
                        onPress={() => onOpenAuth("registration")}
                    >
                        {t("signUpButton")}
                    </Button>
                </>
            )}

            {session ? (
                <Button
                    className={isMobile ? "w-full" : undefined}
                    isDisabled={isSigningOut}
                    isPending={isSigningOut}
                    onPress={handleSignOut}
                    variant="tertiary"
                >
                    {t("signOutButton")}
                </Button>
            ) : null}

            <div
                aria-label={t("languageAndThemeLabel")}
                className={isMobile ? "flex w-full items-center gap-2" : "flex items-center gap-2"}
                role="group"
            >
                <LocaleSwitcher />
                <ThemeToggle />
            </div>
        </div>
    );
};

"use client";

import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";
import { signOutUser } from "@/features/auth/api/signOut.action";
import { useAuthStore } from "@/features/auth/model/AuthStoreProvider";
import type { AuthMode } from "@/features/auth/model/auth.types";
import type { AuthOperation } from "@/features/auth/model/auth.store";
import { ThemeToggle } from "@/features/theme/ThemeToggle";
import { LocaleSwitcher } from "./LocaleSwitcher";

interface HeaderActionsProps {
    onOpenAuth: (mode: AuthMode) => void;
    onAuthChange: (operation: AuthOperation) => boolean;
    orientation: "desktop" | "mobile";
}

export const HeaderActions = ({ onOpenAuth, onAuthChange, orientation }: HeaderActionsProps) => {
    const t = useTranslations("header");
    const isMobile = orientation === "mobile";
    const session = useAuthStore((state) => state.session);
    const acquireSignOutLock = useAuthStore((state) => state.acquireSignOutLock);
    const cancelTransition = useAuthStore((state) => state.cancelTransition);
    const isSigningOut = useAuthStore(
        (state) => state.transition.phase !== "idle" && state.transition.operation === "signOut",
    );
    const userLabel = session?.user?.name ?? session?.user?.email;

    const handleSignOut = async () => {
        if (!acquireSignOutLock()) {
            return;
        }

        try {
            await signOutUser();
            if (!onAuthChange("signOut")) {
                cancelTransition();
            }
        } catch {
            cancelTransition();
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

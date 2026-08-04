"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { registerUser } from "@/features/auth/api/register.action";
import { loginUser } from "@/features/auth/api/signin.action";
import { useAuthStore } from "@/features/auth/model/AuthStoreProvider";
import type { AuthOperation } from "@/features/auth/model/auth.store";
import type { AuthMode } from "@/features/auth/model/auth.types";
import { AuthModal } from "@/features/auth/ui/AuthModal";
import { HeaderActions } from "./HeaderActions";
import { HeaderNavigation } from "./HeaderNavigation";
const Logo = ({ title }: { title: string }) => {
    return <Image src="/cooking-book-logo.png" width={50} height={50} alt={title} priority />;
};

export const Header = () => {
    const t = useTranslations("header");
    const router = useRouter();
    const startRefreshing = useAuthStore((state) => state.startRefreshing);
    const completeRefreshing = useAuthStore((state) => state.completeRefreshing);
    const isAuthTransitionActive = useAuthStore(
        (state) => state.transition.phase !== "idle",
    );
    const [isRouterRefreshing, startRouterTransition] = useTransition();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [authMode, setAuthMode] = useState<AuthMode | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        if (!isRouterRefreshing) {
            completeRefreshing();
        }
    }, [completeRefreshing, isRouterRefreshing]);

    const openAuthModal = (mode: AuthMode) => {
        if (isAuthTransitionActive) {
            return;
        }

        setIsMenuOpen(false);
        setAuthMode(mode);
    };

    const handleAuthModalOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setAuthMode(null);
        }
    };

    const handleAuthChange = (operation: AuthOperation) => {
        if (!startRefreshing(operation)) {
            return false;
        }

        setAuthMode(null);
        startRouterTransition(() => router.refresh());
        return true;
    };

    return (
        <nav className="border-separator bg-background/70 sticky top-0 z-40 w-full border-b backdrop-blur-lg">
            <header className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-6">
                <div className="flex shrink-0 items-center gap-3">
                    <button
                        aria-expanded={isMenuOpen}
                        aria-label={t("toggleMenuLabel")}
                        className="cursor-pointer lg:hidden"
                        onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
                        type="button"
                    >
                        <span className="sr-only">{t("menuLabel")}</span>
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {isMenuOpen ? (
                                <path
                                    d="M6 18L18 6M6 6l12 12"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                />
                            ) : (
                                <path
                                    d="M4 6h16M4 12h16M4 18h16"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                />
                            )}
                        </svg>
                    </button>
                    <div className="flex items-center gap-3">
                        <Logo title={t("title")} />
                        <p className="font-bold">{t("title")}</p>
                    </div>
                </div>

                <HeaderNavigation
                    className="hidden min-w-0 flex-1 items-center justify-center gap-3 lg:flex"
                    pathname={pathname}
                />
                <div className="hidden shrink-0 lg:block">
                    <HeaderActions
                        onOpenAuth={openAuthModal}
                        onAuthChange={handleAuthChange}
                        orientation="desktop"
                    />
                </div>
            </header>

            {isMenuOpen ? (
                <div className="border-separator bg-background absolute inset-x-0 top-full z-10 max-h-[calc(100dvh-4rem)] overflow-y-auto border-t shadow-lg lg:hidden">
                    <HeaderNavigation className="flex flex-col gap-2 p-4" pathname={pathname} />
                    <div className="border-separator border-t p-4">
                        <HeaderActions
                            onOpenAuth={openAuthModal}
                            onAuthChange={handleAuthChange}
                            orientation="mobile"
                        />
                    </div>
                </div>
            ) : null}

            <AuthModal
                mode={authMode}
                onSignInSubmit={loginUser}
                onModeChange={setAuthMode}
                onOpenChange={handleAuthModalOpenChange}
                onRegistrationSubmit={registerUser}
                onSuccess={handleAuthChange}
            />
        </nav>
    );
};

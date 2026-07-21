"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { siteConfig } from "@/config/site.config";
import type {
    AuthMode,
    AuthSubmitResult,
    LoginValues,
    RegistrationValues,
} from "@/features/auth/model/auth.types";
import { AuthModal } from "@/features/auth/ui/AuthModal";
import { HeaderActions } from "./HeaderActions";
import { HeaderNavigation } from "./HeaderNavigation";

const notConfiguredSubmit = async <TValues extends Record<string, string>>(
    values: TValues,
): Promise<AuthSubmitResult<keyof TValues & string>> => {
    void values;
    return {
        status: "error",
        formError: "Authentication is not configured yet.",
    };
};

const Logo = () => {
    return (
        <Image
            src="/cooking-book-logo.png"
            width={50}
            height={50}
            alt={siteConfig.title}
            priority
        />
    );
};

export const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [authMode, setAuthMode] = useState<AuthMode | null>(null);
    const pathname = usePathname();

    const openAuthModal = (mode: AuthMode) => {
        setIsMenuOpen(false);
        setAuthMode(mode);
    };

    const handleAuthModalOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setAuthMode(null);
        }
    };

    return (
        <nav className="border-separator bg-background/70 sticky top-0 z-40 w-full border-b backdrop-blur-lg">
            <header className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <button
                        aria-expanded={isMenuOpen}
                        aria-label="Toggle menu"
                        className="cursor-pointer md:hidden"
                        onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
                        type="button"
                    >
                        <span className="sr-only">Menu</span>
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
                        <Logo />
                        <p className="font-bold">{siteConfig.title}</p>
                    </div>
                </div>

                <HeaderNavigation
                    className="hidden items-center gap-4 md:flex"
                    pathname={pathname}
                />
                <div className="hidden md:block">
                    <HeaderActions onOpenAuth={openAuthModal} orientation="desktop" />
                </div>
            </header>

            {isMenuOpen ? (
                <div className="border-separator border-t md:hidden">
                    <HeaderNavigation className="flex flex-col gap-2 p-4" pathname={pathname} />
                    <div className="border-separator border-t p-4">
                        <HeaderActions onOpenAuth={openAuthModal} orientation="mobile" />
                    </div>
                </div>
            ) : null}

            <AuthModal
                mode={authMode}
                onLoginSubmit={notConfiguredSubmit<LoginValues>}
                onModeChange={setAuthMode}
                onOpenChange={handleAuthModalOpenChange}
                onRegistrationSubmit={notConfiguredSubmit<RegistrationValues>}
            />
        </nav>
    );
};

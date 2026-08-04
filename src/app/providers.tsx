"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { Session } from "next-auth";
import type { ComponentProps, ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { AuthStoreProvider } from "@/features/auth/model/AuthStoreProvider";

type Messages = ComponentProps<typeof NextIntlClientProvider>["messages"];

interface ProvidersProps {
    children: ReactNode;
    initialSession: Session | null;
    locale: string;
    messages: Messages;
}

export const Providers = ({ children, initialSession, locale, messages }: ProvidersProps) => {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            disableTransitionOnChange
            enableSystem
        >
            <NextIntlClientProvider locale={locale} messages={messages}>
                <AuthStoreProvider initialSession={initialSession}>{children}</AuthStoreProvider>
            </NextIntlClientProvider>
        </NextThemesProvider>
    );
};

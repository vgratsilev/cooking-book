"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps, ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";

type Messages = ComponentProps<typeof NextIntlClientProvider>["messages"];

interface ProvidersProps {
    children: ReactNode;
    locale: string;
    messages: Messages;
}

export const Providers = ({ children, locale, messages }: ProvidersProps) => {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            disableTransitionOnChange
            enableSystem
        >
            <NextIntlClientProvider locale={locale} messages={messages}>
                {children}
            </NextIntlClientProvider>
        </NextThemesProvider>
    );
};

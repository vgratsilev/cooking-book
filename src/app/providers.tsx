"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

interface ProvidersProps {
    children: ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            disableTransitionOnChange
            enableSystem
        >
            {children}
        </NextThemesProvider>
    );
};

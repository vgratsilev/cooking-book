import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import "./globals.css";
import { Header } from "@/components/UI/Header/Header";
import { auth } from "@/features/auth/auth";
import { Providers } from "./providers";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("site");

    return { title: t("title"), description: t("description") };
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [session, locale, messages, t] = await Promise.all([
        auth(),
        getLocale(),
        getMessages(),
        getTranslations("site"),
    ]);

    return (
        <html
            lang={locale}
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
            suppressHydrationWarning
        >
            <body className="bg-background text-foreground flex min-h-screen flex-col">
                <Providers initialSession={session} locale={locale} messages={messages}>
                    <Header session={session} />
                    <main className="flex min-h-0 w-full flex-1 flex-col items-center justify-start">
                        {children}
                    </main>
                    <footer className="flex h-20 shrink-0 items-center justify-center">
                        {t("description")}
                    </footer>
                </Providers>
            </body>
        </html>
    );
}

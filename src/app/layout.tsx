import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site.config";
import { Header } from "@/components/UI/Header/Header";
import { Providers } from "./providers";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: siteConfig.title,
    description: siteConfig.description,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
            suppressHydrationWarning
        >
            <body className="bg-background text-foreground flex min-h-screen flex-col">
                <Providers>
                    <Header />
                    <main className="flex min-h-0 w-full flex-1 flex-col items-center justify-start">
                        {children}
                    </main>
                    <footer className="flex h-20 shrink-0 items-center justify-center">
                        {siteConfig.description}
                    </footer>
                </Providers>
            </body>
        </html>
    );
}

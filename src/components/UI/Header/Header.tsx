"use client";

import { useState } from "react";
import { Link, Button } from "@heroui/react";
import Image from "next/image";
import { siteConfig } from "@/config/site.config";
import { usePathname } from "next/navigation";

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

    const pathname = usePathname();

    const getNavItems = () => {
        return siteConfig.navItems.map((navItem) => {
            const isActive = pathname === navItem.href;
            return (
                <li key={navItem.href}>
                    <Link
                        href={navItem.href}
                        className={`py-1 ${isActive ? "text-red-500" : "text-foreground hover:text-red-300"} transition-[color] duration-200`}
                    >
                        {navItem.label}
                    </Link>
                </li>
            );
        });
    };

    return (
        <nav className="border-separator bg-background/70 sticky top-0 z-40 w-full border-b backdrop-blur-lg">
            <header className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <button
                        className="md:hidden"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                        aria-expanded={isMenuOpen}
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
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </button>
                    <div className="flex items-center gap-3">
                        <Logo />
                        <p className="font-bold">{siteConfig.title}</p>
                    </div>
                </div>
                <ul className="hidden items-center gap-4 md:flex">{getNavItems()}</ul>
                <div className="hidden items-center gap-4 md:flex">
                    <Link href="#">{siteConfig.loginButton}</Link>
                    <Button>{siteConfig.signUpButton}</Button>
                </div>
            </header>
            {isMenuOpen && (
                <div className="border-separator border-t md:hidden">
                    <ul className="flex flex-col gap-2 p-4">
                        {getNavItems()}
                        <li className="border-separator mt-4 flex flex-col gap-2 border-t pt-4">
                            <Link href="#" className="block py-2">
                                {siteConfig.loginButton}
                            </Link>
                            <Button className="w-full">{siteConfig.signUpButton}</Button>
                        </li>
                    </ul>
                </div>
            )}
        </nav>
    );
};

"use client";

import { Link } from "@heroui/react";
import { siteConfig } from "@/config/site.config";

interface HeaderNavigationProps {
    pathname: string;
    className?: string;
}

export const HeaderNavigation = ({ pathname, className }: HeaderNavigationProps) => {
    return (
        <ul className={className}>
            {siteConfig.navItems.map((navItem) => {
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
            })}
        </ul>
    );
};

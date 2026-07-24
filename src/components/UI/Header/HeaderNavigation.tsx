"use client";

import { Link } from "@heroui/react";
import { useTranslations } from "next-intl";
import { navItems } from "@/config/site.config";

interface HeaderNavigationProps {
    pathname: string;
    className?: string;
}

export const HeaderNavigation = ({ pathname, className }: HeaderNavigationProps) => {
    const t = useTranslations("navigation");

    return (
        <ul className={className}>
            {navItems.map((navItem) => {
                const isActive = pathname === navItem.href;

                return (
                    <li className="shrink-0" key={navItem.href}>
                        <Link
                            href={navItem.href}
                            className={`py-1 whitespace-nowrap ${isActive ? "text-red-500" : "text-foreground hover:text-red-300"} transition-[color] duration-200`}
                        >
                            {t(navItem.labelKey)}
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
};

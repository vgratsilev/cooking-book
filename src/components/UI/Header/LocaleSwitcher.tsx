"use client";

import { Dropdown } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { defaultLocale, isLocale, localeCookieName, type Locale } from "@/config/site.config";

const localeOptions: Record<
    Locale,
    { flag: string; nameKey: "englishLanguageName" | "russianLanguageName" }
> = {
    en: { flag: "🇺🇸", nameKey: "englishLanguageName" },
    ru: { flag: "🇷🇺", nameKey: "russianLanguageName" },
};

export const LocaleSwitcher = () => {
    const requestedLocale = useLocale();
    const router = useRouter();
    const t = useTranslations("header");
    const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
    const currentLocale = localeOptions[locale];

    const setLocale = (nextLocale: Locale) => {
        if (nextLocale === locale) {
            return;
        }

        document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
        router.refresh();
    };

    return (
        <Dropdown>
            <Dropdown.Trigger
                aria-label={`${t("languageLabel")}: ${t(currentLocale.nameKey)}`}
                className="button button--sm button--secondary inline-flex items-center gap-2"
            >
                <span aria-hidden="true">{currentLocale.flag}</span>
                <span>{t(currentLocale.nameKey)}</span>
                <svg
                    aria-hidden="true"
                    className="size-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        d="m6 9 6 6 6-6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                    />
                </svg>
            </Dropdown.Trigger>
            <Dropdown.Popover className="w-max min-w-0" placement="bottom end">
                <Dropdown.Menu
                    aria-label={t("languageLabel")}
                    onAction={(key) => {
                        if (key === "en" || key === "ru") {
                            setLocale(key);
                        }
                    }}
                    selectedKeys={[locale]}
                    selectionMode="single"
                >
                    {(
                        Object.entries(localeOptions) as [Locale, (typeof localeOptions)[Locale]][]
                    ).map(([optionLocale, option]) => (
                        <Dropdown.Item
                            id={optionLocale}
                            key={optionLocale}
                            textValue={t(option.nameKey)}
                        >
                            <span aria-hidden="true">{option.flag}</span>
                            <span>{t(option.nameKey)}</span>
                            <Dropdown.ItemIndicator />
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown>
    );
};

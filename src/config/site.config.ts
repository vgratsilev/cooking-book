export const locales = ["en", "ru"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const localeCookieName = "cooking-book-locale";

export const navItems = [
    { href: "/", labelKey: "recipes" },
    { href: "/ingredients", labelKey: "ingredients" },
    { href: "/about", labelKey: "about" },
] as const;

export const isLocale = (value: string | undefined): value is Locale => {
    return locales.includes(value as Locale);
};

import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, localeCookieName, type Locale } from "@/config/site.config";
import en from "./messages/en.json";
import ru from "./messages/ru.json";

const messages = { en, ru } as const;

export default getRequestConfig(async () => {
    const cookieLocale = (await cookies()).get(localeCookieName)?.value;
    const locale: Locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;

    return { locale, messages: messages[locale] };
});

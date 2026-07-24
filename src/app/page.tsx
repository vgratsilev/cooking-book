import { getTranslations } from "next-intl/server";

export default async function Home() {
    const t = await getTranslations("pages");

    return <h1 className="text-3xl font-bold">{t("homeTitle")}</h1>;
}

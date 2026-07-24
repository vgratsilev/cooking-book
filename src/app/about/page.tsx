import { getTranslations } from "next-intl/server";

const AboutPage = async () => {
    const t = await getTranslations("pages");

    return (
        <div>
            <h1>{t("aboutTitle")}</h1>
        </div>
    );
};

export default AboutPage;

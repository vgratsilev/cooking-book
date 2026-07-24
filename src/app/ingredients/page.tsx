import { getTranslations } from "next-intl/server";

const IngredientsPage = async () => {
    const t = await getTranslations("pages");

    return (
        <div>
            <h1>{t("ingredientsTitle")}</h1>
        </div>
    );
};

export default IngredientsPage;

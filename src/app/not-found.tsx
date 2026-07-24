import { buttonVariants, Link } from "@heroui/react";
import { getTranslations } from "next-intl/server";

const NotFoundPage = async () => {
    const t = await getTranslations("notFound");

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="text-8xl font-bold text-gray-300">404</div>
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <div className="pt-6">
                <Link href="/" className={buttonVariants({ variant: "primary", size: "md" })}>
                    {t("returnToMain")}
                </Link>
            </div>
        </div>
    );
};

export default NotFoundPage;

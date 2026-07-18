"use client";

import { buttonVariants, Link } from "@heroui/react";

const NotFoundPage = () => {
    return (
        <div className="flex flex-col items-center justify-center">
            <div className="text-8xl font-bold text-gray-300">404</div>
            <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
            <div className="pt-6">
                <Link href="/" className={buttonVariants({ variant: "primary", size: "md" })}>
                    Return to main
                </Link>
            </div>
        </div>
    );
};

export default NotFoundPage;

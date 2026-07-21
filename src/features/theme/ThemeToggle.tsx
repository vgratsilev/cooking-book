"use client";

import { Button } from "@heroui/react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;

export const ThemeToggle = () => {
    const mounted = useSyncExternalStore(
        subscribe,
        () => true,
        () => false,
    );
    const { resolvedTheme, setTheme } = useTheme();

    if (!mounted) {
        return <div aria-hidden="true" className="size-9" />;
    }

    const isDark = resolvedTheme === "dark";
    const nextTheme = isDark ? "light" : "dark";

    return (
        <Button
            aria-label={`Switch to ${nextTheme} theme`}
            isIconOnly
            onPress={() => setTheme(nextTheme)}
            variant="secondary"
        >
            <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
        </Button>
    );
};

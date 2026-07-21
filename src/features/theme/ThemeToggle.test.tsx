import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTheme } from "next-themes";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "./ThemeToggle";

vi.mock("next-themes", () => ({
    useTheme: vi.fn(),
}));

const mockedUseTheme = vi.mocked(useTheme);

describe("ThemeToggle", () => {
    beforeEach(() => {
        mockedUseTheme.mockReturnValue({
            resolvedTheme: "light",
            setTheme: vi.fn(),
        } as unknown as ReturnType<typeof useTheme>);
    });

    it("renders a stable placeholder before the client mount", () => {
        const html = renderToString(<ThemeToggle />);

        expect(html).toContain('class="size-9"');
        expect(html).not.toContain("Switch to");
    });

    it("toggles the resolved theme with an accessible name", async () => {
        const setTheme = vi.fn();
        mockedUseTheme.mockReturnValue({
            resolvedTheme: "light",
            setTheme,
        } as unknown as ReturnType<typeof useTheme>);
        const user = userEvent.setup();

        render(<ThemeToggle />);

        const toggle = await screen.findByRole("button", { name: "Switch to dark theme" });
        await user.click(toggle);

        expect(setTheme).toHaveBeenCalledWith("dark");
    });
});

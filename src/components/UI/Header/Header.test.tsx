import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "./Header";

vi.mock("next/navigation", () => ({
    usePathname: () => "/ingredients",
}));

describe("Header", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("opens the shared auth modal from desktop actions", async () => {
        const user = userEvent.setup();
        render(<Header />);

        await user.click(screen.getAllByRole("button", { name: "Login" })[0]);

        expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
        expect(screen.getAllByRole("dialog")).toHaveLength(1);
    });

    it("closes the mobile menu before opening auth", async () => {
        const user = userEvent.setup();
        render(<Header />);

        await user.click(screen.getByRole("button", { name: "Toggle menu" }));
        expect(screen.getByRole("button", { name: "Toggle menu" })).toHaveAttribute(
            "aria-expanded",
            "true",
        );

        await user.click(screen.getAllByRole("button", { name: "Login" })[1]);

        expect(screen.getByRole("button", { name: "Toggle menu", hidden: true })).toHaveAttribute(
            "aria-expanded",
            "false",
        );
        expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    });

    it("preserves the active navigation link and exposes a separate theme action", async () => {
        render(<Header />);

        expect(screen.getByRole("link", { name: "Ingredients" })).toHaveClass("text-red-500");
        expect(await screen.findAllByRole("button", { name: /Switch to/ })).not.toHaveLength(0);
        expect(screen.getByRole("button", { name: "Toggle menu" })).toBeInTheDocument();
    });
});

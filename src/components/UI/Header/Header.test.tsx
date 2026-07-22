import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerUser } from "@/features/auth/api/register.action";
import { Header } from "./Header";

vi.mock("next/navigation", () => ({
    usePathname: () => "/ingredients",
}));

vi.mock("@/features/auth/api/register.action", () => ({
    registerUser: vi.fn(),
}));

describe("Header", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("opens the shared auth modal from desktop actions", async () => {
        const user = userEvent.setup();
        render(<Header />);

        await user.click(screen.getAllByRole("button", { name: "Sign in" })[0]);

        expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
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

        await user.click(screen.getAllByRole("button", { name: "Sign in" })[1]);

        expect(screen.getByRole("button", { name: "Toggle menu", hidden: true })).toHaveAttribute(
            "aria-expanded",
            "false",
        );
        expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    });

    it("preserves the active navigation link and exposes a separate theme action", async () => {
        render(<Header />);

        expect(screen.getByRole("link", { name: "Ingredients" })).toHaveClass("text-red-500");
        expect(await screen.findAllByRole("button", { name: /Switch to/ })).not.toHaveLength(0);
        expect(screen.getByRole("button", { name: "Toggle menu" })).toBeInTheDocument();
    });

    it("submits valid registration data through the registration Server Action", async () => {
        const user = userEvent.setup();
        vi.mocked(registerUser).mockResolvedValue({ status: "success" });
        render(<Header />);

        await user.click(screen.getAllByRole("button", { name: "Sign up" })[0]);
        const registrationForm = screen.getByRole("form", { name: "Registration form" });

        await user.type(
            within(registrationForm).getByRole("textbox", { name: "Email" }),
            "user@example.com",
        );
        await user.type(within(registrationForm).getByLabelText("Password"), "StrongPass1");
        await user.type(within(registrationForm).getByLabelText("Confirm password"), "StrongPass1");
        await user.click(within(registrationForm).getByRole("button", { name: "Sign up" }));

        await waitFor(() => {
            expect(registerUser).toHaveBeenCalledWith({
                email: "user@example.com",
                password: "StrongPass1",
                confirmPassword: "StrongPass1",
            });
        });
    });
});

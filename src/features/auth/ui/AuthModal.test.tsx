import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { AuthMode, LoginSubmitHandler, RegistrationSubmitHandler } from "../model/auth.types";
import { AuthModal } from "./AuthModal";

const loginSubmit: LoginSubmitHandler = vi.fn().mockResolvedValue({
    status: "error",
    formError: "Authentication is not configured yet.",
});
const registrationSubmit: RegistrationSubmitHandler = vi.fn().mockResolvedValue({
    status: "error",
    formError: "Authentication is not configured yet.",
});

const ControlledAuthModal = ({ initialMode }: { initialMode: AuthMode }) => {
    const [mode, setMode] = useState<AuthMode | null>(initialMode);

    return (
        <AuthModal
            mode={mode}
            onLoginSubmit={loginSubmit}
            onModeChange={setMode}
            onOpenChange={(isOpen) => setMode(isOpen ? mode : null)}
            onRegistrationSubmit={registrationSubmit}
        />
    );
};

describe("AuthModal", () => {
    it("renders one mode at a time and keeps the overlay open while switching", async () => {
        const user = userEvent.setup();
        render(<ControlledAuthModal initialMode="login" />);

        expect(screen.getAllByRole("dialog")).toHaveLength(1);
        expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
        expect(screen.getByRole("form", { name: "Login form" })).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Create account" }));

        expect(screen.getAllByRole("dialog")).toHaveLength(1);
        expect(screen.getByRole("heading", { name: "Sign up" })).toBeInTheDocument();
        expect(screen.getByRole("form", { name: "Registration form" })).toBeInTheDocument();
        expect(screen.queryByRole("form", { name: "Login form" })).not.toBeInTheDocument();
    });

    it("unmounts the previous form so values and errors do not leak between modes", async () => {
        const user = userEvent.setup();
        render(<ControlledAuthModal initialMode="login" />);

        await user.type(screen.getByRole("textbox", { name: "Email" }), "old@example.com");
        await user.click(screen.getByRole("button", { name: "Create account" }));
        await user.click(screen.getByRole("button", { name: "Sign in" }));

        expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue("");
    });

    it("ignores a stale success after switching modes during a pending submit", async () => {
        const user = userEvent.setup();
        let resolveLogin: ((result: Awaited<ReturnType<LoginSubmitHandler>>) => void) | undefined;
        const pendingLogin: LoginSubmitHandler = () =>
            new Promise<Awaited<ReturnType<LoginSubmitHandler>>>((resolve) => {
                resolveLogin = resolve;
            });

        const { rerender } = render(
            <AuthModal
                mode="login"
                onLoginSubmit={pendingLogin}
                onModeChange={() => undefined}
                onOpenChange={() => undefined}
                onRegistrationSubmit={registrationSubmit}
            />,
        );

        await user.type(screen.getByRole("textbox", { name: "Email" }), "user@example.com");
        await user.type(screen.getByLabelText("Password"), "short");
        await user.click(screen.getByRole("button", { name: "Sign in" }));

        rerender(
            <AuthModal
                mode="registration"
                onLoginSubmit={pendingLogin}
                onModeChange={() => undefined}
                onOpenChange={() => undefined}
                onRegistrationSubmit={registrationSubmit}
            />,
        );
        resolveLogin?.({ status: "success" });

        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(screen.getByRole("heading", { name: "Sign up" })).toBeInTheDocument();
    });
});

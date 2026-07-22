import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { AuthMode, RegistrationSubmitHandler, SignInSubmitHandler } from "../model/auth.types";
import { AuthModal } from "./AuthModal";

const signInSubmit: SignInSubmitHandler = vi.fn().mockResolvedValue({
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
            onSignInSubmit={signInSubmit}
            onModeChange={setMode}
            onOpenChange={(isOpen) => setMode(isOpen ? mode : null)}
            onRegistrationSubmit={registrationSubmit}
        />
    );
};

describe("AuthModal", () => {
    it("renders one mode at a time and keeps the overlay open while switching", async () => {
        const user = userEvent.setup();
        render(<ControlledAuthModal initialMode="signIn" />);

        expect(screen.getAllByRole("dialog")).toHaveLength(1);
        expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
        expect(screen.getByRole("form", { name: "Sign in form" })).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Sign up" }));

        expect(screen.getAllByRole("dialog")).toHaveLength(1);
        expect(screen.getByRole("heading", { name: "Sign up" })).toBeInTheDocument();
        expect(screen.getByRole("form", { name: "Registration form" })).toBeInTheDocument();
        expect(screen.queryByRole("form", { name: "Sign in form" })).not.toBeInTheDocument();
    });

    it("unmounts the previous form so values and errors do not leak between modes", async () => {
        const user = userEvent.setup();
        render(<ControlledAuthModal initialMode="signIn" />);

        await user.type(screen.getByRole("textbox", { name: "Email" }), "old@example.com");
        await user.click(screen.getByRole("button", { name: "Sign up" }));
        await user.click(screen.getByRole("button", { name: "Sign in" }));

        expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue("");
    });

    it("ignores a stale success after switching modes during a pending submit", async () => {
        const user = userEvent.setup();
        let resolveSignIn: ((result: Awaited<ReturnType<SignInSubmitHandler>>) => void) | undefined;
        const pendingSignIn: SignInSubmitHandler = () =>
            new Promise<Awaited<ReturnType<SignInSubmitHandler>>>((resolve) => {
                resolveSignIn = resolve;
            });

        const { rerender } = render(
            <AuthModal
                mode="signIn"
                onSignInSubmit={pendingSignIn}
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
                onSignInSubmit={pendingSignIn}
                onModeChange={() => undefined}
                onOpenChange={() => undefined}
                onRegistrationSubmit={registrationSubmit}
            />,
        );
        resolveSignIn?.({ status: "success" });

        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(screen.getByRole("heading", { name: "Sign up" })).toBeInTheDocument();
    });
});

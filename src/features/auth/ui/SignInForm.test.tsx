import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SignInSubmitHandler } from "../model/auth.types";
import { SignInForm } from "./SignInForm";
import { renderWithIntl } from "@/test/intl";

const renderSignInForm = (onSubmit: SignInSubmitHandler = vi.fn()) => {
    const onCancel = vi.fn();
    const onSuccess = vi.fn();
    const onSwitchMode = vi.fn();

    renderWithIntl(
        <SignInForm
            onCancel={onCancel}
            onSubmit={onSubmit}
            onSuccess={onSuccess}
            onSwitchMode={onSwitchMode}
        />,
    );

    return { onCancel, onSuccess, onSwitchMode, onSubmit };
};

describe("SignInForm", () => {
    it("tabs through actions in their visual order", async () => {
        const user = userEvent.setup();
        renderSignInForm();

        screen.getByLabelText("Password").focus();
        await user.tab();
        expect(screen.getByRole("button", { name: "Sign in" })).toHaveFocus();

        await user.tab();
        expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    });

    it("validates email after blur and clears the error after correction", async () => {
        const user = userEvent.setup();
        renderSignInForm();
        const email = screen.getByRole("textbox", { name: "Email" });

        await user.type(email, "invalid");
        await user.tab();
        expect(screen.getByText(/Please enter a valid email address/)).toBeInTheDocument();

        await user.type(email, "user@example.com");
        await user.tab();
        expect(screen.queryByText(/Please enter a valid email address/)).not.toBeInTheDocument();
    });

    it("accepts a non-empty password without registration rules", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue({ status: "success" });
        const { onSuccess } = renderSignInForm(onSubmit);

        await user.type(screen.getByRole("textbox", { name: "Email" }), "user@example.com");
        await user.type(screen.getByLabelText("Password"), "short");
        await user.click(screen.getByRole("button", { name: "Sign in" }));

        expect(onSubmit).toHaveBeenCalledWith({ email: "user@example.com", password: "short" });
        expect(onSuccess).toHaveBeenCalled();
    });

    it("focuses the first invalid field and does not submit an empty form", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        renderSignInForm(onSubmit);

        await user.click(screen.getByRole("button", { name: "Sign in" }));

        expect(onSubmit).not.toHaveBeenCalled();
        expect(screen.getByRole("textbox", { name: "Email" })).toHaveFocus();
        expect(screen.getByText(/Email is required/)).toBeInTheDocument();
        expect(screen.getByText(/Password is required/)).toBeInTheDocument();
    });

    it("keeps the form open and shows async errors", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue({
            status: "error",
            formError: "Authentication is not configured yet.",
        });
        renderSignInForm(onSubmit);

        await user.type(screen.getByRole("textbox", { name: "Email" }), "user@example.com");
        await user.type(screen.getByLabelText("Password"), "short");
        await user.click(screen.getByRole("button", { name: "Sign in" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Authentication is not configured yet.",
        );
        expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    });

    it("disables fields and blocks duplicate submits while pending", async () => {
        const user = userEvent.setup();
        let resolveSubmit: ((result: Awaited<ReturnType<SignInSubmitHandler>>) => void) | undefined;
        const onSubmit = vi.fn<SignInSubmitHandler>(
            () =>
                new Promise<Awaited<ReturnType<SignInSubmitHandler>>>((resolve) => {
                    resolveSubmit = resolve;
                }),
        );
        renderSignInForm(onSubmit);

        const email = screen.getByRole("textbox", { name: "Email" });
        const submit = screen.getByRole("button", { name: "Sign in" });
        await user.type(email, "user@example.com");
        await user.type(screen.getByLabelText("Password"), "short");
        await user.click(submit);
        await user.click(submit);

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(email).toBeDisabled();
        resolveSubmit?.({ status: "error", formError: "done" });
    });
});

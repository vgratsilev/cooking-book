import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { RegistrationSubmitHandler } from "../model/auth.types";
import { RegistrationForm } from "./RegistrationForm";

const renderRegistrationForm = (onSubmit: RegistrationSubmitHandler = vi.fn()) => {
    const onCancel = vi.fn();
    const onSuccess = vi.fn();
    const onSwitchMode = vi.fn();

    render(
        <RegistrationForm
            onCancel={onCancel}
            onSubmit={onSubmit}
            onSuccess={onSuccess}
            onSwitchMode={onSwitchMode}
        />,
    );

    return { onCancel, onSuccess, onSwitchMode, onSubmit };
};

describe("RegistrationForm", () => {
    it("shows password policy errors after blur", async () => {
        const user = userEvent.setup();
        renderRegistrationForm();
        const password = screen.getByLabelText("Password");

        await user.click(password);
        await user.tab();

        expect(screen.getByText(/Password must be at least 8 characters/)).toBeInTheDocument();
        expect(
            screen.getByText(/Password must contain at least one uppercase letter/),
        ).toBeInTheDocument();
        expect(screen.getByText(/Password must contain at least one number/)).toBeInTheDocument();
    });

    it("validates confirmation and rechecks it when the password changes", async () => {
        const user = userEvent.setup();
        renderRegistrationForm();
        const password = screen.getByLabelText("Password");
        const confirmation = screen.getByLabelText("Confirm password");

        await user.type(password, "StrongPass1");
        await user.type(confirmation, "StrongPass1");
        await user.tab();
        expect(screen.queryByText("Passwords must match")).not.toBeInTheDocument();

        await user.click(password);
        await user.clear(password);
        await user.type(password, "OtherPass1");
        expect(await screen.findByText("Passwords must match")).toBeInTheDocument();
    });

    it("submits parsed values only after all fields are valid", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue({ status: "success" });
        const { onSuccess } = renderRegistrationForm(onSubmit);

        await user.type(screen.getByRole("textbox", { name: "Email" }), "user@example.com");
        await user.type(screen.getByLabelText("Password"), "StrongPass1");
        await user.type(screen.getByLabelText("Confirm password"), "StrongPass1");
        await user.click(screen.getByRole("button", { name: "Sign up" }));

        expect(onSubmit).toHaveBeenCalledWith({
            email: "user@example.com",
            password: "StrongPass1",
            confirmPassword: "StrongPass1",
        });
        expect(onSuccess).toHaveBeenCalled();
    });
});

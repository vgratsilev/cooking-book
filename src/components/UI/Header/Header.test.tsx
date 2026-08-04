import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerUser } from "@/features/auth/api/register.action";
import { loginUser } from "@/features/auth/api/signin.action";
import { signOutUser } from "@/features/auth/api/signOut.action";
import { AuthStoreProvider } from "@/features/auth/model/AuthStoreProvider";
import { renderWithIntl } from "@/test/intl";
import { Header } from "./Header";

const refresh = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
    usePathname: () => "/ingredients",
    useRouter: () => ({ refresh }),
}));

vi.mock("@/features/auth/api/register.action", () => ({
    registerUser: vi.fn(),
}));

vi.mock("@/features/auth/api/signin.action", () => ({
    loginUser: vi.fn(),
}));

vi.mock("@/features/auth/api/signOut.action", () => ({
    signOutUser: vi.fn(),
}));

const renderHeader = (session: Session | null = null) =>
    renderWithIntl(
        <AuthStoreProvider initialSession={session}>
            <Header session={session} />
        </AuthStoreProvider>,
    );

describe("Header", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(loginUser).mockResolvedValue({ status: "success" });
        vi.mocked(signOutUser).mockResolvedValue(undefined);
    });

    it("opens the shared auth modal from desktop actions", async () => {
        const user = userEvent.setup();
        renderHeader();

        await user.click(screen.getAllByRole("button", { name: "Sign in" })[0]);

        expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
        expect(screen.getAllByRole("dialog")).toHaveLength(1);
    });

    it("closes the mobile menu before opening auth", async () => {
        const user = userEvent.setup();
        renderHeader();

        await user.click(screen.getByRole("button", { name: "Toggle menu" }));
        expect(screen.getByRole("button", { name: "Toggle menu" })).toHaveAttribute(
            "aria-expanded",
            "true",
        );
        expect(screen.getByRole("navigation").children[1]).toHaveClass("absolute", "top-full");

        await user.click(screen.getAllByRole("button", { name: "Sign in" })[1]);

        expect(screen.getByRole("button", { name: "Toggle menu", hidden: true })).toHaveAttribute(
            "aria-expanded",
            "false",
        );
        expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    });

    it("preserves the active navigation link and exposes a separate theme action", async () => {
        renderHeader();

        expect(screen.getByRole("link", { name: "Ingredients" })).toHaveClass("text-red-500");
        expect(await screen.findAllByRole("button", { name: /Switch to/ })).not.toHaveLength(0);
        expect(screen.getByRole("button", { name: "Toggle menu" })).toBeInTheDocument();
    });

    it("submits valid registration data through the registration Server Action", async () => {
        const user = userEvent.setup();
        vi.mocked(registerUser).mockResolvedValue({ status: "success" });
        renderHeader();

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
        await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
        expect(screen.queryByRole("heading", { name: "Sign up" })).not.toBeInTheDocument();
    });

    it("closes the sign-in modal and refreshes after a successful sign-in", async () => {
        const user = userEvent.setup();
        vi.mocked(loginUser).mockResolvedValue({ status: "success" });
        renderHeader();

        await user.click(screen.getAllByRole("button", { name: "Sign in" })[0]);
        await user.type(screen.getByRole("textbox", { name: "Email" }), "user@example.com");
        await user.type(screen.getByLabelText("Password"), "StrongPass1");
        await user.click(screen.getByRole("button", { name: "Sign in" }));

        await waitFor(() => {
            expect(loginUser).toHaveBeenCalledWith({
                email: "user@example.com",
                password: "StrongPass1",
            });
        });
        await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
        expect(screen.queryByRole("heading", { name: "Sign in" })).not.toBeInTheDocument();
    });

    it("keeps the sign-in modal open and does not refresh after an auth error", async () => {
        const user = userEvent.setup();
        vi.mocked(loginUser).mockResolvedValue({
            status: "error",
            formError: "Invalid credentials",
        });
        renderHeader();

        await user.click(screen.getAllByRole("button", { name: "Sign in" })[0]);
        await user.type(screen.getByRole("textbox", { name: "Email" }), "user@example.com");
        await user.type(screen.getByLabelText("Password"), "StrongPass1");
        await user.click(screen.getByRole("button", { name: "Sign in" }));

        await waitFor(() => expect(loginUser).toHaveBeenCalledTimes(1));
        expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
        expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials");
        expect(refresh).not.toHaveBeenCalled();
    });

    it("shows the authenticated user's name or email and refreshes after sign-out", async () => {
        const user = userEvent.setup();
        renderHeader({
            expires: "2099-01-01T00:00:00.000Z",
            user: { email: "user@example.com", name: null },
        });

        expect(screen.getByLabelText("Signed-in user")).toHaveTextContent("user@example.com");
        expect(screen.queryByRole("button", { name: "Sign in" })).not.toBeInTheDocument();

        await user.click(screen.getAllByRole("button", { name: "Sign out" })[0]);

        expect(signOutUser).toHaveBeenCalledTimes(1);
        expect(refresh).toHaveBeenCalled();
    });

    it("blocks repeated sign-out while the server action is pending", async () => {
        const user = userEvent.setup();
        let resolveSignOut: (() => void) | undefined;
        vi.mocked(signOutUser).mockImplementation(
            () => new Promise<void>((resolve) => (resolveSignOut = resolve)),
        );
        renderHeader({
            expires: "2099-01-01T00:00:00.000Z",
            user: { email: "user@example.com", name: null },
        });

        const signOutButton = screen.getAllByRole("button", { name: "Sign out" })[0];
        await user.click(signOutButton);
        await user.click(signOutButton);

        expect(signOutUser).toHaveBeenCalledTimes(1);
        expect(signOutButton).toBeDisabled();
        resolveSignOut?.();
    });

    it("switches between English and Russian labels from the language dropdown", async () => {
        const user = userEvent.setup();
        renderHeader();

        await user.click(screen.getByRole("button", { name: "Language: English" }));
        await user.click(screen.getByRole("menuitemradio", { name: /Russian/ }));

        expect(document.cookie).toContain("cooking-book-locale=ru");
        expect(refresh).toHaveBeenCalled();
    });
});

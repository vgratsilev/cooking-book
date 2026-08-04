import type { Session } from "next-auth";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AuthStoreProvider, useAuthStore } from "./AuthStoreProvider";
import { selectIsAuthenticated } from "./auth.store";

const session: Session = {
    expires: "2099-01-01T00:00:00.000Z",
    user: { email: "user@example.com", name: "User", image: null },
};

const AuthStateProbe = ({ testId = "auth-state" }: { testId?: string }) => {
    const status = useAuthStore((state) => state.status);
    const isAuthenticated = useAuthStore(selectIsAuthenticated);

    return (
        <output data-testid={testId}>
            {status}:{String(isAuthenticated)}
        </output>
    );
};

const AuthTransitionProbe = () => {
    const phase = useAuthStore((state) => state.transition.phase);
    const startRefreshing = useAuthStore((state) => state.startRefreshing);

    return (
        <button type="button" onClick={() => startRefreshing("registration")}>
            {phase}
        </button>
    );
};

const renderProvider = (
    initialSession: Session | null,
    children: ReactNode = <AuthStateProbe />,
) => render(<AuthStoreProvider initialSession={initialSession}>{children}</AuthStoreProvider>);

describe("AuthStoreProvider", () => {
    it("provides an initialized store to client descendants", () => {
        renderProvider(session);

        expect(screen.getByTestId("auth-state")).toHaveTextContent("authenticated:true");
    });

    it("keeps each provider tree isolated", () => {
        render(
            <>
                <AuthStoreProvider initialSession={null}>
                    <AuthStateProbe testId="guest-state" />
                </AuthStoreProvider>
                <AuthStoreProvider initialSession={session}>
                    <AuthStateProbe testId="authenticated-state" />
                </AuthStoreProvider>
            </>,
        );

        expect(screen.getByTestId("guest-state")).toHaveTextContent("unauthenticated:false");
        expect(screen.getByTestId("authenticated-state")).toHaveTextContent(
            "authenticated:true",
        );
    });

    it("reconciles a changed server snapshot without remounting the provider", async () => {
        const view = renderProvider(null);

        view.rerender(
            <AuthStoreProvider initialSession={session}>
                <AuthStateProbe />
            </AuthStoreProvider>,
        );

        expect(await screen.findByTestId("auth-state")).toHaveTextContent("authenticated:true");
    });

    it("reconciles an authenticated snapshot to the guest state", async () => {
        const view = renderProvider(session);

        view.rerender(
            <AuthStoreProvider initialSession={null}>
                <AuthStateProbe />
            </AuthStoreProvider>,
        );

        expect(await screen.findByTestId("auth-state")).toHaveTextContent(
            "unauthenticated:false",
        );
    });

    it("keeps a transition when refresh returns the same auth identity", async () => {
        const user = userEvent.setup();
        const view = renderProvider(session, <AuthTransitionProbe />);
        const transition = screen.getByRole("button");

        await user.click(transition);
        expect(transition).toHaveTextContent("refreshing");

        const refreshedSession: Session = {
            expires: "2100-01-01T00:00:00.000Z",
            user: { email: session.user?.email, name: "Updated User", image: "/updated.png" },
        };

        view.rerender(
            <AuthStoreProvider initialSession={refreshedSession}>
                <AuthTransitionProbe />
            </AuthStoreProvider>,
        );

        expect(transition).toHaveTextContent("refreshing");
    });

    it("throws a clear error when the hook is used outside the provider", () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

        try {
            expect(() => render(<AuthStateProbe />)).toThrow(
                "useAuthStore must be used within AuthStoreProvider",
            );
        } finally {
            consoleError.mockRestore();
        }
    });
});

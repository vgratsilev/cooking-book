import type { Session } from "next-auth";
import { describe, expect, it } from "vitest";
import { createAuthStore, selectIsAuthenticated, type AuthStoreState } from "./auth.store";

const session: Session = {
    expires: "2099-01-01T00:00:00.000Z",
    user: { email: "user@example.com", name: "User", image: null },
};

const expectConsistentAuthState = (state: AuthStoreState) => {
    expect(state.status).toBe(state.session ? "authenticated" : "unauthenticated");
    expect(selectIsAuthenticated(state)).toBe(state.status === "authenticated");
};

describe("createAuthStore", () => {
    it("initializes guest and authenticated snapshots consistently", () => {
        const guestStore = createAuthStore(null);
        const authenticatedStore = createAuthStore(session);

        expect(guestStore.getState().session).toBeNull();
        expect(guestStore.getState().status).toBe("unauthenticated");
        expectConsistentAuthState(guestStore.getState());

        expect(authenticatedStore.getState().session).toEqual(session);
        expect(authenticatedStore.getState().status).toBe("authenticated");
        expectConsistentAuthState(authenticatedStore.getState());
    });

    it("creates independent store instances", () => {
        const guestStore = createAuthStore(null);
        const authenticatedStore = createAuthStore(session);

        guestStore.getState().reconcileSession(session);

        expect(guestStore.getState().session).toEqual(session);
        expect(authenticatedStore.getState().session).toEqual(session);

        authenticatedStore.getState().reconcileSession(null);

        expect(guestStore.getState().status).toBe("authenticated");
        expect(authenticatedStore.getState().status).toBe("unauthenticated");
        expectConsistentAuthState(guestStore.getState());
        expectConsistentAuthState(authenticatedStore.getState());
    });

    it("atomically claims one shared sign-out lock", () => {
        const store = createAuthStore(session);
        const { acquireSignOutLock } = store.getState();

        expect(acquireSignOutLock()).toBe(true);
        expect(acquireSignOutLock()).toBe(false);
        expect(store.getState().transition).toEqual({
            phase: "mutation",
            operation: "signOut",
        });
        expectConsistentAuthState(store.getState());
    });

    it("allows valid transitions and keeps the confirmed snapshot during refresh", () => {
        const store = createAuthStore(null);

        expect(store.getState().startRefreshing("signIn")).toBe(true);
        expect(store.getState().transition).toEqual({
            phase: "refreshing",
            operation: "signIn",
        });
        expect(store.getState().session).toBeNull();

        expect(store.getState().startRefreshing("registration")).toBe(false);
        store.getState().completeRefreshing();
        expect(store.getState().transition).toEqual({ phase: "idle" });
        expect(store.getState().session).toBeNull();

        store.getState().reconcileSession(session);
        expect(store.getState().acquireSignOutLock()).toBe(true);
        expect(store.getState().startRefreshing("signOut")).toBe(true);
        expect(store.getState().transition).toEqual({
            phase: "refreshing",
            operation: "signOut",
        });
    });

    it("cancels failed transitions without changing session state", () => {
        const store = createAuthStore(session);

        expect(store.getState().acquireSignOutLock()).toBe(true);
        store.getState().cancelTransition();

        expect(store.getState().transition).toEqual({ phase: "idle" });
        expect(store.getState().session).toEqual(session);
        expectConsistentAuthState(store.getState());

        expect(store.getState().startRefreshing("signIn")).toBe(true);
        store.getState().cancelTransition();
        expect(store.getState().transition).toEqual({ phase: "idle" });
        expect(store.getState().session).toEqual(session);
    });

    it("reconciles server snapshots by auth identity, not by session metadata", () => {
        const store = createAuthStore(null);

        expect(store.getState().startRefreshing("signIn")).toBe(true);
        store.getState().reconcileSession({ ...session, user: { ...session.user } });

        expect(store.getState().session).toEqual(session);
        expect(store.getState().status).toBe("authenticated");
        expect(store.getState().transition).toEqual({ phase: "idle" });

        expect(store.getState().startRefreshing("signOut")).toBe(false);
        expect(store.getState().startRefreshing("registration")).toBe(true);
        const refreshedSession: Session = {
            expires: "2100-01-01T00:00:00.000Z",
            user: { email: session.user?.email, name: "Updated User", image: "/updated.png" },
        };
        store.getState().reconcileSession(refreshedSession);

        expect(store.getState().session).toEqual(refreshedSession);
        expect(store.getState().transition).toEqual({
            phase: "refreshing",
            operation: "registration",
        });
        store.getState().completeRefreshing();
        expectConsistentAuthState(store.getState());
    });
});

import type { Session } from "next-auth";
import { createStore, type StoreApi } from "zustand/vanilla";

export type AuthStatus = "authenticated" | "unauthenticated";
export type AuthOperation = "signIn" | "registration" | "signOut";

export type AuthTransition =
    | { phase: "idle" }
    | { operation: "signOut"; phase: "mutation" }
    | { operation: AuthOperation; phase: "refreshing" };

export interface AuthStoreState {
    session: Session | null;
    status: AuthStatus;
    transition: AuthTransition;
    acquireSignOutLock: () => boolean;
    startRefreshing: (operation: AuthOperation) => boolean;
    cancelTransition: () => void;
    reconcileSession: (session: Session | null) => void;
    completeRefreshing: () => void;
}

export type AuthStore = StoreApi<AuthStoreState>;

export const selectIsAuthenticated = (state: AuthStoreState) => state.status === "authenticated";

const getStatus = (session: Session | null): AuthStatus =>
    session ? "authenticated" : "unauthenticated";

const getAuthIdentity = (session: Session | null) =>
    session === null
        ? { kind: "guest" as const }
        : { kind: "user" as const, key: session.user?.id ?? session.user?.email ?? null };

const hasSameAuthIdentity = (currentSession: Session | null, serverSession: Session | null) => {
    const currentIdentity = getAuthIdentity(currentSession);
    const serverIdentity = getAuthIdentity(serverSession);

    return (
        currentIdentity.kind === serverIdentity.kind &&
        (currentIdentity.kind === "guest" || currentIdentity.key === serverIdentity.key)
    );
};

export const createAuthStore = (initialSession: Session | null): AuthStore =>
    createStore<AuthStoreState>((set) => ({
        session: initialSession,
        status: getStatus(initialSession),
        transition: { phase: "idle" },

        acquireSignOutLock: () => {
            let acquired = false;

            set((state) => {
                if (state.session === null || state.transition.phase !== "idle") {
                    return state;
                }

                acquired = true;
                return {
                    transition: { phase: "mutation", operation: "signOut" },
                };
            });

            return acquired;
        },

        startRefreshing: (operation) => {
            let started = false;

            set((state) => {
                const canStart =
                    operation === "signOut"
                        ? state.transition.phase === "mutation" &&
                          state.transition.operation === "signOut"
                        : state.transition.phase === "idle";

                if (!canStart) {
                    return state;
                }

                started = true;
                return {
                    transition: { phase: "refreshing", operation },
                };
            });

            return started;
        },

        cancelTransition: () => {
            set((state) =>
                state.transition.phase === "idle" ? state : { transition: { phase: "idle" } },
            );
        },

        reconcileSession: (session) => {
            set((state) => {
                const sameAuthIdentity = hasSameAuthIdentity(state.session, session);

                return {
                    session,
                    status: getStatus(session),
                    transition: sameAuthIdentity ? state.transition : { phase: "idle" },
                };
            });
        },

        completeRefreshing: () => {
            set((state) =>
                state.transition.phase === "refreshing" ? { transition: { phase: "idle" } } : state,
            );
        },
    }));

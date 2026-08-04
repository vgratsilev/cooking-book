"use client";

import type { Session } from "next-auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { createAuthStore, type AuthStore, type AuthStoreState } from "./auth.store";

const AuthStoreContext = createContext<AuthStore | null>(null);

interface AuthStoreProviderProps {
    children: ReactNode;
    initialSession: Session | null;
}

export const AuthStoreProvider = ({ children, initialSession }: AuthStoreProviderProps) => {
    const [store] = useState<AuthStore>(() => createAuthStore(initialSession));

    useEffect(() => {
        store.getState().reconcileSession(initialSession);
    }, [initialSession, store]);

    return <AuthStoreContext.Provider value={store}>{children}</AuthStoreContext.Provider>;
};

export const useAuthStore = <T,>(selector: (state: AuthStoreState) => T): T => {
    const store = useContext(AuthStoreContext);

    if (store === null) {
        throw new Error("useAuthStore must be used within AuthStoreProvider");
    }

    return useStore(store, selector);
};

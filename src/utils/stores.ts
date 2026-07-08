import type { Session } from "@supabase/supabase-js";
import { create } from "zustand"

type ModelStore = {
    model: Leaf[],
    setModel: (model: Leaf[]) => void
}

export const modelStore = create<ModelStore>((set) => ({
    model: [
        { "text": "\u2060\u2060" },
        { "text": "aaaa" },
        { "text": "bbbb" },
        { "text": "cccccccc", styles: { bold: true, italic: true } },
        { "text": "dddd", styles: { italic: true } },
        { "text": "eeee" }
    ],
    setModel: (model) => set({ model })
}))

type AuthStore = {
    session: Session | null,
    setSession: (session: Session | null) => void,
    isLoggedIn: boolean,
};

export const authStore = create<AuthStore>((set) => ({
    session: null,
    isLoggedIn: false,
    setSession: (session) =>
        set({
            session,
            isLoggedIn: !!session,
        }),
}))
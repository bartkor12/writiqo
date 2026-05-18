import { Routes, Route } from "react-router";
import Editor from "./pages/Editor";
import Login from "./pages/Login";
import Saves from "./pages/Saves";
import { useEffect } from "react";
import { supabase } from "./supabase";
import { authStore } from "./utils/stores";

export default function App() {

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                authStore.getState().setSession(session)
            }
        })
    }, [])

    return (
        <Routes>
            <Route path="/" element={<Editor />} />
            <Route path="/login" element={<Login />} />
            <Route path="/saves" element={<Saves/>}/>
        </Routes >
    )
}
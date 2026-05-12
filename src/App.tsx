import { Routes, Route } from "react-router";
import Editor from "./pages/Editor";
import Login from "./pages/Login";
import Saves from "./pages/Saves";

export default function App() {

    return (
        <Routes>
            <Route path="/" element={<Editor />} />
            <Route path="/login" element={<Login />} />
            <Route path="/saves" element={<Saves/>}/>
        </Routes >
    )
}
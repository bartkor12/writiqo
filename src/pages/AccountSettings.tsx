import { useNavigate } from "react-router";
import { supabase } from "../supabase";
import { authStore } from "../utils/stores";
import { useRef, useState } from "react";

export default function AccountSettings() {
    const email = authStore(s => s.session)?.user?.email ?? "default"
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

    function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        setMousePos({ x: e.clientX, y: e.clientY })
    }

    return (
        <div className="centerLoginDiv" onMouseMove={onMouseMove} style={{
            backgroundImage: `radial-gradient(circle farthest-side at ${mousePos.x}px ${mousePos.y}px, var(--body) 0%, transparent 100%)`
        }}>
            <div className="accountSettings">
                <div className="personalData">
                    <span style={{ fontSize: 40, fontFamily: "Inter Tight" }}>Account Settings</span>
                    <div className="settingsInputs">
                        <TextInput name="Email" type="email" />
                        <TextInput name="Password" type="password" />
                        <TextInput name="Username" type="text" />
                        <ImportantButton type="logout" />
                        <ImportantButton type="delete" />
                        <ImportantButton type="save and return" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function TextInput({ name, type }: { name: string, type: string }) {

    return (
        <div className="settingsTextInput">
            <span>{name}</span>
            <input type={type} />
        </div>
    )
}

function ImportantButton({ type }: { type: string }) {
    const [text, setText] = useState(type[0].toUpperCase() + type.slice(1))
    const clicked = useRef<boolean>(false)
    const timeoutId = useRef<number>(0)
    const navigate = useNavigate()

    async function onClick() {
        if (clicked.current) {
            if (type == "logout") {
                await supabase.auth.signOut()
                setText("Logged out")
                navigate("/")
            }
            else if (type == "delete") {
                setText("Account deleted")
                // ! IMPORTANT add GDPR compliance with delete account feature, possibly use edge functions
            }
            else {
                setText("Saved")
                navigate("/")
            }
            clearTimeout(timeoutId.current)
        }
        else {
            clicked.current = true
            setText("Are you sure?")
            timeoutId.current = setTimeout(() => {
                setText(type[0].toUpperCase() + type.slice(1))
                clicked.current = false
            }, 3000)
        }
    }

    return (
        <button className="logoutButton" onClick={onClick}>
            <img src={type + ".svg"} alt="" />
            {text}
        </button>
    )
}
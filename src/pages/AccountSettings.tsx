import { useNavigate } from "react-router";
import { supabase } from "../supabase";
import { authStore } from "../utils/stores";
import { useRef, useState } from "react";

export default function AccountSettings() {
    const email = authStore(s => s.session)?.user?.email ?? "default"
    const username = authStore(s => s.session)?.user.user_metadata.display_name
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
                        <TextInput name="Email" type="email" placeholder={email ?? "Email"} />
                        <TextInput name="Password" type="password" />
                        <TextInput name="Username" type="text" placeholder={username ?? "Username"} />
                        <ImportantButton type="logout" />
                        <ImportantButton type="delete" />
                        <ImportantButton type="save and return" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function TextInput({ name, type, placeholder }: { name: string, type: string, placeholder?: string }) {

    return (
        <div className="settingsTextInput">
            <span>{name}</span>
            <input type={type} placeholder={placeholder ?? name} id={name} />
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
                window.location.reload()
            }
            else if (type == "delete") {
                const { error } = await supabase.functions.invoke("delete-account")

                if (error) {
                    console.error(error);
                } else {
                    await supabase.auth.signOut();
                }
                setText("Account deleted")
                navigate("/")
                window.location.reload()
            }
            else {
                const email = (document.getElementById("Email") as HTMLInputElement)?.value
                const password = (document.getElementById("Password") as HTMLInputElement)?.value
                const username = (document.getElementById("Username") as HTMLInputElement)?.value

                if (password != "" && password.length < 10) {
                    setText("Password must be at least 10 characters long")
                    return
                }
                if (email != "" && !email.includes("@")) {
                    setText("Invalid email")
                    return
                }

                setText("Saved")
                supabase.auth.updateUser({
                    ...(email != "" && { email : email }),
                    ...((password != "" && password.length > 10) && { password : password }),
                    ...(username != "" && {
                        data: {
                            display_name: username
                        }
                    }),

                })

                navigate("/")
                window.location.reload()
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
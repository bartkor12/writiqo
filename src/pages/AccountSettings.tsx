import Avatar from "react-avatar";
import { authStore } from "../utils/stores";
import { useState } from "react";

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

                    <div>
                        <Avatar name={email} className="bigavatarpfp" size="200" />
                    </div>
                    <div className="settingsInputs">
                        <div>
                            <TextInput name="Email" type="email" />
                            <TextInput name="Password" type="password" />
                        </div>
                        <div>
                            <TextInput name="Username" type="text" />
                            <button className="logoutButton">
                                <img src="logout.svg" alt="" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function TextInput({ name, type }: { name: string, type : string }) {

    return (
        <div className="settingsTextInput">
            <span>{name}</span>
            <input type={type} />
        </div>
    )
}
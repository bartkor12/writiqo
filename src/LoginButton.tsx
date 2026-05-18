import { useNavigate } from "react-router"
import Avatar from "react-avatar"
import { authStore } from "./utils/stores"

export default function LoginButton() {
    const navigate = useNavigate()
    const loggedIn = authStore(s => s.isLoggedIn)
    const email = authStore(s => s.session)?.user?.email ?? "default"

    function onClick() {
        if (!loggedIn) navigate("/login")
    }

    return (
        <div id="login" onClick={onClick}>
            <span>{loggedIn ? email.split("@")[0] : "Account name"}</span>
            {loggedIn ?
                <Avatar name={email} className="avatarpfp" size="50"/> :
                <img src="account_placeholder.svg" className="pfp" alt="" />
            }
        </div>
    )
}
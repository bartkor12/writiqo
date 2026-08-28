import { useNavigate } from "react-router"
import Avatar from "react-avatar"
import { authStore } from "./utils/stores"

export default function LoginButton() {
    const navigate = useNavigate()
    const loggedIn = authStore(s => s.isLoggedIn)
    const email = authStore(s => s.session)?.user?.email ?? "default"
    const username = authStore(s => s.session)?.user.user_metadata.display_name

    function onClick() {
        if (!loggedIn) {
            navigate("/login")
        } else {
            navigate("/settings")
        }
    }

    return (
        <div id="login" onClick={onClick}>
            <span>{loggedIn ? (username ?? email.split("@")[0]) : "Account name"}</span>
            {loggedIn ?
                <Avatar name={username ?? email} className="avatarpfp" size="50"/> :
                <img src="account_placeholder.svg" className="pfp" alt="" />
            }
        </div>
    )
}
import { useNavigate } from "react-router"
import Avatar from "react-avatar"
import { supabase } from "./supabase"
import { useEffect, useState } from "react"

export default function LoginButton() {
    const navigate = useNavigate()
    const [loggedIn, setLoggedIn] = useState(false)
    const [email,setEmail] = useState("default")

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setLoggedIn(true)
                setEmail(session.user.email ?? "default")
            }
        })
    }, [])

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
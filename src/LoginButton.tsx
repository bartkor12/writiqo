import { useNavigate } from "react-router"
import Avatar from "react-avatar"
import { supabase } from "./supabase"
import { useEffect } from "react"

export default function LoginButton() {
    const navigate = useNavigate()

    useEffect(() => {
        supabase.auth.getSession().then(({data : {session}}) => {
            console.log(session)
        })
    })

    function onClick() {
        navigate("/login")
    }

    return (
        <div id="login" onClick={onClick}>
            <span>Account name</span>
            <Avatar name="hello" />
            <img src="account_placeholder.svg" alt="" />
        </div>
    )
}
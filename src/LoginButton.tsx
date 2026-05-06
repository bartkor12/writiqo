import { useNavigate } from "react-router"

export default function LoginButton() {
    const navigate = useNavigate()

    function onClick() {
        navigate("/login")
    }

    return (
        <div id="login" onClick={onClick}>
            <span>Account name</span>
            <img src="account_placeholder.svg" alt="" />
        </div>
    )
}
import type React from "react"
import { useState } from "react"
import { supabase } from "../supabase"
import Swal from "sweetalert2"
import { useNavigate } from "react-router"

export default function Login() {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const [isLoginMode, setIsLoginMode] = useState(true)
    const navigate = useNavigate()

    function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        setMousePos({ x: e.clientX, y: e.clientY })
    }

    function switchLoginMode() {
        setIsLoginMode(!isLoginMode)
    }

    async function formSubmit(e: React.SubmitEvent) {
        e.preventDefault()

        const formData = new FormData(e.target as HTMLFormElement)
        const email = formData.get("email")?.toString()
        const password = formData.get("password")?.toString()

        if (!email || !password) return

        const { error } = isLoginMode ? 
        await supabase.auth.signInWithPassword({
            email,
            password
        })
        : await supabase.auth.signUp({
            email,
            password,
        })

        console.log(error)

        if (error) {
            Swal.fire({
                title: "Try again.",
                icon: "error",
                text: error.message,
                iconColor: "#a5b4fc"
            })
            return
        }
        console.log("hia")

        navigate("/")
    }

    return (

        <div className="centerLoginDiv" onMouseMove={onMouseMove} style={{
            backgroundImage: `radial-gradient(circle farthest-side at ${mousePos.x}px ${mousePos.y}px, var(--body) 0%, transparent 100%)`
        }}>
            <div className="formDiv">
                <span className="loginTitle">Welcome to Writiqo!</span>
                <span className="loginTitleSubtext">{isLoginMode ? "Log in" : "Sign up"} to enjoy the best features</span>
                <form onSubmit={formSubmit}>
                    <div className="formInputDiv">
                        <label htmlFor="email">Email</label>
                        <input type="email" id="email" name="email" placeholder="Enter your email address" />
                    </div>
                    <div className="formInputDiv">
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" name="password" placeholder="Enter your password" />
                    </div>
                    <button type="submit" className="submitLoginButton"><span>{isLoginMode ? "Log in" : "Sign up"}</span></button>
                </form>
                <hr />
                <OauthButton provider="Google" />
                <OauthButton provider="Microsoft" />
                <OauthButton provider="Github" />
                <OauthButton provider="Gitlab" />
                <OauthButton provider="Discord" />
                <button onClick={switchLoginMode} className="signUpButton">{isLoginMode ? "Don't have an account? Sign up" : "Already have an account? Log in"}</button>
            </div>
        </div>
    )
}

function OauthButton({ provider }: { provider: string }) {

    return (
        <div className="oauth">
            <img src={provider.toLowerCase() + ".svg"} alt="" />
            <span>Continue with {provider} </span>
        </div>
    )
}
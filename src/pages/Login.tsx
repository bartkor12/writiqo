import type React from "react"
import { useState } from "react"

export default function Login() {
    const [mousePos,setMousePos] = useState({x : 0, y : 0})
    const [isLoginMode, setIsLoginMode] = useState(true)

    function onMouseMove(e : React.MouseEvent<HTMLDivElement>) {
        setMousePos({x : e.clientX, y : e.clientY})
    }

    function switchLoginMode() {
        setIsLoginMode(!isLoginMode)
    }

    function formSubmit(e : React.FormEvent) {
        e.preventDefault()
        
        const formData = new FormData(e.target as HTMLFormElement)
        const email = formData.get("email")
        const password = formData.get("password")

        console.log(email,password)
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

function OauthButton({provider} : {provider : string}) {
    
    return (
        <div className="oauth">
            <img src={provider.toLowerCase() + ".svg"} alt="" />
            <span>Continue with {provider} </span>
        </div>
    )
}
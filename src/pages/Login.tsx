import type React from "react"
import { useState } from "react"

export default function Login() {
    const [mousePos,setMousePos] = useState({x : 0, y : 0})

    function onMouseMove(e : React.MouseEvent<HTMLDivElement>) {
        setMousePos({x : e.clientX, y : e.clientY})
        console.log("ayo")
    }

    return (

        <div className="centerLoginDiv" onMouseMove={onMouseMove} style={{
            backgroundImage: `radial-gradient(circle farthest-side at ${mousePos.x}px ${mousePos.y}px, var(--body) 0%, transparent 100%)`
        }}>
            {/* <div style={{top: mousePos.y - 25,left : mousePos.x - 25}} className="fancyCursor">

            </div> */}
            <div className="formDiv">
                <span className="loginTitle">Welcome to Writiqo!</span>
                <span className="loginTitleSubtext">Login to enjoy the best features</span>
                <form action="" className="">
                    <div className="formInputDiv">
                        <label htmlFor="email">Email</label>
                        <input type="email" id="email" placeholder="Enter your email address" />
                    </div>
                    <div className="formInputDiv">
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" placeholder="Enter your password" />
                    </div>
                    <button type="submit">Log in</button>
                </form>
                <hr />
                <OauthButton provider="Google" />
                <OauthButton provider="Microsoft" />
                <OauthButton provider="Github" />
                <OauthButton provider="Gitlab" />
                <OauthButton provider="Discord" />
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
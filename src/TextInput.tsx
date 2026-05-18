import { useRef } from "react"
import Paragraph from "./Paragraph"

export default function TextInput() {
    const thisDivTextArea = useRef<HTMLDivElement>(null)

    return (
        <div id="textInputDiv">
            <div className="textInputWrapper" ref={thisDivTextArea}>
                <Paragraph key={"paragraph"} />
            </div>
        </div>
    )
}
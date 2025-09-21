import { useState } from "react"
import Sidebar from './Sidebar.tsx'
import TextInput from './TextInput.tsx'
import Ribbon from './Ribbon.tsx'

export default function Editor() {
    const [model, setModel] = useState<Leaf[]>([{ "text": "aaaa" }, { "text": "bbbb" }, { "text": "cccccccc", styles: { bold: true, italic: true } }, { "text": "dddd", styles: { italic: true } }, { "text": "eeee" }])

    document.addEventListener("keydown", (e) => {
        if (e.ctrlKey && (e.key==="b" || e.key==="u" || e.key==="i")) {
            e.preventDefault()
        }
    }) 

    return (
        <>
            <Ribbon model={model} setModel={setModel} />
            <Sidebar model={model} setModel={setModel} />
            <TextInput model={model} setModel={setModel} />
        </>
    )
}
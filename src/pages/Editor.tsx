import { useState } from "react"
import Sidebar from '../Sidebar.tsx'
import TextInput from '../TextInput.tsx'
import Ribbon from '../Ribbon.tsx'

export function delay(delay: number) {
  return new Promise(res => setTimeout(res, delay));
}

export function filterEmptyLeaf(array: Leaf[]) {
  return array.filter(item => item.text !== "" || item.styles?.image)
}

export default function Editor() {
    const [model, setModel] = useState<Leaf[]>([{ "text": "aaaa" }, { "text": "bbbb" }, { "text": "cccccccc", styles: { bold: true, italic: true } }, { "text": "dddd", styles: { italic: true } }, { "text": "eeee" }])

    document.addEventListener("keydown", (e) => {
        if (e.ctrlKey && (e.key==="b" || e.key==="u" || e.key==="i" || e.key==="o")) {
            e.preventDefault()
        }
    }) 

    return (
        <>
            <Ribbon model={model} setModel={setModel} />
            <Sidebar/>
            <TextInput model={model} setModel={setModel} />
        </>
    )
}
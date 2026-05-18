import Sidebar from '../Sidebar.tsx'
import TextInput from '../TextInput.tsx'
import Ribbon from '../Ribbon.tsx'

export default function Editor() {
    document.addEventListener("keydown", (e) => {
        if (e.ctrlKey && (e.key==="b" || e.key==="u" || e.key==="i" || e.key==="o")) {
            e.preventDefault()
        }
    }) 

    return (
        <>
            <Ribbon />
            <Sidebar/>
            <TextInput />
        </>
    )
}
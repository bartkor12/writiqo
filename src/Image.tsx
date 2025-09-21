import { useRef } from "react"
import { setBlockRect } from "./main"

export default function Image(props: any) {
    let dragging = false
    const thisImage = useRef<HTMLImageElement>(null)

    function mousedown() {
        dragging = true
    }

    function mouseup() {
        dragging = false
        const rect = thisImage.current?.getBoundingClientRect()!

        setBlockRect(props,rect)
    }

    function mousemove(e: React.MouseEvent) {
        if (!thisImage.current) return
        if (dragging == true) {
            const newX = e.clientX - thisImage.current.width / 2
            const newY = e.clientY - thisImage.current.height / 2
            thisImage.current.style.left = `${newX}px`
            thisImage.current.style.top = `${newY}px`
        }
    }



    return (
        <img ref={thisImage} className="image" src={props.src} alt="" onMouseDown={mousedown} onMouseUp={mouseup} onMouseMove={mousemove} />
    )
}
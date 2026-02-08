import React, { useEffect, useRef, useState } from "react"
import { globalData } from "./main"
import Image from "./Image"
import { v4 as uuid4 } from "uuid"
import Paragraph from "./Paragraph"

interface EditorComponentProps {
    model: Leaf[],
    setModel: React.Dispatch<React.SetStateAction<Leaf[]>>,
}

export default function TextInput({model, setModel} : EditorComponentProps) {
    const thisDivTextArea = useRef<HTMLDivElement>(null)
    const canvas = useRef<HTMLCanvasElement>(null)
    const context = useRef<CanvasRenderingContext2D>(null)
    const [content, setContent] = useState<Array<Block>>([{ id: uuid4(), type: "Paragraph" }])
    let strokes: Array<Array<{ x: number, y: number }>> = [];
    let drawing = false

    useEffect(() => {
        if (canvas.current) {
            context.current = canvas.current?.getContext("2d")
            canvas.current.width = window.innerWidth;
            canvas.current.height = window.innerHeight;

            context.current!.strokeStyle = "black"
            context.current!.lineWidth = 10
            context.current!.lineCap = "round"
            context.current!.lineJoin = "round"
        }
    }, [])

    setInterval(() => {
        thisDivTextArea.current?.parentElement?.style.setProperty("user-select", globalData.activeTool != "type" ? "none" : "text")
        thisDivTextArea.current?.style.setProperty("z-index", globalData.activeTool != "type" ? "0" : "2")
        canvas.current?.style.setProperty("z-index", globalData.activeTool != "type" ? "2" : "0")

    }, 100);

    function canvasMousedown(e: React.MouseEvent) {
        if (!context.current) return
        if (e.button != 0) return
        context.current.beginPath()
        context.current.moveTo(e.clientX - canvas.current?.offsetLeft!, e.clientY - canvas.current?.offsetTop!)
        drawing = true
        strokes.push([])
        strokes[strokes.length - 1].push({ x: e.clientX, y: e.clientY })
    }

    function canvasMouseup(e: React.MouseEvent) {
        if (!context.current) return
        if (e.button != 0) return
        context.current.stroke()
        context.current.closePath()
        drawing = false
        strokes[strokes.length - 1].push({ x: e.clientX, y: e.clientY })
    }

    function canvasMousemove(e: React.MouseEvent) {
        if (!context.current || drawing == false) return
        context.current.lineTo(e.clientX - canvas.current?.offsetLeft!, e.clientY - canvas.current?.offsetTop!)
        context.current.stroke()
        strokes[strokes.length - 1].push({ x: e.clientX, y: e.clientY })
    }

    function undo() {
        if (!context.current) return

        strokes.pop()

        console.log(strokes)

        context.current.clearRect(0, 0, window.innerWidth, window.innerHeight)

        for (const strokeArray of strokes) {
            context.current.beginPath()
            context.current.moveTo(strokeArray[0].x, strokeArray[0].y)

            for (let i = 1; i < strokeArray.length; i++) {
                const stroke = strokeArray[i];

                context.current.lineTo(stroke.x, stroke.y)
                context.current.stroke()
            }
            context.current.stroke()
            context.current.closePath()
        }
    }

    document.addEventListener("keydown", e => {
        if (e.ctrlKey && e.key == "z") {
            undo()
        }
    })

    document.onpaste = event => {
        const items = event.clipboardData?.items;
        for (const index in items) {
            const item = items[Number(index)];
            if (item?.kind === 'file') {
                const blob = item.getAsFile();
                const reader = new FileReader();
                reader.onload = function (event) {
                    console.log("paste")
                    setContent(prev => [...prev, { id: uuid4(), type: "Image", src: event.target?.result as string }])
                }; // data url!
                reader.readAsDataURL(blob!);
            }
        }
    }

    return (
        <div id="textInputDiv">
            <canvas id="drawing" ref={canvas} onMouseDown={canvasMousedown} onMouseMove={canvasMousemove} onMouseUp={canvasMouseup} />
            <div className="textInputWrapper" ref={thisDivTextArea}></div>
            {content.map(block => {
                switch (block.type) {
                    case "Paragraph":
                        return <Paragraph model={model} setModel={setModel} key={block.id} />
                    case "Image":
                        return <Image key={block.id} id={block.id} src={block.src} content={content} setContent={setContent} />
                }
            })}
        </div>
    )
}
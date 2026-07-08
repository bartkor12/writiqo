import React, { useCallback, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react"
import { position as CaretPosition } from "caret-pos"
import Format from "./Format"
import { modelStore } from "./utils/stores"
import { normalizeModel } from "./utils/general"

export default function Paragraph() {
    const model = modelStore(s => s.model)
    const setModel = modelStore(s => s.setModel)
    const thisTextArea = useRef<HTMLDivElement>(null)
    const caretPosition = useRef<number>(0)
    const undoModel = useRef<Array<Leaf[]>>([])
    const lastTyped = useRef<number>(0)
    const undoIndex = useRef<number>(0)
    const undoCaretPositions = useRef<number[]>([])
    const maxUndo = 20

    function getLeafIndexFromCaretPosition(caretPosition: number, getOffset: boolean = false) {

        let stringLength = 1

        for (let index = 0; index < model.length; index++) {
            const leaf = model[index];

            if (getOffset && stringLength + leaf.text.length > caretPosition) {
                return index == 0 ? 0 : caretPosition - stringLength + 1
            }

            stringLength += leaf.text.length

            if (stringLength > caretPosition) {
                return index == 0 ? 1 : index
            }
        };

        return model.length - 1
    }

    function updateDomModel(e: React.InputEvent) {
        e.preventDefault()

        caretPosition.current = CaretPosition(thisTextArea.current!).pos

        const input = e.data
        const caretOffset = getLeafIndexFromCaretPosition(caretPosition.current, true)
        const leafIndex: number = getLeafIndexFromCaretPosition(caretPosition.current)

        const text = model[leafIndex].text

        const newText = text.slice(0, caretOffset) + input + text.slice(caretOffset, text.length)
        const newModel: Leaf[] = makeNewModel()
        newModel[leafIndex].text = newText
        setModel(newModel)
    }

    function makeNewModel() {
        return model.map(leaf => ({
            ...leaf,
            styles: { ...leaf.styles }
        }))
    }

    function formatSelection(e: React.KeyboardEvent) {
        const selectionLength = window.getSelection()!.toString().length
        let style: "italic" | "bold" | "underline" | "overline" | "" = ""

        if (e.ctrlKey) {
            switch (e.key) {

                case "i":
                    style = "italic"
                    break

                case "b":
                    style = "bold"
                    break

                case "u":
                    style = "underline"
                    break

                case "o":
                    style = "overline"
                    break

                case "v":
                    break

                case "a":
                    break

                default:
                    e.preventDefault()
                    break
            }
        }
        else {
            if (e.key == "Wakeup") e.preventDefault()
        }

        let newModel: Leaf[] = makeNewModel()

        // format and style
        if (e.ctrlKey && style) {
            e.preventDefault()
            Format({
                style
            })

            return
        }
        else if (e.altKey || (e.shiftKey && e.key === "Shift") || e.metaKey || (e.ctrlKey && e.key === "Control")) {
            return
        }

        console.log("continuing")

        if (e.key === "Backspace" || e.key === "Delete" || e.key === "Enter" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault()
        }

        if (e.key === "ArrowLeft" && caretPosition.current > 0) {
            caretPosition.current -= 1
        }
        if (e.key === "ArrowRight" && caretPosition.current >= 0) {
            caretPosition.current += 1
        }

        let leafIndex = getLeafIndexFromCaretPosition(caretPosition.current)
        let startLeafOffset = getLeafIndexFromCaretPosition(caretPosition.current - selectionLength, true)

        if (!newModel[0] || newModel[0].text != "\u2060\u2060") {
            newModel.unshift({ text: '\u2060\u2060' })

            removeEmpty()

            caretPosition.current += 2
            console.warn("bruh")
        }

        if (newModel[newModel.length - 1].text != "\u2060\u2060") {
            newModel.splice(newModel.length, 0, { text: '\u2060\u2060' })
            removeEmpty()
            // caretPosition.current -= 2
        }

        if (newModel[leafIndex]?.text == "\u2060\u2060") {
            if (leafIndex > 0) {
                caretPosition.current -= startLeafOffset
            }
            else {
                caretPosition.current += startLeafOffset - 2 < 0 ? 0 : startLeafOffset - 2
            }
            console.warn("ayooooo")
        }

        leafIndex = getLeafIndexFromCaretPosition(caretPosition.current)
        startLeafOffset = getLeafIndexFromCaretPosition(caretPosition.current - selectionLength, true)
        const startLeafIndex = getLeafIndexFromCaretPosition(caretPosition.current - selectionLength)
        const endLeafOffset = getLeafIndexFromCaretPosition(caretPosition.current, true)

        if (e.key === "Home") {
            e.preventDefault()
            const textToStartLine = newModel.slice(0, leafIndex + 1).map(el => el.text).join("").split("\n\u200B")
            textToStartLine.pop()
            const lengthToStartLine = textToStartLine.join("").length + textToStartLine.length * 2

            const caretToStart = lengthToStartLine

            console.log(textToStartLine)

            caretPosition.current = caretToStart
        }

        // erase and delete
        caretPosition.current += newModel[startLeafIndex].text[startLeafOffset] == "\u200B" && newModel[startLeafIndex]?.text[startLeafOffset - 1] == "\n" ? 1 : 0

        if (e.ctrlKey && e.key === "c" && !window.getSelection()?.isCollapsed) {
            navigator.clipboard.writeText(window.getSelection()!.toString())
        }

        const leafIndexText = newModel[leafIndex].text

        console.log(leafIndexText)

        if (startLeafIndex < leafIndex && (!e.ctrlKey || (e.ctrlKey && e.key === "v"))) {

            newModel[startLeafIndex].text = newModel[startLeafIndex].text.slice(0, startLeafOffset)
            newModel[leafIndex].text = leafIndexText.slice(endLeafOffset, leafIndexText.length)

            if (leafIndex - startLeafIndex > 1) {
                newModel.splice(startLeafIndex + 1, leafIndex - startLeafIndex - 1);
            }
        }
        else {
            if ((e.key === "Backspace" || e.key === "Delete") && startLeafOffset == endLeafOffset) {
                if (e.ctrlKey && newModel[startLeafIndex].text != "" && leafIndexText != '\n\u200B') {
                    const firstHalf = newModel.slice(0, leafIndex + 1).flatMap(leaf => leaf.text).join("").slice(0, caretPosition.current)
                    const newLineOffset = firstHalf.split('\n\u200B').reverse().filter(item => item !== "")[0].length
                    const spaceLeafOffset = firstHalf.split(" ").reverse().filter(item => item !== "")[0].length
                    const deletionOffset = Math.min(spaceLeafOffset, newLineOffset)
                    const spacePosition = caretPosition.current - deletionOffset
                    const spaceLeafIndex = getLeafIndexFromCaretPosition(spacePosition)

                    if (spaceLeafIndex < leafIndex) {
                        // console.log("hiiii1" + newModel[spaceLeafIndex].text.slice(0, getLeafIndexFromCaretPosition(spacePosition, true)))
                        // console.log("hiiii2" + leafIndexText.slice(startLeafOffset, leafIndexText.length)
                        console.log("here")
                        newModel[spaceLeafIndex].text = newModel[spaceLeafIndex].text.slice(0, getLeafIndexFromCaretPosition(spacePosition, true))
                        newModel[leafIndex].text = leafIndexText.slice(startLeafOffset, leafIndexText.length).replace(/[\n\u200B ]/g, "")
                    }
                    else {
                        console.log("right here")
                        newModel[leafIndex].text = leafIndexText.slice(0, getLeafIndexFromCaretPosition(spacePosition, true)) + leafIndexText.slice(endLeafOffset, leafIndexText.length).replace(/[\n\u200B ]/g, "")
                    }
                    if (leafIndex - spaceLeafIndex > 1) {
                        newModel.splice(spaceLeafIndex + 1, leafIndex - spaceLeafIndex - 1);
                    }
                    caretPosition.current = spacePosition
                }
                else {
                    console.log(leafIndexText)
                    if (leafIndexText == "\n\u200B") {
                        if (getLeafIndexFromCaretPosition(caretPosition.current, true) == 1) caretPosition.current += 1
                        newModel.splice(leafIndex, 1)
                        caretPosition.current -= 1
                        console.log("right over here bucko")
                    }
                    else if (leafIndexText.slice(0, startLeafOffset) != "") {
                        newModel[leafIndex].text = leafIndexText.slice(0, startLeafOffset - 1) + leafIndexText.slice(startLeafOffset, leafIndexText.length)
                    }
                }

                removeEmpty()
                caretPosition.current -= 1
            }
            else if (e.ctrlKey && e.key.toLowerCase() === "z") {
                e.preventDefault()

                if (e.shiftKey) {
                    // redo
                    undoIndex.current = Math.max(undoIndex.current - 1, 0)
                } else {
                    if (undoIndex.current === 0) {
                        if (JSON.stringify(undoModel.current.at(-1)) !== JSON.stringify(newModel)) {
                            undoModel.current.push(makeNewModel())
                            undoCaretPositions.current.push(CaretPosition(thisTextArea.current!).pos)

                            if (undoModel.current.length > maxUndo) {
                                undoModel.current.shift()
                                undoCaretPositions.current.shift()
                            }
                        }
                    }
                    undoIndex.current = Math.min(undoIndex.current + 1, undoModel.current.length - 1)
                }

                const targetIndex = undoModel.current.length - 1 - undoIndex.current

                const targetPos = undoCaretPositions.current[targetIndex] ?? CaretPosition(thisTextArea.current!).pos

                caretPosition.current = targetPos > 0 ? targetPos - 1 : 0

                newModel = undoModel.current[targetIndex] ?? newModel

                setModel(newModel)
                return
            }
            else if (e.key === "Enter") {
                const styles = newModel[leafIndex].styles
                newModel.splice(leafIndex, 1, { text: leafIndexText.slice(0, startLeafOffset), styles })
                newModel.splice(leafIndex + 1, 0, { text: "\n\u200B", styles })
                newModel.splice(leafIndex + 2, 0, { text: leafIndexText.slice(startLeafOffset), styles })
                removeEmpty()
                caretPosition.current += 2
                scrollToEnd()
                // thisTextArea.current!.scrollTop = CaretPosition(thisTextArea.current!).top
                // thisTextArea.current!.scrollTo({ top: CaretPosition(thisTextArea.current!).top + 500, behavior: "instant" })
            }
            else if (!e.ctrlKey) {
                newModel[leafIndex].text = leafIndexText.slice(0, startLeafOffset) + leafIndexText.slice(endLeafOffset, leafIndexText.length)
            }
        } // deletes \u200B\n on the same line

        setModel(newModel)
        caretPosition.current = caretPosition.current - (selectionLength + 1) > 0 ? caretPosition.current - (selectionLength + 1) : 0
    }

    function scrollToEnd() {
        const selection = window.getSelection()
        if (selection)
        thisTextArea.current!.scrollTo({behavior : "smooth",top : selection.getRangeAt(0).getBoundingClientRect().top - thisTextArea.current!.getBoundingClientRect().top + thisTextArea.current!.scrollTop - 300})

    }

    function keyDown(e: React.KeyboardEvent) {
        const isUndoRedo = e.ctrlKey && e.key.toLowerCase() === 'z'

        const isModifier = ["Control", "Shift", "Alt", "Meta", "CapsLock"].includes(e.key)

        if (!isUndoRedo && !isModifier) {
            if (undoIndex.current > 0) {
                undoModel.current = undoModel.current.slice(0, undoModel.current.length - undoIndex.current)
                undoCaretPositions.current = undoCaretPositions.current.slice(0, undoCaretPositions.current.length - undoIndex.current)
                undoIndex.current = 0
            }
            updateUndoModel(model)
        }

        lastTyped.current = Date.now()
        caretPosition.current = CaretPosition(thisTextArea.current!).pos
        formatSelection(e)
    }

    function updateUndoModel(newModel: Leaf[]) {
        if (undoIndex.current == 0) {
            if (JSON.stringify(undoModel.current.at(-1)) != JSON.stringify(newModel)) {
                undoModel.current.push(makeNewModel())
                // STRATEGY: Trust your internal ref tracking here
                undoCaretPositions.current.push(caretPosition.current)
            }
            if (undoModel.current.length > maxUndo) {
                undoModel.current.shift()
                undoCaretPositions.current.shift() // Keep this! It fixes the desync.
            }
        }
        return undoIndex.current == 0
    }

    useLayoutEffect(() => {
        if (caretPosition.current == 0) caretPosition.current = 1
        CaretPosition(thisTextArea.current!, caretPosition.current + 1)
    }, [model])

    const groupedModel = []
    let textGroup: Leaf[] = []

    function groupSimilar(style: "right" | "left" | "center" | "justify", startIndex: number) {
        groupedModel.push({ "type": "text", children: textGroup })
        textGroup = []

        const similar = []

        for (let i = startIndex; i < model.length; i++) {
            const leaf = model[i];

            if (leaf.styles && leaf.styles.advanced && leaf.styles.advanced.textAlign == style) {
                similar.push(leaf)
            }
            else {
                break
            }
        }

        groupedModel.push({ "type": "align_" + style, children: similar })

        return similar
    }

    for (let i = 0; i < model.length; i++) {
        const leaf = model[i];

        if (leaf.styles?.advanced?.textAlign == "right") {
            const similar = groupSimilar("right", i)
            i += similar.length - 1 < 0 ? 0 : similar.length - 1
        }
        else if (leaf.styles?.advanced?.textAlign == "center") {
            const similar = groupSimilar("center", i)
            i += similar.length - 1 < 0 ? 0 : similar.length - 1
        }
        else {
            textGroup.push(leaf)
        }
    }
    groupedModel.push({ "type": "text", children: textGroup })

    console.log("grouped:", groupedModel)

    function paste(e: React.ClipboardEvent) {
        const clipboardText = e.clipboardData.getData("text")
        const newModel: Leaf[] = makeNewModel()
        const nextLeafIndex = getLeafIndexFromCaretPosition(caretPosition.current + 1)
        const newModelLeaf = newModel[nextLeafIndex]

        for (const item of e.clipboardData.items) {
            if (item.type.startsWith("image/")) {
                const file = item.getAsFile()
                if (!file) continue

                const reader = new FileReader()

                reader.onload = () => {
                    const imageb64 = reader.result as string
                    const cachedText = newModelLeaf.text

                    newModelLeaf.text = cachedText.slice(0, getLeafIndexFromCaretPosition(caretPosition.current + 1, true))

                    newModel.splice(nextLeafIndex + 1, 0, {
                        text: "",
                        styles: {
                            image: imageb64,
                            advanced: { textAlign: "left" }
                        },
                        id: crypto.randomUUID().toString()
                    })

                    newModel.splice(nextLeafIndex + 2, 0, {
                        text: cachedText.slice(getLeafIndexFromCaretPosition(caretPosition.current + 1, true)),
                        styles: newModelLeaf.styles
                    })

                    if (cachedText.slice(getLeafIndexFromCaretPosition(caretPosition.current + 1, true)).length === 0) {
                        newModel.splice(nextLeafIndex + 2, 0, { text: "\u200B" })
                    }

                    caretPosition.current += 1
                    setModel(newModel)
                }

                reader.readAsDataURL(file)
            }
        }

        if (clipboardText) {

            newModelLeaf.text =
                newModelLeaf.text.slice(0, getLeafIndexFromCaretPosition(caretPosition.current + 1, true)) +
                clipboardText +
                newModelLeaf.text.slice(getLeafIndexFromCaretPosition(caretPosition.current + 1, true), newModel[getLeafIndexFromCaretPosition(caretPosition.current)].text.length)
            // getLeafIndexFromCaretPosition(caretPosition.current)
            // getLeafIndexFromCaretPosition(caretPosition.current, true)

            caretPosition.current += clipboardText.length
            setModel(newModel)
        }

        scrollToEnd()
    }

    function onDrop(e: React.DragEvent) {
        e.preventDefault()
        e.stopPropagation()
        if (!window.getSelection()?.isCollapsed) return
        if (!thisTextArea.current) return
        const img = new DOMParser().parseFromString(e.dataTransfer.getData("text/html"), "text/html").querySelector("img")
        if (!img) return

        const offset = document.caretPositionFromPoint(e.clientX, e.clientY)
        const offsetNode = offset?.offsetNode.parentElement
        const flatDomRepresentation = Array.from(thisTextArea.current.querySelectorAll("[data-leaf]"))
        if (!offsetNode) return
        
        const leafOffset = offset.offset
        let leafIndex = flatDomRepresentation.indexOf(offsetNode)

        if (leafIndex < 0) return

        let newModel: Leaf[] = makeNewModel()
        const newModelLeaf = newModel[leafIndex]
        const cachedText = newModelLeaf.text
        const imgIndex = newModel.map(el => el.id).findIndex(el => el == img.id)
        // console.log(flatDomRepresentation,newModel)

        console.log(newModel.map(e => e.text ?? e.styles?.image),flatDomRepresentation.map(e => e instanceof HTMLSpanElement ? e.textContent : e))
        console.log(newModel,flatDomRepresentation.map(e => e instanceof HTMLSpanElement ? e.textContent : e))
        // console.log(newModel.length, flatDomRepresentation.length, cachedText, leafIndex)

        if (newModel.length != flatDomRepresentation.length) {
            console.warn("length match error")
            return
        }

        newModel.splice(imgIndex, 1)
        if (imgIndex > leafIndex) leafIndex += 1
        // this gets deleted so the whole thing gets shifted so it goes 1 back

        newModelLeaf.text = cachedText.slice(0, leafOffset)

        // console.log(newModel.map(item => item.text))
        newModel.splice(leafIndex, 0, {
            text: "",
            styles: {
                image: img.src,
                advanced: { textAlign: "left" }
            },
            id: img.id
        })

        console.log(leafIndex + 1, newModel.length)
        if (newModel.length >= (leafIndex + 1) && cachedText.slice(leafOffset).length > 0) {
            newModel.splice(leafIndex + 1, 0, {
                text: cachedText.slice(leafOffset),
                styles: newModelLeaf.styles
            })
            console.log("this")
        }

        newModel = newModel.filter(item => item.text.length > 0 || item.styles?.image)

        setModel(newModel)
    }

    function Image({ src, id, style }: { src: string, id: string, style: CSSProperties }) {

        const sizeInModel = {
            x: typeof style.width == "number" ? style.width : parseInt(style.width as string),
            y: typeof style.height == "number" ? style.height : parseInt(style.height as string)
        }
        const [size, setSize] = useState<{ x: number, y: number }>(() => ({
            x: sizeInModel.x || 0,
            y: sizeInModel.y || 0,
        }))
        const [draggable, setDraggable] = useState<boolean>(true)
        const styles: CSSProperties = {
            "userSelect": "none", "WebkitUserSelect": "none", "cursor": draggable ? "grab" : "nwse-resize",
            "width": size?.x, "height": size?.y, "minWidth": 60, "minHeight": 60
        }
        const pos = useRef({
            x: 0,
            y: 0
        })

        function onDragStart(e: React.DragEvent<HTMLImageElement>) {
            e.dataTransfer.effectAllowed = "move"
            e.dataTransfer.setData("text/plain", "")
            e.dataTransfer.setData("text/uri-list", "")

            const blankImage = document.createElement("img");
            blankImage.src =
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

            e.dataTransfer.setDragImage(blankImage, 0, 0);
        }

        const onMouseMove = useCallback((e: MouseEvent) => {
            setSize({
                x: e.clientX - pos.current.x + 20,
                y: e.clientY - pos.current.y + 20
            })
        }, [pos])

        function collapseSelection(e: React.MouseEvent) {
            window.getSelection()?.collapse(e.currentTarget)
        }

        function resize(e: React.MouseEvent<HTMLImageElement>) {
            e.preventDefault()
            collapseSelection(e)
            setDraggable(!draggable)
            pos.current = { x: e.currentTarget.x, y: e.currentTarget.y }

            console.log(draggable)
            if (draggable) {
                document.removeEventListener("mousemove", onMouseMove)
                const newModel = makeNewModel()
                const imgIndex = newModel.map(el => el.id).findIndex(el => el == id)
                newModel[imgIndex].styles.advanced ??= {}
                newModel[imgIndex].styles.advanced.width = size?.x
                newModel[imgIndex].styles.advanced.height = size?.y
                setModel(newModel)
            }
            else {
                document.addEventListener("mousemove", onMouseMove)
            }
        }

        function onLoad(e: React.SyntheticEvent<HTMLImageElement>) {
            setSize({
                x: e.currentTarget.clientWidth,
                y: e.currentTarget.clientHeight
            })
        }

        function onClickdelete() {
            const newModel = makeNewModel()
            const imgIndex = newModel.map(el => el.id).findIndex(el => el == id)
            newModel.splice(imgIndex, 1)
            if (imgIndex + 1 < newModel.length && newModel[imgIndex + 1].text == "\u200B") newModel.splice(imgIndex + 1, 1)
            if (newModel[imgIndex - 1].text == "\u200B") newModel.splice(imgIndex - 1, 1)

            setModel(newModel)
        }

        return (
            <div className="imgDiv" contentEditable={false} data-leaf>
                <img onLoad={onLoad} draggable={draggable} src={src} style={styles} onMouseDown={collapseSelection} onClick={resize} onDragStart={onDragStart} onDrop={e => e.preventDefault()} id={id} />
                <div className="deleteImgButton" onClick={onClickdelete} />
            </div>
        )
    }

    return (
        <div id={useId()} suppressContentEditableWarning contentEditable={true} onKeyDown={keyDown}
            onPasteCapture={paste} ref={thisTextArea} onBeforeInput={updateDomModel} className="textInput"
            onPaste={e => e.preventDefault()} onDrop={onDrop}>

            {groupedModel.map((block, i) => {
                const blockStyles: CSSProperties = {}

                if (block.type == "align_right") {
                    blockStyles.textAlign = "right"
                }
                else if (block.type == "align_center") {
                    blockStyles.textAlign = "center"
                }

                return (
                    <div key={i} style={blockStyles} >
                        {block.children.map((leaf, index) => {
                            let styles: CSSProperties = {}
                            let override = null

                            if (leaf.styles) {
                                styles = { ...leaf.styles.advanced }

                                Object.entries(leaf.styles).forEach(([style, value]) => {
                                    if (style == "image" && value) {
                                        override = (
                                            <Image src={(String)(value)} style={styles} key={i + "-" + index} id={leaf.id ?? ""} />
                                        )
                                        return
                                    }

                                    styles.textDecorationLine ??= ""
                                    if (style == "bold" && value) styles.fontWeight = 600
                                    if (style == "italic" && value) styles.fontStyle = "italic"
                                    if (style == "underline" && value) styles.textDecorationLine += " underline"
                                    if (style == "overline" && value) styles.textDecorationLine += " overline"
                                    if (style == "strikethrough" && value) styles.textDecorationLine += " line-through"
                                })
                            }

                            return override || (
                                <span key={i + "-" + index} style={styles} data-leaf>
                                    {leaf.text}
                                </span>
                            )
                        })}
                    </div>
                )
            })}
        </div>
    )
}   
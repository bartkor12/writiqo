import React, { useId, useLayoutEffect, useRef, type CSSProperties } from "react"
import { position as CaretPosition } from "caret-pos"
import Format from "./Format"

interface EditorComponentProps {
    model: Leaf[],
    setModel: React.Dispatch<React.SetStateAction<Leaf[]>>
}

export default function Paragraph({ model, setModel }: EditorComponentProps) {
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
                return caretPosition - stringLength + 1
            }

            stringLength += leaf.text.length

            if (stringLength > caretPosition) {
                return index
            }
        };

        return model.length - 1
    }

    function updateDomModel(e: React.InputEvent) {
        e.preventDefault()

        caretPosition.current = CaretPosition(thisTextArea.current!).pos

        const input = e.data
        const caretOffset = window.getSelection()?.focusOffset
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
        const startLeafIndex = getLeafIndexFromCaretPosition(caretPosition.current - selectionLength)
        const leafIndex: number = getLeafIndexFromCaretPosition(caretPosition.current)
        const startLeafOffset = getLeafIndexFromCaretPosition(caretPosition.current - selectionLength, true)
        const endLeafOffset = getLeafIndexFromCaretPosition(caretPosition.current, true)
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

        let newModel: Leaf[] = makeNewModel()
        
        function removeEmpty() {

            newModel = newModel.filter(item => item.text !== "")
            
            // fixes enter key
            for (let i = 0; i < newModel.length; i++) {
                if (i + 1 < newModel.length && newModel[i].text == "\n" && newModel[i + 1].text == '\u2028') i += 2

                if (i + 1 < newModel.length && newModel[i].text == "\n" && newModel[i + 1].text != '\u2028') {
                    newModel[i].text = "\n\u2028"
                    caretPosition.current += 1
                }
                
                if (i < newModel.length && newModel[i].text == '\u2028') newModel.splice(i,1)
            }
        }
        
        // format and style
        if (e.ctrlKey && style) {
            e.preventDefault()
            Format({
                model,
                setModel,
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

        // erase and delete
        console.log("input")

        // function activateTextAlign(style: string) {
        //     newModel[leafIndex].styles ??= {}
        //     newModel[leafIndex].styles.advanced ??= {}
        //     if (newModel[leafIndex].styles.advanced.textAlign == undefined) newModel[leafIndex].styles.advanced.textAlign = "left"
            
        //     if (newModel[leafIndex].styles.advanced.textAlign == style) {
        //         document.getElementById("align_center")!.classList.remove("activated")
        //         document.getElementById("align_right")!.classList.remove("activated")
        //         document.getElementById("align_left")!.classList.remove("activated")
        //         document.getElementById("align_justify")!.classList.remove("activated")

        //         document.getElementById("align_" + style)!.classList.add("activated")
        //     }
        // }
        
        // activateTextAlign("center")
        // activateTextAlign("left")
        // activateTextAlign("right")
        // activateTextAlign("justify")

        console.log(newModel)

        if (e.ctrlKey && e.key === "c") {
            document.execCommand("copy")
        }

        const leafIndexText = newModel[leafIndex].text

        if (startLeafIndex < leafIndex && (!e.ctrlKey || (e.ctrlKey && e.key === "v"))) {

            newModel[startLeafIndex].text = newModel[startLeafIndex].text.slice(0, startLeafOffset)
            newModel[leafIndex].text = leafIndexText.slice(endLeafOffset, leafIndexText.length)

            if (leafIndex - startLeafIndex > 1) {
                newModel.splice(startLeafIndex + 1, leafIndex - startLeafIndex - 1);
            }

        }
        else {
            if ((e.key === "Backspace" || e.key === "Delete") && startLeafOffset == endLeafOffset) {
                if (e.ctrlKey && newModel[startLeafIndex].text != "" && leafIndexText != '\n\u2028') {
                    const firstHalf = newModel.slice(0,leafIndex+1).flatMap(leaf => leaf.text).join("").slice(0,caretPosition.current)
                    const newLineOffset = firstHalf.split('\n\u2028').reverse().filter(item => item !== "")[0].length
                    const spaceLeafOffset = firstHalf.split(" ").reverse().filter(item => item !== "")[0].length
                    const deletionOffset = Math.min(spaceLeafOffset,newLineOffset)
                    const spacePosition = caretPosition.current - deletionOffset
                    const spaceLeafIndex = getLeafIndexFromCaretPosition(spacePosition)

                    if (spaceLeafIndex < leafIndex) {
                        // console.log("hiiii1" + newModel[spaceLeafIndex].text.slice(0, getLeafIndexFromCaretPosition(spacePosition, true)))
                        // console.log("hiiii2" + leafIndexText.slice(startLeafOffset, leafIndexText.length)
                        console.log("here")
                        newModel[spaceLeafIndex].text = newModel[spaceLeafIndex].text.slice(0, getLeafIndexFromCaretPosition(spacePosition, true))
                        newModel[leafIndex].text = leafIndexText.slice(startLeafOffset, leafIndexText.length).replace(/[\n\u2028 ]/g,"")
                    }
                    else {
                        console.log("right here")
                        newModel[leafIndex].text = leafIndexText.slice(0, getLeafIndexFromCaretPosition(spacePosition,true)) + leafIndexText.slice(endLeafOffset, leafIndexText.length).replace(/[\n\u2028 ]/g,"")
                    }
                    if (leafIndex - spaceLeafIndex > 1) {
                        newModel.splice(spaceLeafIndex + 1, leafIndex - spaceLeafIndex - 1);
                    }
                    caretPosition.current = spacePosition
                }
                else {
                    if (leafIndexText == "\n\u2028") {
                        if (getLeafIndexFromCaretPosition(caretPosition.current,true) == 1) caretPosition.current += 1 
                        newModel.splice(leafIndex,1)
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
                updateUndoModel(newModel)

                if (e.shiftKey) {
                    console.log("redo",undoModel)
                    undoIndex.current = Math.max(undoIndex.current - 1, 0)
                }
                else {
                    console.log("undo", undoModel)
                    undoIndex.current = Math.min(undoIndex.current + 1, undoModel.current.length)
                }
                caretPosition.current = undoCaretPositions.current[undoModel.current.length - undoIndex.current] ?? caretPosition.current
                newModel = undoModel.current[undoModel.current.length - undoIndex.current] ?? newModel;
            }
            else if (e.key === "Enter") {
                const styles = newModel[leafIndex].styles
                newModel.splice(leafIndex, 1, { text: leafIndexText.slice(0, startLeafOffset), styles })
                newModel.splice(leafIndex + 1,0,{ text : "\n\u2028", styles})
                newModel.splice(leafIndex + 2,0, {text : leafIndexText.slice(startLeafOffset) , styles})
                removeEmpty()
                caretPosition.current += 2
            }
            else if (!e.ctrlKey) {
                newModel[leafIndex].text = leafIndexText.slice(0, startLeafOffset) + leafIndexText.slice(endLeafOffset, leafIndexText.length)
            }
        } // deletes \u2028\n on the same line

        if (!newModel[0] ) {
            newModel.splice(0, 0, { text: '\u2028\u2028' })
            caretPosition.current += 2
        }

        setModel(newModel)
        caretPosition.current = caretPosition.current - (selectionLength + 1) > 0 ? caretPosition.current - (selectionLength + 1) : 0
    }

    function keyDown(e: React.KeyboardEvent) {

        caretPosition.current = CaretPosition(thisTextArea.current!).pos

        formatSelection(e)
    }

    function updateUndoModel(newModel: Leaf[]) {
        if (undoIndex.current == 0) {
            if (JSON.stringify(undoModel.current.at(-1)) != JSON.stringify(newModel)) {
                undoModel.current.push(makeNewModel())
                undoCaretPositions.current.push(caretPosition.current)
            }
            if (undoModel.current.length > maxUndo) undoModel.current.shift()
        }
        return undoIndex.current == 0
    } 

    useLayoutEffect(() => {
        CaretPosition(thisTextArea.current!, caretPosition.current + 1)
        console.log(caretPosition.current,undoModel)

        if (Date.now() - lastTyped.current > 300) {
            if (!updateUndoModel(model)) {
                if (model != undoModel.current.at(-(undoIndex.current))) {
                    console.log(undoModel, undoIndex)
                    console.log("resetting")
                    undoModel.current = undoModel.current.slice(0, undoModel.current.length - undoIndex.current)
                    undoCaretPositions.current = undoCaretPositions.current.slice(0, undoCaretPositions.current.length - undoIndex.current)
                    undoIndex.current = 0
                }
            }
        }
        lastTyped.current = Date.now()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [model])

    // function paginate() {
    //     if (!thisTextArea.current) return

    //     const flatDomRepresentation = Array.from(thisTextArea.current.querySelectorAll("*")).filter(item => item.firstChild && item.firstChild.nodeType == Node.TEXT_NODE)
        
    //     let totalHeight = 0
    //     let prevSpanY = 0
    //     let prevLeaf : Leaf | undefined
    //     let similar : Leaf[] = []
    //     let nextPage = 0

    //     const pagedModel : Array<Array<{type : string, children : Leaf[]}>> = []

    //     for (let i = 0; i < flatDomRepresentation.length; i++) {
    //         const span = flatDomRepresentation[i];
    //         const spanRect = span.getBoundingClientRect()
    //         const spanHeight = spanRect.height
    //         const spanY = spanRect.y
    //         const leaf = model[i]
    //         const page = Math.floor((totalHeight + spanHeight) / 1122)

    //         if (leaf) {
    //             leaf.styles ??= {}
    //             leaf.styles.advanced ??= { textAlign: "left" }
    //         }

    //         if (prevSpanY != spanY) {
    //             totalHeight += spanHeight
    //             prevSpanY = spanY
    //         }

    //         if (nextPage == page && leaf && prevLeaf) {
    //             pagedModel[page - 1] ??= []
    //             pagedModel[page - 1].push({type : "text", children : similar})
    //             similar = []
    //         }
            
    //         if (prevLeaf && leaf && prevLeaf.styles?.advanced?.textAlign == leaf.styles?.advanced?.textAlign) {
    //             if (!similar.includes(prevLeaf)) similar.push(prevLeaf)
    //             console.log(leaf)
    //             similar.push(leaf)
    //         }
    //         if ((leaf && prevLeaf && prevLeaf?.styles?.advanced?.textAlign != leaf.styles?.advanced?.textAlign) || i == flatDomRepresentation.length - 1) {
    //             console.log("hi")
    //             const textAlign = leaf.styles?.advanced?.textAlign == null ? "text" : "align_" + leaf.styles?.advanced?.textAlign
    //             pagedModel[page] ??= []
    //             pagedModel[page].push({ type: textAlign, children: similar })
    //             similar = []
    //         }

    //         nextPage = page + 1
    //         prevLeaf = leaf
    //     }    

    //     return pagedModel
    // }

    // let paginatedModel = paginate()

    const groupedModel = []
    let textGroup : Leaf[] = []

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

    console.log("grouped:",groupedModel)

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
                        }
                    })

                    newModel.splice(nextLeafIndex + 2, 0, {
                        text: "\u2028" + cachedText.slice(getLeafIndexFromCaretPosition(caretPosition.current + 1, true), cachedText.length),
                        styles: newModelLeaf.styles
                    })


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
    }

    function Image({src, id} : {src : string, id : string}) {
        
        function onDragStart(e : React.DragEvent<HTMLImageElement>) {
            e.dataTransfer.effectAllowed = "move"
            e.dataTransfer.setData("text/plain","")
            e.dataTransfer.setData("text/uri-list","")

            const blankImage = document.createElement("img");
            blankImage.src =
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

            e.dataTransfer.setDragImage(blankImage, 0, 0);
        }

        return (
            <img src={src} onDragStart={onDragStart} onDrop={e => e.preventDefault()} id={id}/>
        )
    }

    function onDrop(e : React.DragEvent) {
        e.preventDefault() 
        e.stopPropagation()
        if (!window.getSelection()?.isCollapsed) return
        if (!thisTextArea.current) return
        const img = new DOMParser().parseFromString(e.dataTransfer.getData("text/html"),"text/html").querySelector("img")
        if (!img) return

        const offset = document.caretPositionFromPoint(e.clientX,e.clientY)
        const offsetNode = offset?.offsetNode.parentElement
        const flatDomRepresentation = Array.from(thisTextArea.current.querySelectorAll("*")).filter(item => (item.firstChild && item.firstChild.nodeType == Node.TEXT_NODE) || item instanceof HTMLImageElement )
        if (!offsetNode) return
        
        const leafOffset = offset.offset
        const leafIndex = flatDomRepresentation.indexOf(offsetNode)

        if (leafIndex < 0) return

        const newModel: Leaf[] = makeNewModel()
        const newModelLeaf = newModel[leafIndex]
        const cachedText = newModelLeaf.text

        console.log(newModel,flatDomRepresentation)
        newModel.splice(flatDomRepresentation.map(el => el.id).indexOf(img.id),1)

        newModelLeaf.text = cachedText.slice(0, leafOffset)
        
        newModel.splice(leafIndex + 1, 0, {
            text: "",
            styles: {
                image: img.src,
                advanced: { textAlign: "left" }
            }
        })
        
        newModel.splice(leafIndex + 2, 0, {
            text: "\u2028" + cachedText.slice(leafOffset, cachedText.length),
            styles: newModelLeaf.styles
        })


        setModel(newModel)
    }

    // paginatedModel ??= [groupedModel]
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
                                            <Image src={(String)(value)} key={i + "-" + index} id={crypto.randomUUID()} />
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
                                <span key={i + "-" + index} style={styles}>
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
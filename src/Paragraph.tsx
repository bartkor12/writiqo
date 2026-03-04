import { useId, useLayoutEffect, useRef, type CSSProperties } from "react"
import { position as CaretPosition } from "caret-pos"
import Format from "./Format"

interface EditorComponentProps {
    model: Leaf[],
    setModel: React.Dispatch<React.SetStateAction<Leaf[]>>
}

export default function Paragraph({ model, setModel }: EditorComponentProps) {
    const thisTextArea = useRef<HTMLDivElement>(null)

    const caretPosition = useRef<number>(0)

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

        const newModel: Leaf[] = [...model]
        newModel[leafIndex].text = newText
        setModel(newModel)
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

                default:
                    e.preventDefault()
                    break
            }
        }

        let newModel: Leaf[] = model.map(leaf => ({
            ...leaf,
            styles: { ...leaf.styles }
        }));
        
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
        else if (e.altKey || e.shiftKey || e.metaKey) {
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

        function activateTextAlign(style: string) {
            newModel[leafIndex].styles ??= {}
            newModel[leafIndex].styles.advanced ??= {}
            if (newModel[leafIndex].styles.advanced.textAlign == undefined) newModel[leafIndex].styles.advanced.textAlign = "left"
            
            if (newModel[leafIndex].styles.advanced.textAlign == style) {
                document.getElementById("align_center")!.classList.remove("activated")
                document.getElementById("align_right")!.classList.remove("activated")
                document.getElementById("align_left")!.classList.remove("activated")
                document.getElementById("align_justify")!.classList.remove("activated")

                document.getElementById("align_" + style)!.classList.add("activated")
            }
        }
        
        activateTextAlign("center")
        activateTextAlign("left")
        activateTextAlign("right")
        activateTextAlign("justify")

        console.log(newModel)

        const leafIndexText = newModel[leafIndex].text

        if (startLeafIndex < leafIndex && !e.ctrlKey) {

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
            else if (e.key === "a" && e.ctrlKey) {
                console.log("all")
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

    useLayoutEffect(() => {
        CaretPosition(thisTextArea.current!, caretPosition.current + 1)
        console.log(caretPosition.current)
    }, [model])

    const groupedModel = []

    function groupSimilar(style: "right" | "left" | "center" | "justify", startIndex: number) {
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

        return similar
    }

    let textGroup = []
    for (let i = 0; i < model.length; i++) {
        const leaf = model[i];

        if (leaf.styles?.advanced?.textAlign == "right") {
            groupedModel.push({ "type": "text", children: textGroup })
            textGroup = []
            const similar = groupSimilar("right", i)
            groupedModel.push({ "type": "align_right", children: similar })
            i += similar.length - 1 < 0 ? 0 : similar.length - 1
        }
        else if (leaf.styles?.advanced?.textAlign == "center") {
            groupedModel.push({ "type": "text", children: textGroup })
            textGroup = []
            const similar = groupSimilar("center", i)
            groupedModel.push({ "type": "align_center", children: similar })
            i += similar.length - 1 < 0 ? 0 : similar.length - 1
        }
        else {
            textGroup.push(leaf)
        }
    }
    groupedModel.push({ "type": "text", children: textGroup })

    function paginate() {
        if (!thisTextArea.current) return

        const flatDomRepresentation = Array.from(thisTextArea.current.querySelectorAll("*")).filter(item => item.firstChild && item.firstChild.nodeType == Node.TEXT_NODE && item.textContent == '\n\u2028')

        let totalHeight = 0
        const pages = []

        for (let i = 0; i < flatDomRepresentation.length; i++) {
            const span = flatDomRepresentation[i];
            const spanHeight = span.getBoundingClientRect().height

            if (totalHeight + spanHeight > 1122) {
                pages.push(i)
                totalHeight = 0
            }
            
            totalHeight += spanHeight
            console.log(spanHeight,totalHeight)
        }

        if (pages[0]) {
            console.log(groupedModel[0].children[pages[0]])
        }

        return pages
    }

    console.log("pages",paginate())

    console.log(groupedModel)

    return (
        <div id={useId()} suppressContentEditableWarning contentEditable={true} onKeyDown={keyDown} ref={thisTextArea} onBeforeInput={updateDomModel} className="textInput" onPaste={e => e.preventDefault()}>
            {groupedModel.map((block, i) => {
                const blockStyles: CSSProperties = {}

                if (block.type == "align_right") {
                    // blockStyles.display = "flex"
                    // blockStyles.justifyContent = "end"
                    blockStyles.textAlign = "right"
                }
                else if (block.type == "align_center") {
                    // blockStyles.display = "flex"
                    // blockStyles.justifyContent = "center"
                    blockStyles.textAlign = "center"
                }

                return (
                    <div key={i} style={blockStyles} >
                        {block.children.map((leaf, index) => {
                            let styles: CSSProperties = {}

                            if (leaf.styles) {
                                styles = { ...leaf.styles.advanced }

                                Object.entries(leaf.styles).forEach(([style, value]) => {
                                    styles.textDecorationLine ??= ""
                                    if (style == "bold" && value) styles.fontWeight = 600
                                    if (style == "italic" && value) styles.fontStyle = "italic"
                                    if (style == "underline" && value) styles.textDecorationLine += " underline"
                                    if (style == "overline" && value) styles.textDecorationLine += " overline"
                                    if (style == "strikethrough" && value) styles.textDecorationLine += " line-through"
                                })
                            }

                            return (
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
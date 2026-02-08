import { Fragment, useId, useLayoutEffect, useRef, type CSSProperties } from "react"
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
            if (newModel.length > 1) {
                newModel = newModel.filter(item => item.text !== "")
            }
            
            if (newModel.length == 0) {
                newModel.push({text : ""})
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
        console.log("Erasing / Typing")

        if (startLeafIndex < leafIndex && !e.ctrlKey) {

            newModel[startLeafIndex].text = newModel[startLeafIndex].text.slice(0, startLeafOffset)
            newModel[leafIndex].text = newModel[leafIndex].text.slice(endLeafOffset, newModel[leafIndex].text.length)

            if (leafIndex - startLeafIndex > 1) {
                newModel.splice(startLeafIndex + 1, leafIndex - startLeafIndex - 1);
            }
        }
        else {
            if ((e.key === "Backspace" || e.key === "Delete") && startLeafOffset == endLeafOffset) {
                if (e.ctrlKey && newModel[startLeafIndex].text != "") {
                    const spaceLeafOffset = newModel.slice(0,leafIndex+1).flatMap(leaf => leaf.text).join("").slice(0,caretPosition.current).split(" ").reverse().filter(item => item !== "")[0].length
                    const spacePosition = caretPosition.current - spaceLeafOffset
                    const spaceLeafIndex = getLeafIndexFromCaretPosition(spacePosition)

                    if (spaceLeafIndex < leafIndex) {
                        console.log(newModel[spaceLeafIndex].text.slice(0, getLeafIndexFromCaretPosition(spacePosition, true)))
                        console.log(newModel[leafIndex].text.slice(startLeafOffset, newModel[leafIndex].text.length))
                        newModel[spaceLeafIndex].text = newModel[spaceLeafIndex].text.slice(0, getLeafIndexFromCaretPosition(spacePosition, true))
                        newModel[leafIndex].text = newModel[leafIndex].text.slice(startLeafOffset, newModel[leafIndex].text.length)
                    }
                    else {
                        newModel[leafIndex].text = newModel[leafIndex].text.slice(0, getLeafIndexFromCaretPosition(spacePosition,true)) + newModel[leafIndex].text.slice(endLeafOffset, newModel[leafIndex].text.length)
                    }
                    if (leafIndex - spaceLeafIndex > 1) {
                        newModel.splice(spaceLeafIndex + 1, leafIndex - spaceLeafIndex - 1);
                    }
                    caretPosition.current = spacePosition
                }
                else {
                    if (newModel[leafIndex].text.slice(0, startLeafOffset) != "") {
                        newModel[leafIndex].text = newModel[leafIndex].text.slice(0, startLeafOffset - 1) + newModel[leafIndex].text.slice(startLeafOffset, newModel[leafIndex].text.length)
                    }
                }
                // if (newModel[leafIndex].text == "" && leafIndex != 0) newModel.splice(leafIndex, 1)
                removeEmpty()
                caretPosition.current -= 1
            }
            else if (e.key === "Enter") {
                newModel[leafIndex].text = [newModel[leafIndex].text.slice(0,startLeafOffset),"\n",newModel[leafIndex].text.slice(startLeafOffset)].join("")
                removeEmpty()
                caretPosition.current += 1
            }
            else {
                newModel[leafIndex].text = newModel[leafIndex].text.slice(0, startLeafOffset) + newModel[leafIndex].text.slice(endLeafOffset, newModel[leafIndex].text.length)
            }
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
    }, [model])

    const groupedModel = []

    function groupSimilar(style: "align_right" | "align_left" | "align_center" | "align_justify", startIndex: number) {
        const similar = []

        for (let i = startIndex; i < model.length; i++) {
            const leaf = model[i];

            if (leaf.styles?.[style]) {
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

        if (leaf.styles?.align_right) {
            groupedModel.push({ "type": "text", children: textGroup })
            textGroup = []
            const similar = groupSimilar("align_right", i)
            groupedModel.push({ "type": "align_right", children: similar })
            i += similar.length - 1 < 0 ? 0 : similar.length - 1
        }
        else if (leaf.styles?.align_center) {
            groupedModel.push({ "type": "text", children: textGroup })
            textGroup = []
            const similar = groupSimilar("align_center", i)
            groupedModel.push({ "type": "align_center", children: similar })
            i += similar.length - 1 < 0 ? 0 : similar.length - 1
        }
        else {
            textGroup.push(leaf)
        }
    }
    groupedModel.push({ "type": "text", children: textGroup })

    console.log(groupedModel)

    return (
        <div id={useId()} suppressContentEditableWarning contentEditable={true} onKeyDown={keyDown} ref={thisTextArea} onBeforeInput={updateDomModel} className="textInput" onPaste={e => e.preventDefault()}>
            {groupedModel.map((block, i) => {
                const blockStyles : CSSProperties = {}

                if (block.type == "align_right") {
                    blockStyles.display = "flex"
                    blockStyles.justifyContent = "end"
                }
                else if (block.type == "align_center") {
                    blockStyles.display = "flex"
                    blockStyles.justifyContent = "center"
                }

                return (
                    <div key={i} style={blockStyles} >
                        {block.children.map((leaf,index) => {
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

                            // console.log(index == block.children.length - 1 ? "\n" : null)

                            return (
                                <span key={i + "-" + index} style={styles}>
                                    {leaf.text}
                                    {/* {leaf.text + (index == block.children.length - 1 ? "\n" : "")} */}
                                </span>
                            )
                        })}
                    </div>
                )
            })}
        </div>
    )
}
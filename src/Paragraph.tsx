import { useEffect, useId, useLayoutEffect, useRef, type CSSProperties } from "react"
import { delay } from "./main"
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

        let newModel: Leaf[] = [...model]
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
                    break
            }
        }

        let newModel: Leaf[] = model.map(leaf => ({
            ...leaf,
            styles: { ...leaf.styles }
        }));

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
        else if (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) {
            return
        }
        console.log("continuing")

        
        if (e.key === "Backspace" || e.key === "Delete") {
            e.preventDefault()
        }

        // erase and delete
        console.log("Erasing / Typing")

        if (startLeafIndex < leafIndex) {

            newModel[startLeafIndex].text = newModel[startLeafIndex].text.slice(0, startLeafOffset)
            newModel[leafIndex].text = newModel[leafIndex].text.slice(endLeafOffset, newModel[leafIndex].text.length)

            if (leafIndex - startLeafIndex > 1) {
                newModel.splice(startLeafIndex + 1, leafIndex - startLeafIndex - 1);
            }
        }
        else {
            if ((e.key === "Backspace" || e.key === "Delete") && startLeafOffset == endLeafOffset) {
                newModel[leafIndex].text = newModel[leafIndex].text.slice(0, startLeafOffset - 1) + newModel[leafIndex].text.slice(startLeafOffset, newModel[leafIndex].text.length)
                if (newModel[leafIndex].text == "" && leafIndex != 0) newModel.splice(leafIndex,1)
                caretPosition.current -= 1
                console.log(newModel)
            }
            else {
                newModel[leafIndex].text = newModel[leafIndex].text.slice(0, startLeafOffset) + newModel[leafIndex].text.slice(endLeafOffset, newModel[leafIndex].text.length)
            }
        }

        setModel(newModel)

        caretPosition.current -= (selectionLength + 1)
    }

    function keyDown(e: React.KeyboardEvent) {

        caretPosition.current = CaretPosition(thisTextArea.current!).pos

        formatSelection(e)
    }

    useLayoutEffect(() => {
        CaretPosition(thisTextArea.current!, caretPosition.current + 1)
    }, [model])

    useEffect(() => {
        if (!thisTextArea.current) return

        let cooldown = false

        const observer = new MutationObserver(async () => {
            if (!thisTextArea.current) return

            if (!cooldown) {
                cooldown = true
                thisTextArea.current.style.height = "auto"
                thisTextArea.current.style.height = thisTextArea.current.scrollHeight + "px"
                await delay(100)
                cooldown = false
            }
        })
        observer.observe(thisTextArea.current, {
            attributes: true,
            characterData: true,
            childList: true,
            subtree: true
        })

        return () => observer.disconnect()
    }, [])

    let groupedModel = []

    function groupSimilar(style: "align_right" | "align_left" | "align_center" | "align_justify", startIndex: number) {
        let similar = []

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

    for (let i = 0; i < model.length; i++) {
        const leaf = model[i];

        if (leaf.styles?.align_right) {
            const similar = groupSimilar("align_right",i)
            groupedModel.push({"type" : "align_right", children : similar})
            i += similar.length - 1 < 0 ? 0 : similar.length - 1
        }
        else {
            groupedModel.push({"type" : "text", children : [leaf]})
        }
    }

    console.log(groupedModel)

    return (
        <div id={useId()} suppressContentEditableWarning contentEditable={true} onKeyDown={keyDown} ref={thisTextArea} onBeforeInput={updateDomModel} className="textInput" onPaste={e => e.preventDefault()}>
            {model.map((leaf, i) => {

                let styles: CSSProperties = {}

                if (leaf.styles) {
                    styles = {...leaf.styles.advanced}

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
                    <span key={i} style={styles}>
                        {leaf.text}
                    </span>
                )

            })}
        </div >
    )
}
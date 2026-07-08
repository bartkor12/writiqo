import { position as CaretPosition } from "caret-pos"
import type { CSSProperties } from "react"
import { filterEmptyLeaf } from "./utils/general"
import { modelStore } from "./utils/stores"

let savedSelection: { length: number, end: number, id : string } = { length: 0, end: 0, id : "" }

function getEditableContentDiv() {
    const selection = window.getSelection()

    // console.log(savedSelection)

    if (selection?.isCollapsed) {
        return document.getElementById(savedSelection.id)
    }

    let node = selection?.getRangeAt(0).startContainer as HTMLElement

    while (node && node.className !== "textInput") {
        node = node.parentElement!
    }

    return node
}

export default function Format({ style, advanced = undefined }: FormatTypes) {
    const model = modelStore.getState().model
    const setModel = modelStore.getState().setModel

    const editableContentDiv = getEditableContentDiv()
    if (!editableContentDiv) return
    
    function restoreSelection() {
        const selection = window.getSelection()
        editableContentDiv?.focus()
        if (selection?.isCollapsed) {
            selection?.removeAllRanges()
            console.log(createRangeFromPositions(savedSelection.end - savedSelection.length, savedSelection.end))
            selection?.addRange(createRangeFromPositions(savedSelection.end - savedSelection.length, savedSelection.end))
        }
    }

    restoreSelection()

    const caretPosition = CaretPosition(editableContentDiv).pos
    const editableContentDivId = editableContentDiv.id

    function getLeafIndexFromCaretPosition(caretPosition: number, getOffset: boolean = false) {

        let stringLength = 1

        for (let index = 0; index < model.length; index++) {
            const leaf = model[index];

            if (getOffset && stringLength + leaf.text.length > caretPosition) {
                console.warn(caretPosition, stringLength + 1, caretPosition - stringLength + 1, leaf.styles?.image)
                return Math.max(0,caretPosition - stringLength + 1)
            }

            stringLength += leaf.text.length

            if (stringLength > caretPosition) {
                return index
            }
        };

        return model.length - 1
    }

    function createRangeFromPositions(start: number, end: number) {
        const range = document.createRange()

        if (!editableContentDiv) {
            console.warn("errored on createRangeFromPositions : editableContentDiv")
            return range
        }
        // const flatDomRepresentation = Array.from(editableContentDiv.querySelectorAll("*")).filter(item => item.firstChild && item.firstChild.nodeType == Node.TEXT_NODE)
        const flatDomRepresentation = Array.from(editableContentDiv.querySelectorAll("[data-leaf]"));
        const startNode = flatDomRepresentation[getLeafIndexFromCaretPosition(start)].firstChild
        const endNode = flatDomRepresentation[getLeafIndexFromCaretPosition(end)].firstChild

        console.log(model,flatDomRepresentation.map(el => el.textContent))
        if (!startNode || !endNode) {
            console.warn("errored on createRangeFromPositions: startElement || endElement")
            return range
        }

        range.setStart(
            startNode,
            getLeafIndexFromCaretPosition(start, true)
        )
        range.setEnd(
            endNode,
            getLeafIndexFromCaretPosition(end, true)
        )

        return range
    }

    const selection = window.getSelection()

    function saveRange() {
        if (selection && !selection.isCollapsed && document.getElementById("textInputDiv")?.contains(selection.anchorNode)) {
            console.log(savedSelection)
            savedSelection = { length: selectionLength, end: caretPosition, id : editableContentDivId }
        }
        console.log("helloooo")
    }

    
    function advancedStyles(index: number) {
        const leaf = newModel[index]
        
        leaf.styles!.advanced! ??= {}
        
        if (leaf.styles && leaf.styles.advanced) {
            if (advanced) {
                const styles : CSSProperties = { ...leaf.styles.advanced }
                
                if (styles[advanced.property] && !advanced.overwrite) {2
                    delete styles[advanced.property]
                } else {
                    styles[advanced.property] = advanced.value
                }
                return styles
            }
        }
        else {
            console.error("Advanced Styling Failed: ",advanced,leaf);
        }
        return leaf.styles!.advanced ?? {}
    }
    
    const imgCount = selection?.getRangeAt(0)?.cloneContents()?.querySelectorAll("img")?.length
    const selectionLength = window.getSelection()!.toString().length - (imgCount ?? 0)
    const startLeafIndex = getLeafIndexFromCaretPosition(caretPosition - selectionLength)
    const leafIndex: number = getLeafIndexFromCaretPosition(caretPosition)
    const startLeafOffset = getLeafIndexFromCaretPosition(caretPosition - selectionLength, true)
    const endLeafOffset = getLeafIndexFromCaretPosition(caretPosition, true)

    saveRange()
    
    let newModel: Leaf[] = model.map(leaf => ({
        ...leaf,
        styles: {
            ...leaf.styles,
            advanced: leaf.styles?.advanced
        }
    }));

    // format and style

    // console.log("Formatting Manually")
    // console.log("length: " + selectionLength)

    if (startLeafIndex < leafIndex) {
        console.log(style)

        // console.log("Loop range", startLeafIndex, leafIndex);
        for (let index = startLeafIndex + 1; index < leafIndex; index++) {
            // console.log("Index touched:", index);

            if (advanced) {
                newModel[index]!.styles!.advanced! = advancedStyles(index)
            }
            else {
                
                newModel[index].styles![style] = !newModel[index].styles![style];
            }
        }

        // initialise styles since it is an optional argument
        newModel[startLeafIndex].styles ??= {}
        newModel[leafIndex].styles ??= {}

        newModel.splice(leafIndex, 0, { text: newModel[leafIndex].text.slice(0, endLeafOffset), styles: { ...newModel[leafIndex].styles, [style]: !newModel[leafIndex].styles[style], advanced : advancedStyles(leafIndex) } })
        newModel[leafIndex + 1].text = newModel[leafIndex + 1].text.slice(endLeafOffset, newModel[leafIndex + 1].text.length)

        newModel.splice(startLeafIndex + 1, 0, { text: newModel[startLeafIndex].text.slice(startLeafOffset, newModel[startLeafIndex].text.length), styles: { ...newModel[startLeafIndex].styles, [style]: !newModel[startLeafIndex].styles[style], advanced : advancedStyles(startLeafIndex) } })
        newModel[startLeafIndex].text = newModel[startLeafIndex].text.slice(0, startLeafOffset)

        newModel = filterEmptyLeaf(newModel)
    }
    else {
        const leaf = newModel[leafIndex]
        leaf.styles ??= {}

        newModel.splice(leafIndex + 1, 0, { text: leaf.text.slice(startLeafOffset, endLeafOffset), styles: { ...leaf.styles, [style]: !leaf.styles[style], advanced : advancedStyles(leafIndex) } })
        newModel.splice(leafIndex + 2, 0, { text: leaf.text.slice(endLeafOffset, leaf.text.length), styles: leaf.styles })
        leaf.text = leaf.text.slice(0, startLeafOffset)

        newModel = filterEmptyLeaf(newModel)
    }

    setModel(newModel)

    return
}
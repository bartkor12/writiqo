import { compressSync, decompressSync, strFromU8, strToU8 } from "fflate";
import { modelStore } from "./stores";

export function delay(delay: number) {
    return new Promise(res => setTimeout(res, delay));
}

export function filterEmptyLeaf(array: Leaf[]) {

    let write = 0

    for (let read = 0; read < array.length; read++) {
        const leaf = array[read];

        if (leaf.text !== "" || leaf.styles?.image) {
            array[write++] = leaf
        }
    }
    array.length = write
}

export function decompressModel(model: string, version: number) {
    if (version != 1) { console.warn("wrong file version, can't import"); return }

    const bytes = Uint8Array.from(atob(model), c => c.charCodeAt(0));
    const original = JSON.parse(strFromU8(decompressSync(bytes)));
    modelStore.getState().setModel(original)
}

export function compressModel() {
    const model = modelStore.getState().model
    return btoa(String.fromCharCode(...compressSync(strToU8(JSON.stringify(model)))))
}


//! IMPORTANT, TOP PRIORITY! replace removeEmpty entirely by a mutating normalizeModel function for code cleanliness and performance
export function normalizeModel(newModel: Leaf[]): [number] {

    // old
    const changedModel: Leaf[] = []
    let caretPositionShift = 0

    for (let i = 0; i < newModel.length; i++) {
        const leaf = newModel[i];

        if (leaf.text == "\n\u200B") {
            changedModel.push(leaf)
            continue
        }

        if (leaf.text == "\u200B" && i > 0 && newModel[i - 1]?.styles?.image) {
            changedModel.push(leaf)
            continue
        }

        if (newModel[i - 1]?.styles?.image && !leaf.text.startsWith("\u200B")) {
            changedModel.push({ text: "\u200B" })
        }

        leaf.text = leaf.text.replace(/^\u200B+/, "")

        changedModel.push(leaf)
    }

    // new
    let write = 0

    for (let read = 0; read < newModel.length; read++) {
        const leaf = newModel[read]

        if (leaf.text == "\n\u200B" || (leaf.text == "\u200B" && read > 0 && newModel[read - 1]?.styles?.image)) {
            newModel[write++] = leaf
            continue
        }

        if (newModel[read - 1]?.styles?.image && !leaf.text.startsWith("\u200B")) {
            newModel[write++] = { text: "\u200B" }
        }

        leaf.text = leaf.text.replace(/^\u200B+/, "")

        newModel[write++] = leaf
    }

    newModel.length = write

    filterEmptyLeaf(changedModel)

    // fixes enter key
    for (let i = 0; i < newModel.length; i++) {
        const leaf = newModel[i]

        if (i + 1 < newModel.length && leaf.text == "\n") {

            if (newModel[i + 1].text == '\u200B') {
                i += 2
            }
            else {
                leaf.text = "\n\u200B"
                caretPositionShift += 1
            }
        }

        if (i > newModel.length) return

        if (i > 0 && i < newModel.length - 1) {
            leaf.text = leaf.text.replace(/^\u2060+/, "")
        }
    }

    return [caretPositionShift]
}
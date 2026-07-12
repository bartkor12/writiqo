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


export function normalizeModel(newModel: Leaf[]): [number] {
    let caretPositionShift = 0
    let write = 0
    let previousLeafWasImage = false

    for (let read = 0; read < newModel.length; read++) {
        const leaf = newModel[read]

        if (read + 1 < newModel.length && leaf.text == "\n") {
            if (newModel[read + 1].text == '\uFEFF') {
                read++
            }
            else {
                leaf.text = "\n\uFEFF"
                // newModel[write++] = leaf
                caretPositionShift += 1
            }
            continue
        }

        if (read > 0 && read < newModel.length - 1) {
            leaf.text = leaf.text.replace(/^\u2060+/, "")
        }   

        if (read + 1 < newModel.length && newModel[read+1].styles == leaf.styles && leaf.text != "\n\uFEFF" && newModel[read+1].text != "\n\uFEFF") {
            leaf.text += newModel[read + 1].text
            read++
        }
        
        if (leaf.text == "\n\uFEFF" || (leaf.text == "\uFEFF" && previousLeafWasImage)) { // if issues arise readd read > 0
            newModel[write++] = leaf
            previousLeafWasImage = !!leaf.styles?.image
            continue
        }
        
        if (previousLeafWasImage && !leaf.text.startsWith("\uFEFF")) {
            newModel[write++] = { text: "\uFEFF" }
        }
        
        leaf.text = leaf.text.replace(/^\uFEFF+/, "")
        
        newModel[write++] = leaf
        previousLeafWasImage = !!leaf.styles?.image
    }

    newModel.length = write

    filterEmptyLeaf(newModel)

    // ? if enter breaks, uncomment or revert changes to this 
    // for (let i = 0; i < newModel.length; i++) {
    //     const leaf = newModel[i]

    //     if (i + 1 < newModel.length && leaf.text == "\n") {

    //         if (newModel[i + 1].text == '\uFEFF') {
    //             i += 2
    //         }
    //         else {
    //             leaf.text = "\n\uFEFF"
    //             caretPositionShift += 1
    //         }
    //     }

    //     if (i > newModel.length) continue

    //     if (i > 0 && i < newModel.length - 1) {
    //         leaf.text = leaf.text.replace(/^\u2060+/, "")
    //     }
    // }

    return [caretPositionShift]
}
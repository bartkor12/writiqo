import { compressSync, decompressSync, strFromU8, strToU8 } from "fflate";
import { modelStore } from "./stores";

export function delay(delay: number) {
  return new Promise(res => setTimeout(res, delay));
}

export function filterEmptyLeaf(array: Leaf[]) {
  return array.filter(item => item.text !== "" || item.styles?.image)
}

export function decompressModel(model: string, version : number) {
  if (version != 1) { console.warn("wrong file version, can't import"); return }

  const bytes = Uint8Array.from(atob(model), c => c.charCodeAt(0));
  const original = JSON.parse(strFromU8(decompressSync(bytes)));
  modelStore.getState().setModel(original)
}

export function compressModel() {
  const model = modelStore.getState().model
  return btoa(String.fromCharCode(...compressSync(strToU8(JSON.stringify(model)))))
}
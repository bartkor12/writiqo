import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Editor from './Editor'

export const globalData = {
  activeTool: "type"
}

export function delay(delay: number) {
  return new Promise(res => setTimeout(res, delay));
}

export function filterEmptyLeaf(array: Leaf[]) {
  return array.filter(item => item.text !== "" || item.styles?.image)
}

const root = document.getElementById('root')

if (root) {
  createRoot(root).render(
    <StrictMode>
      <Editor />
    </StrictMode>,
  )
}
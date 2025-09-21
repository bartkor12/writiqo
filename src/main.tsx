import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Editor from './Editor'

export var globalData = {
  activeTool: "type"
}

export function setBlockRect(props: any, rect: DOMRect) {
  props.setContent((prev: Array<Block>) => {
    return prev.map(block => {
      return block.id === props.id ? { ...block, rect } : block
    })
  })
}

export function delay(delay: number) {
  return new Promise(res => setTimeout(res, delay));
}



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Editor />
  </StrictMode>,
)

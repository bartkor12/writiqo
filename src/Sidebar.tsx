import { useRef, useState } from 'react'
import './App.css'
import {delay} from './utils/general'
import { LazySvg } from './lazy-svg.tsx'
// ? drawing could be possible future feature, for now releasing and maintaining the website is more important
const tools = [
  "write",
  // "brush"
]

export default function Sidebar() {
  const mousedown = useRef(false)
  const sidebar = useRef<HTMLDivElement>(null!)
  const [sliderX, setSliderX] = useState(0)
  const [mousedownOffset, setMousedownOffset] = useState(0)
  const returnPos = useRef(0)
  const mouseLeaveFiring = useRef(false)
  const [activeTools, setActiveTools] = useState<Array<boolean>>(() => tools.map((_, index) => index === 0))

  function moveSlider(e: React.MouseEvent<HTMLDivElement>) {
    if (mousedown.current == true) {

      const length = sidebar.current.getBoundingClientRect().width
      const mouseX = e.clientX
      const newX = Math.max(-length, Math.min(mouseX - mousedownOffset, 0))

      setSliderX(newX)
    }
  }

  async function mouseLeave() {
    if (mouseLeaveFiring.current) return

    mouseLeaveFiring.current = true
    mousedown.current = false

    console.log(sliderX)

    if (sliderX > -90 && returnPos.current == -90) {
      returnPos.current = 0
    }
    else
      if (sliderX < -10 && returnPos.current == 0) {
        returnPos.current = -90
      }

    for (let index = 0; index < 200; index++) {
      if (mousedown.current == false) {
        setSliderX(prev => prev + Math.sin(index / 100) * (returnPos.current - prev))
        await delay(15)
      }
    }

    mouseLeaveFiring.current = false
  }

  return (
    <div id='sidebar'
      ref={sidebar}
      onMouseDown={e => { mousedown.current = true; setMousedownOffset(e.clientX - sidebar.current.getBoundingClientRect().left) }}
      onMouseUp={mouseLeave}
      onMouseMove={moveSlider}
      onMouseLeave={mouseLeave}
      style={{ left: sliderX }}
    >
      {tools.map((name,index) => {
        const toolDefault = getComputedStyle(document.documentElement).getPropertyValue("--tool-default")
        const toolActive = getComputedStyle(document.documentElement).getPropertyValue("--tool-active")
        const bodyDull = getComputedStyle(document.documentElement).getPropertyValue("--body-dull")
        const body = getComputedStyle(document.documentElement).getPropertyValue("--body")

        function onClick() {
          setActiveTools(tools.map(() => false))
          setActiveTools(prev => {
            const copy = [...prev]
            copy[index] = true
            return copy 
          })
        }

        return <LazySvg
          name={name}
          fill={activeTools[index] ? body : bodyDull}
          style={{backgroundColor : activeTools[index] ? toolActive : toolDefault}}
          className={`icon tool`} onClick={onClick}
          key={index}
        />
      })}
    </div>
  )
}

import { useState, useRef, useEffect, type CSSProperties } from "react"
import createFuzzySearch from '@nozbe/microfuzz'
import { v4 as uuid4 } from "uuid"
import Format from "./Format";
import { RgbaColorPicker, type RgbaColor } from "react-colorful";

function pressFlash(el: HTMLElement) {
    el.classList.remove("press-flash")
    void el.clientHeight;
    el.classList.add("press-flash")
}

interface RibbonTypes {
    model: Leaf[],
    setModel: React.Dispatch<React.SetStateAction<Leaf[]>>
}

export default function Ribbon({model,setModel} : RibbonTypes) {
    return (
        <div id="ribbon">
            <div style={{display : "flex", flexDirection : "column", gap : 5}}>
                <span className="descriptor">Text Modifications</span>
                <div style={{display : "flex", gap: 5}}>
                    <ColorPickerButton src={"format_color_text.svg"} style="color" model={model} setModel={setModel} />
                    <div className="formatContainer formatButtonContainer">
                        <FormatButton model={model} setModel={setModel} style="bold" />
                        <FormatButton model={model} setModel={setModel} style="strikethrough" />
                        <FormatButton model={model} setModel={setModel} style="overline" />
                        <FormatButton model={model} setModel={setModel} style="underline" />
                    </div>
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                    <ColorPickerButton src={"format_color_fill.svg"} style="backgroundColor" model={model} setModel={setModel} />
                    <FormatSlider model={model} setModel={setModel} style="letterSpacing" type="horizontal" unit="%" min={0} max={100} sensitivity={1} />
                    <div className="formatContainer formatButtonContainer">
                        <FormatButton model={model} setModel={setModel} style="list" />
                    </div>
                </div>
            </div>
            <div className="ribbonSpacer" />
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span className="descriptor">Font Options</span>
                <FontDropdownContainer model={model} setModel={setModel}/>
                <div style={{display: "flex", gap: 18}}>
                    <FormatSlider model={model} setModel={setModel} style="fontSize" type="vertical" unit="px" min={0} max={150} sensitivity={1} />
                    <div className="formatContainer formatButtonContainer">
                        <FormatButton model={model} setModel={setModel} style="align_left" />
                        <FormatButton model={model} setModel={setModel} style="align_right" />
                        <FormatButton model={model} setModel={setModel} style="align_justify" />
                        <FormatButton model={model} setModel={setModel} style="align_center" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function FontDropdownContainer({ model, setModel }: {
    model: Leaf[],
    setModel: React.Dispatch<React.SetStateAction<Leaf[]>>,
}) {
    const [fontsToDisplay, setFontsToDisplay] = useState<string[]>()
    const fontInputRef = useRef<HTMLInputElement>(null)
    const chosenFontText = useRef<string>("")
    const defaultFonts: string[] = [
        "Arial",
        "Verdana",
        "Helvetica",
        "Tahoma",
        "Trebuchet MS",
        "Times New Roman",
        "Georgia",
        "Garamond",
        "Courier New",
        "Lucida Console",
        "Lucida Sans Unicode",
        "Palatino Linotype",
        "Segoe UI",
        "Impact",
        "Comic Sans MS",
        "Arial Black",
        "System-ui",
        "Sans-serif",
        "Serif",
        "Monospace",
        "Cursive",
        "Fantasy"
    ];

    function fontDropdownInput(e: React.ChangeEvent<HTMLInputElement>) {
        const text = e.target.value
        const fuzzy = createFuzzySearch(defaultFonts)
        setFontsToDisplay(fuzzy(text).map(item => item.item).splice(0, 5))
    }

    function fontDropdownKeydown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" && fontsToDisplay && fontsToDisplay.length > 0 && fontInputRef.current) {
            chosenFontText.current = fontsToDisplay[0]
            fontInputRef.current.value = chosenFontText.current
            setFontsToDisplay([])
        }
    }

    function fontButtonClick(e: React.MouseEvent<HTMLButtonElement>) {
        if (!fontInputRef.current) return
        chosenFontText.current = e.currentTarget.textContent ?? ""
        fontInputRef.current.value = chosenFontText.current
        setFontsToDisplay([])
    }

    function fontDropdownClick(e: React.MouseEvent<HTMLDivElement>) {
        if (e.ctrlKey === true && e.button === 0) {

            Format({
                model,
                setModel,
                style: "none",
                advanced: { property: "fontFamily", value: chosenFontText.current, overwrite: true }
            })

            pressFlash(e.currentTarget)
        }
    }

    return (
        <div className="fontDropdownContainer formatContainer" onClick={fontDropdownClick}>
            <div className="overlaySvg">
                <input type="text" onInput={fontDropdownInput} onKeyDown={fontDropdownKeydown} ref={fontInputRef} />
                <img src="arrow_down.svg" alt="" />
            </div>
            <div className="fontDropdown">
                {fontsToDisplay?.map(item => {
                    return <button key={uuid4()} onClick={fontButtonClick}>{item}</button>
                })}
            </div>
        </div>
    )
}

function ColorPickerButton({ src, model, setModel, style }: {
    src: string,
    model: Leaf[],
    setModel: React.Dispatch<React.SetStateAction<Leaf[]>>,
    style : keyof CSSProperties
}) {
    const [showPicker, setShowPicker] = useState<boolean>(false)
    const [coordinates, setCoordinates] = useState<{ x: number, y: number }>({ x: 0, y: 0 })
    const [color, setColor] = useState<RgbaColor>({ r: 165, g: 180, b: 252, a: 1 })
    const colorPicker = useRef<HTMLDivElement>(null)

    function onMouseDown(e : React.MouseEvent<HTMLDivElement, MouseEvent>) {
        e.stopPropagation()
        setShowPicker(true)
        setCoordinates({ x: e.clientX, y: e.clientY })
    }

    function onChange(newColor : RgbaColor) {
        setColor(newColor)

        Format({
            model,
            setModel,
            style : "none",
            advanced : {"property" : style, "value" : `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`, overwrite : true},
        })
    }

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (colorPicker.current && !colorPicker.current.contains(event.target as Node)) {
                setShowPicker(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    return (
        <div style={{display : "flex"}} className="colorPicker">
            <img src={src} alt="" onClick={() => onChange(color)} />
            <div className="colorPickerColor" style={{ backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})` }} onMouseDown={onMouseDown}></div>
            {showPicker && (
                <div style={{ zIndex: 2, position: "absolute", top: coordinates.y, left: coordinates.x }} ref={colorPicker}>
                    <RgbaColorPicker color={color} onChange={onChange} />
                </div>
            )}
        </div>
    )
}

function FormatButton({model,setModel,style} : FormatTypes) {

    function onClick() {
        Format({
            model,
            setModel,
            style
        })
    }

    return (
        <button className="formatButton" onClick={onClick} >
            <img src={`format_${style}.svg`} alt="" />
        </button>
    )
}

function FormatSlider({model,setModel,style,type,unit,min,max,sensitivity} : {
    model: Leaf[],
    setModel: React.Dispatch<React.SetStateAction<Leaf[]>>,
    style : keyof CSSProperties,
    type : "horizontal" | "vertical",
    unit : "%" | "px",
    min : number,
    max : number,
    sensitivity : number
}) {
    const [value,setValue] = useState<number>(0)
    const dragging = useRef<boolean>(false)
    const sliderStart = useRef<number>(0)
    const prevSliderPosition = useRef<number>(0)
    const sliderIncrementSpeed = useRef<number>(0)

    function onClick() {        
        Format({
            model,
            setModel,
            style : "none",
            advanced: { "property": style, value, "overwrite": true }
        })
    }

    function updateValue(newValue : number) {
        setValue(Math.max(min,Math.min(newValue,max)))

        Format({
            model,
            setModel,
            style: "none",
            advanced: { "property": style, value, "overwrite": true },
        })
    }

    function fontSizeMouseMove(e: React.MouseEvent<HTMLInputElement>) {
        if (!dragging.current) return
        e.currentTarget.readOnly = true;
        window.getSelection()?.removeAllRanges()

        const width = e.currentTarget.clientWidth

        if (Math.abs(prevSliderPosition.current) > Math.abs((e.clientX - sliderStart.current) / width)) {
            sliderStart.current = e.clientX
        }

        const sliderPosition = (e.clientX - sliderStart.current) / width

        if (sliderIncrementSpeed.current >= sensitivity) {
            updateValue(value + (sliderPosition > 0 ? 1 : -1))
            sliderIncrementSpeed.current = 0
        }
        else {
            sliderIncrementSpeed.current += 1
        }
        prevSliderPosition.current = sliderPosition
    }

    return (
        <div style={{ display: "flex", position: "relative" }} className="formatSlider formatContainer">
            {type == "horizontal" &&
                <img onClick={onClick} src="format_letter_spacing.svg" alt="" />
            }
            <input type="number" value={value}
                onInput={e => updateValue(Number(e.currentTarget.value))}
                onMouseDown={e => {dragging.current = true; sliderStart.current = e.clientX; updateValue(value) }} //; animateSlider(1)
                onMouseUp={e => { dragging.current = false; e.currentTarget.readOnly = false }} //; animateSlider(0)
                onMouseLeave={e => { dragging.current = false; e.currentTarget.readOnly = false }} //; animateSlider(0)
                onMouseMove={fontSizeMouseMove}
            />
            <span>{unit}</span>
            {type == "vertical" &&
                <div className="verticalSliderSpins">
                    <img onClick={() => updateValue(value + 1)} src="spin_arrow_up.svg" alt="" />
                    <img onClick={() => updateValue(value - 1)} src="spin_arrow_down.svg" alt="" />
                </div>
            }
        </div>
    )
}
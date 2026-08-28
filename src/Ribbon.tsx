import { useState, useRef, useEffect, type CSSProperties, type ReactNode } from "react"
import createFuzzySearch from '@nozbe/microfuzz'
import Format from "./Format";
import { RgbaColorPicker, type RgbaColor } from "react-colorful";
import Swal from "sweetalert2"
import LoginButton from "./LoginButton";
import { supabase } from "./supabase";
import { useNavigate } from "react-router";
import { compressModel, decompressModel } from "./utils/general";
import { authStore } from "./utils/stores";

function pressFlash(el: HTMLElement) {
    el.classList.remove("press-flash")
    void el.clientHeight;
    el.classList.add("press-flash")
}

function Dropdown({ children, id }: { children: ReactNode, id: string }) {
    let dropdownClicked = false
    const dropdownRef = useRef<HTMLDivElement>(null)

    function dropdownClick() {
        if (!dropdownRef.current) return

        dropdownRef.current.style.display = dropdownClicked ? "flex" : "none"
        dropdownClicked = !dropdownClicked
    }

    return (
        <div id={id}>
            <button className="menubarButton" onClick={dropdownClick}>
                <span>File</span>
            </button>
            <div className="dropdownContent" ref={dropdownRef}>
                {children}
            </div>
        </div>
    )
}

function Print() {
    return (
        <button onClick={() => window.print()}>Print</button>
    )
}

function Export({ cloud }: { cloud: boolean }) {
    const isLoggedIn = authStore(s => s.isLoggedIn)
    const navigate = useNavigate()

    function exportModel() {

        if (cloud && !isLoggedIn) {
            navigate("/login")
            return
        }

        Swal.fire({
            title: "File name",
            input: "text",
            showCancelButton: true,
            confirmButtonText: "Enter",
            showLoaderOnConfirm: true,
            preConfirm: async (fileName) => {
                if (fileName.length > 20) {
                    Swal.showValidationMessage('Name must be 20 characters or less');
                    return false;
                }
                const modelForExport: ExportedModel = {
                    "name": fileName,
                    "version": 1,
                    "word_count": document.getElementById("textInputDiv")?.textContent?.length ?? 0,
                    summary: document.getElementById("textInputDiv")?.textContent?.slice(0, 30) ?? "",
                    model: compressModel()
                }

                if (cloud) {
                    const { error } = await supabase
                        .from("saves")
                        .insert({
                            ...modelForExport
                        })
                    // if (error) throw new Error(error.message)
                    if (error) {
                        Swal.showValidationMessage('Name must be 20 characters or less');
                        return false;
                    }
                }
                else {
                    const blob = new Blob([JSON.stringify(modelForExport)], { type: "application/json" })
                    const href = URL.createObjectURL(blob)
                    const link = document.createElement("a")
                    link.href = href

                    link.download = fileName + ".writiqo"

                    document.body.appendChild(link)
                    link.click()

                    document.body.removeChild(link)
                    URL.revokeObjectURL(href)
                }
            },
            allowOutsideClick: () => !Swal.isLoading()
        }).then((result) => {
            if (result.isConfirmed) Swal.fire({
                title: "Saved",
                icon: "success",
                iconColor: "#a5b4fc"
            })
        })
    }

    return (
        <button onClick={exportModel}>{cloud ? "Cloud Save" : "Export"}</button>
    )
}

function Import({ cloud }: { cloud: boolean }) {
    const isLoggedIn = authStore(s => s.isLoggedIn)
    const navigate = useNavigate()

    function importModel() {

        if (cloud && !isLoggedIn) {
            navigate("/login")
            return
        }
        if (cloud) {
            navigate("/saves")
            return
        }

        const fileInput: HTMLInputElement = document.createElement("input")
        fileInput.type = "file"

        fileInput.onchange = () => {
            if (!fileInput.files) return
            const file = fileInput.files[0]

            if (!(file.name.split(".")[1] == "writiqo")) return
            const fileReader = new FileReader()
            fileReader.readAsText(file)

            fileReader.onload = readerEvent => {
                if (!readerEvent.target) return
                const content = readerEvent.target.result?.toString()

                if (!content) return

                const importedModel: ExportedModel = JSON.parse(content)

                decompressModel(importedModel.model, importedModel.version)
            }
        }

        fileInput.click()
    }

    return (
        <button onClick={importModel}>{cloud ? "Cloud Open" : "Import"}</button>
    )
}

export default function Ribbon() {
    return (<div id="topBarWrapper">
        <div id="menubar">
            <Dropdown id="fileDropdown">
                <Print />
                <Export cloud={false} />
                <Import cloud={false} />
                <Export cloud={true} />
                <Import cloud={true} />
            </Dropdown>
        </div>
        <div id="ribbonWrapper">
            <div id="ribbon">
                <img src="/writiqo_inkscape.svg" className='icon' onMouseDown={e => e.preventDefault()} style={{marginRight : 60}} />
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <span className="descriptor">Text Modifications</span>
                    <div style={{ display: "flex", gap: 5 }}>
                        <ColorPickerButton src={"format_color_text.svg"} style="color" />
                        <div className="formatContainer formatButtonContainer">
                            <FormatButton style="bold" />
                            <FormatButton style="strikethrough" />
                            <FormatButton style="overline" />
                            <FormatButton style="underline" />
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 5 }}>
                        <ColorPickerButton src={"format_color_fill.svg"} style="backgroundColor" />
                        <FormatSlider style="letterSpacing" type="horizontal" unit="%" min={0} max={100} sensitivity={1} />
                        <div className="formatContainer formatButtonContainer">
                            <FormatButton style="list" />
                        </div>
                    </div>
                </div>
                <div className="ribbonSpacer" />
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <span className="descriptor">Font Options</span>
                    <FontDropdownContainer />
                    <div style={{ display: "flex", gap: 18 }}>
                        <FormatSlider style="fontSize" type="vertical" unit="px" min={0} max={150} sensitivity={1} />
                        <div className="formatContainer formatButtonContainer">
                            <FormatButton style="none" advanced={{ property: "textAlign", value: "left", overwrite: true }} />
                            <FormatButton style="none" advanced={{ property: "textAlign", value: "right", overwrite: true }} />
                            <FormatButton style="none" advanced={{ property: "textAlign", value: "justify", overwrite: true }} />
                            <FormatButton style="none" advanced={{ property: "textAlign", value: "center", overwrite: true }} />
                        </div>
                    </div>
                </div>
            </div>
            <div id="rightRibbon">
                <LoginButton />
            </div>
        </div>
    </div>
    )
}

function FontDropdownContainer() {
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

    function fontDropdownInput(e: React.SyntheticEvent<HTMLInputElement>) {
        const text = e.currentTarget.value
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

    function fontDropdownClick(e: React.MouseEvent<HTMLButtonElement>) {
        Format({
            style: "none",
            advanced: { property: "fontFamily", value: chosenFontText.current, overwrite: true }
        })

        pressFlash(e.currentTarget)
    }

    return (
        <div className="fontDropdownContainer formatContainer">
            <div className="overlaySvg">
                <input type="text" onInput={fontDropdownInput} onKeyDown={fontDropdownKeydown} ref={fontInputRef} />
                {/* <img src="arrow_down.svg" alt="" /> */}
                <button className="formatButton" onClick={fontDropdownClick}>
                    <img src="/checkmark.svg" alt="" />
                </button>
            </div>
            <div className="fontDropdown">
                {fontsToDisplay?.map(item => {
                    return <button key={crypto.randomUUID()} onClick={fontButtonClick}>{item}</button>
                })}
            </div>
        </div>
    )
}

function ColorPickerButton({ src, style }: {
    src: string,
    style: keyof CSSProperties
}) {
    const [showPicker, setShowPicker] = useState<boolean>(false)
    const [coordinates, setCoordinates] = useState<{ x: number, y: number }>({ x: 0, y: 0 })
    const [color, setColor] = useState<RgbaColor>({ r: 165, g: 180, b: 252, a: 1 })
    const colorPicker = useRef<HTMLDivElement>(null)

    function onMouseDown(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        e.stopPropagation()
        setShowPicker(true)
        setCoordinates({ x: e.clientX, y: e.clientY })
    }

    function onChange(newColor: RgbaColor) {
        setColor(newColor)

        Format({
            style: "none",
            advanced: { "property": style, "value": `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`, overwrite: true },
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
        <div style={{ display: "flex" }} className="colorPicker">
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

function FormatButton({ style, advanced }: FormatTypes) {
    const name = style == "none" ? "align_" + advanced!.value : style

    function onClick() {
        Format({
            style,
            advanced
        })
    }

    return (
        <button className="formatButton" onClick={onClick} id={name} >
            <img src={`format_${name}.svg`} alt="" />
        </button>
    )
}

function FormatSlider({ style, type, unit, min, max, sensitivity }: {
    style: keyof CSSProperties,
    type: "horizontal" | "vertical",
    unit: "%" | "px",
    min: number,
    max: number,
    sensitivity: number
}) {
    const [value, setValue] = useState<number>(0)
    const dragging = useRef<boolean>(false)
    const sliderStart = useRef<number>(0)
    const prevSliderPosition = useRef<number>(0)
    const sliderIncrementSpeed = useRef<number>(0)

    function onClick() {
        Format({
            style: "none",
            advanced: { "property": style, value, "overwrite": true }
        })
    }

    function updateValue(newValue: number) {
        setValue(Math.max(min, Math.min(newValue, max)))

        Format({
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
        <div onLoad={() => {if (style == "fontSize" ) setValue(32)}} style={{ display: "flex", position: "relative" }} className="formatSlider formatContainer">
            {type == "horizontal" &&
                <img onClick={onClick} src="/format_letter_spacing.svg" alt="" />
            }
            <input type="number" value={value}
                onInput={e => updateValue(Number(e.currentTarget.value))}
                onMouseDown={e => { dragging.current = true; sliderStart.current = e.clientX; updateValue(value) }} //; animateSlider(1)
                onMouseUp={e => { dragging.current = false; e.currentTarget.readOnly = false }} //; animateSlider(0)
                onMouseLeave={e => { dragging.current = false; e.currentTarget.readOnly = false }} //; animateSlider(0)
                onMouseMove={fontSizeMouseMove}
            />
            <span>{unit}</span>
            {type == "vertical" &&
                <div className="verticalSliderSpins">
                    <img onClick={() => updateValue(value + 1)} src="/spin_arrow_up.svg" alt="" />
                    <img onClick={() => updateValue(value - 1)} src="/spin_arrow_down.svg" alt="" />
                </div>
            }
        </div>
    )
}
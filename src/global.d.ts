import type { CSSProperties } from "react";

export { }

declare global {
    type Block = {
        id: string;
        type: "Paragraph" | "Image";
        rect?: DOMRect; blockContent?: string;
        src?: string
    };
    type Leaf = {
        text : string,
        styles? : {
            advanced? : CSSProperties,
            none? : boolean
            bold? : boolean,
            italic? : boolean,
            underline? : boolean,
            overline? : boolean,
        }
    };
    interface FormatTypes {
        model: Leaf[],
        setModel: React.Dispatch<React.SetStateAction<Leaf[]>>,
        style: "italic" | "underline" | "bold" | "none" | "strikethrough" | "overline" 
        | "list" | "align_left" | "align_center" | "align_right" | "align_justify",
        advanced?: { property: keyof CSSProperties, value: any, overwrite : boolean } | undefined,
    }
}
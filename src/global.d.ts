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
            strikethrough? :boolean,
            list? :boolean
        }
    };
    interface FormatTypes {
        model: Leaf[],
        setModel: React.Dispatch<React.SetStateAction<Leaf[]>>,
        style: "italic" | "underline" | "bold" | "none" | "strikethrough" | "overline" 
        | "list",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        advanced?: { property: keyof CSSProperties, value: any, overwrite : boolean } | undefined,
    }
}
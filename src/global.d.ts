import type { CSSProperties } from "react";

export { }

declare global {
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
            list? :boolean,
            image? : string
        },
        id? : string
    };
    interface FormatTypes {
        style: "italic" | "underline" | "bold" | "none" | "strikethrough" | "overline" 
        | "list",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        advanced?: { property: keyof CSSProperties, value: any, overwrite: boolean } | undefined,
    };
    type ExportedModel = {
        name: string,
        version: number,
        created_at?: string,
        word_count: number
        model: string,
        summary : string
    }
}
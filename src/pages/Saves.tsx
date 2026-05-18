import { useEffect, useRef, useState } from "react"
import { supabase } from "../supabase"
import Swal from "sweetalert2"
import { useNavigate } from "react-router"
import { decompressModel } from "../utils/general"

type ImportedModel = {
    name: string,
    version: number,
    created_at: string,
    word_count: number,
    id: number,
    summary: string | null
}

export default function Saves() {
    const [saves, setSaves] = useState<ImportedModel[]>()

    useEffect(() => {
        async function fetchSaves() {
            const { data, error } = await supabase
                .from("saves")
                .select("name,version,created_at,word_count,id,summary")
                .order("created_at", { ascending: false })

            if (error) throw error
            setSaves(data)
        }
        fetchSaves()
    }, [])

    return (
        <div className="centerSavesDiv">
            <span className="savesTitle">Your saved documents</span>
            <div className="saves">
                {!saves ? (
                    <>
                    <LoadingCard />
                    <LoadingCard />
                    <LoadingCard />
                    <LoadingCard />
                    <LoadingCard />
                    <LoadingCard />
                    </>
                )
                : null
                }
                {saves?.map(save => (
                    <SaveCard metadata={save} key={save.id} />
                ))}
                <div className="savesSpacer"/>
            </div>
        </div>
    )
}

function timeAgo(date: string) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
    return `${Math.floor(seconds / 31536000)} years ago`;
}

function LoadingCard() {
    return (
        <div className="sc_load_root">
            <div className="sc_load_imgWrap">
                <div className="sc_load_imgSkeleton" />
            </div>

            <div className="sc_load_textBlock">
                <div className="sc_load_nameSkeleton" />
                <div className="sc_load_summarySkeleton" />
            </div>

            <div className="sc_load_metaBlock">
                <div className="sc_load_metaSkeletonA" />
                <div className="sc_load_metaSkeletonB" />
            </div>

            <div className="sc_load_menuSkeleton" />
        </div>
    )
}

function SaveCard({ metadata }: { metadata: ImportedModel }) {
    const [openMenu, setOpenMenu] = useState(false)
    const nameRef = useRef<HTMLSpanElement>(null)
    const saveCard = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()

    function onRename() {
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
                if (nameRef.current) nameRef.current.textContent = fileName
                const { error } = await supabase
                    .from("saves")
                    .update({ name: fileName })
                    .eq("id", metadata.id)

                if (error) throw error
            },
            allowOutsideClick: () => !Swal.isLoading()
        }).then((result) => {
            if (result.isConfirmed) Swal.fire({
                title: "Renamed",
                icon: "success",
                iconColor: "#a5b4fc"
            })
        })
    }

    function onDelete() {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel',
            iconColor: '#a5b4fc',
            cancelButtonColor: '',
            preConfirm: async () => {
                const { error } = await supabase
                    .from("saves")
                    .delete()
                    .eq("id", metadata.id)

                if (saveCard.current) saveCard.current.remove()

                if (error) throw error
            }
        }).then((result) => {
            if (result.isConfirmed) Swal.fire({
                title: "Deleted",
                icon: "success",
                iconColor: "#a5b4fc"
            })
        })
    }

    async function onOpen() {
        const { data, error } = await supabase
            .from("saves")
            .select("model,version")
            .eq("id", metadata.id)
            .single()

        if (error) throw error

        if (data) {
            decompressModel(data.model, data.version)
            navigate("/")
        }
    }

    return (
        <div className="saveCard" ref={saveCard}>
            <div className="saveCardImgWrapper" onClick={onOpen}>
                <img src="draft.svg" alt="" />
            </div>
            <div className="saveText" onClick={onOpen} >
                <span className="saveName" ref={nameRef}>{metadata.name}</span>
                <span className="saveSummary">{metadata.summary ?? ""}{(metadata.summary ?? "").length > 30 ? "..." : ""}</span>
            </div>
            <div className="saveMetadata">
                <span>{timeAgo(metadata.created_at)}</span>
                <span>{metadata.word_count} words</span>
            </div>
            <img src="menu.svg" alt="" className="saveMenu" onClick={() => setOpenMenu(!openMenu)} />
            <div className="saveDropdown" style={{ visibility: openMenu ? "visible" : "hidden" }}>
                <span onClick={onRename}>Rename</span>
                <span onClick={onDelete}>Delete</span>
            </div>
        </div>
    )
}
export default function Saves() {

    return (
        <div className="centerSavesDiv">
            <span className="savesTitle">Your saved documents</span>
            <div className="saves">
                <SaveCard />
                <SaveCard />
                <SaveCard />
                <SaveCard />
                <SaveCard />
            </div>
        </div>
    )
}

function SaveCard() {

    return (
        <div className="saveCard">
            <div className="saveCardImgWrapper">
                <img src="draft.svg" alt="" />
            </div>
            <div className="saveText">
                <span className="saveName">Document Name</span>
                <span className="saveSummary">Summary summary summary summary summary summary</span>
            </div>
            <div className="saveMetadata">
                <span>2 hours ago</span>
                <span>1000 words</span>
            </div>
        </div>
    )
}
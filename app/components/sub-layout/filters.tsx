'use client';
import Image from "next/image";
import S_Button from "../common/button"
import { useContext, useState } from "react"
import { TodoContext } from "../../third-provider";

const sort_data = [
    {
        text: "Recently Added",
        value: "recent"
    },
    {
        text: "Expiring Soon",
        value: "expire"
    },
    {
        text: "Selling Out Soon",
        value: "selling"
    },
    {
        text: "Price: Low To High",
        value: "price_l_h"
    },
    {
        text: "Price: High To Low",
        value: "price_h_l"
    },
    {
        text: "Flooe:Low To High",
        value: "flooe_l_h"
    },
    {
        text: "Flooe:High To Low",
        value: "flooe_h_l"
    },
]


export default function Filters() {
    const context = useContext(TodoContext);
    const [input, setInput] = useState();
    const [toggle, setToggle] = useState(false);

    const [dialogNum, setDialogNum] = useState(0);

    const onChange = (e) => {
        context.setSearchText(e.target.value);
        setInput(e.target.value);
    }
    return (
        <div className="filters">
            <div className="filters-buttons">
                <S_Button click={() => setDialogNum(0)} b_name="Featured" color={dialogNum == 0 ? "#FFFFFF4D" : "transparent"} border={dialogNum == 0 ? "none" : "1px solid #76ED97"} width="140px" height="42px" t_color="white" />
                <S_Button click={() => setDialogNum(1)} b_name="All Raffles" color={dialogNum == 1 ? "#FFFFFF4D" : "transparent"} border={dialogNum == 1 ? "none" : "1px solid #76ED97"} width="140px" height="42px" t_color="white" />
                <S_Button click={() => setDialogNum(2)} b_name="Past Raffles" color={dialogNum == 2 ? "#FFFFFF4D" : "transparent"} border={dialogNum == 2 ? "none" : "1px solid #76ED97"} width="140px" height="42px" t_color="white" />
            </div>
            <div className="filters-info">
                <input
                    className="search-input"
                    value={input}
                    placeholder="&#128269;Search"
                    onChange={onChange}
                />
                <Image
                    src="/images/filter.svg"
                    alt="Vercel Logo"
                    className="dark:invert"
                    sizes="100vw"
                    style={{
                        height: 'auto',
                    }}
                    width={44}
                    height={44}
                    onClick={() => { setToggle(!toggle) }}
                />
            </div>
            <div className={(toggle ? "show-animation-2 " : " ") + "filter"}>
                <div className="filter-icon">
                    <Image
                        src="/images/sollucky.svg"
                        alt="Vercel Logo"
                        className="dark:invert"
                        sizes="100vw"
                        style={{
                            width: '100%',
                            height: 'auto',
                        }}
                        width={218}
                        height={54}
                    />
                </div>
                <div className="close-button" onClick={() => { setToggle(!toggle) }}>
                    <Image
                        src="/images/close.svg"
                        alt="Vercel Logo"
                        className="dark:invert"
                        sizes="100vw"
                        style={{
                            width: '100%',
                            height: 'auto',
                        }}
                        width={55}
                        height={54}
                    />
                </div>
                <div className="filter-menu">
                    <div className="filter-title">Sort</div>
                    {
                        sort_data.map((e, i) => (<div key={i} onClick={() => { context.setFilter(e.value) }}>
                            {e.text}
                        </div>))
                    }
                    <div className="filter-title">Filter</div>
                    <div>
                        <div className="filter-item">
                            {context.tokenRaffle && <Image
                                src="/images/circle.svg"
                                alt="Vercel Logo"
                                className="dark:invert"
                                sizes="100vw"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                }}
                                width={55}
                                height={54}
                            />}</div>
                        <div onClick={() => { context.setTokenRaffle(!context.tokenRaffle) }}>&nbsp;Token Raffles</div></div>
                    <div>
                        <div className="filter-item">
                            {context.nftRaffle && <Image
                                src="/images/circle.svg"
                                alt="Vercel Logo"
                                className="dark:invert"
                                sizes="100vw"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                }}
                                width={55}
                                height={54}
                            />}</div>
                        <div onClick={() => { context.setNFTRaffle(!context.nftRaffle) }}>&nbsp;NFT Raffles</div></div>
                </div>
            </div>
        </div >
    )
}
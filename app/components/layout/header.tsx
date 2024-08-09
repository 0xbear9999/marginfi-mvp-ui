'use client';
import Image from "next/image";
import { WalletMultiButton, WalletModalButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import S_Button from "../common/button";
import { useEffect, useState } from "react";
import axios from "axios";
import { useContext } from "react";
import { TodoContext } from "../../third-provider";
import { useRouter } from "next/navigation";
import { getAddress } from "@/app/utils/util";

export default function Header() {
    const router = useRouter();
    const context = useContext(TodoContext);
    const { publicKey, connected } = useWallet();

    const showBalance = async () => {
        if (publicKey) {
            const address = publicKey.toBase58();
            const url = 'https://api.devnet.solana.com';
            const headers = {
                'Content-Type': 'application/json',
            };

            const postData = {
                "jsonrpc": '2.0',
                "id": 1,
                "method": "getBalance",
                "params": [address]
            };

            axios.post(url, postData, { headers })
                .then(response => {
                    console.log('Response:', response.data);
                    context.setBalance(response.data.result.value);
                })
                .catch(error => {
                    console.error('Error:', error.message);
                });
        }
    }
    useEffect(() => {
        showBalance();
    }, [publicKey])
    return (
        <div className="header">
            <div onClick={() => { router.push("/") }}>
                <Image
                    src="/images/bear.webp"
                    alt="Vercel Logo"
                    className="dark:invert"
                    sizes="100vw"
                    style={{
                        width: '100px',
                        height: 'auto',
                    }}
                    width={218}
                    height={54}
                />
            </div>
            <div className="header-buttons">
                <WalletMultiButton>
                    {!connected ? "Connect Wallet" : getAddress(publicKey?.toBase58())}
                </WalletMultiButton>
            </div>            
        </div>
    )
}
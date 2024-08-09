'use client'

import {
    ConnectionProvider,
    WalletProvider,
} from "@solana/wallet-adapter-react";
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

import { clusterApiUrl, PublicKey } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

import React, { createContext, useState, useContext, useEffect } from "react";
interface BankData {
    vault_deposit: string;
    vault_liability: string;
    vault_fee: string;
    deposit_limit: bigint;
    borrow_limit: bigint;
    oracle_price: string;
    total_borrow: number;
    total_deposit: number;
    token_decimal: number;
}

interface TodoContextType {
    banks: BankData[];
    setBanks: React.Dispatch<React.SetStateAction<BankData[]>>;
  }
  
  const initializeValue: TodoContextType = {
    banks: [],
    setBanks: () => {},
  };
  
export const TodoContext = createContext<TodoContextType>(initializeValue);

import { useMemo } from "react";
import { initialize } from "next/dist/server/lib/render-server";
import { getAllData, getBanks } from "./solana/transaction";

import 'react-toastify/dist/ReactToastify.css';
import { getUsers } from "./api/user";

export default function ThirdProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const network = WalletAdapterNetwork.Mainnet;
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);
    const wallets = useMemo(
        () => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network })],
        [network]
    );

    //States
    const [banks, setBanks] = useState<any[]>([]);

    useEffect(() => {
    }, []);

    return (
        <TodoContext.Provider value={{ banks, setBanks }}>
            <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                        {children}
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </TodoContext.Provider >
    )
}
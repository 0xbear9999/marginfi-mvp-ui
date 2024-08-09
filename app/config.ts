import { PublicKey } from "@metaplex-foundation/js";

export const RPC_URL = "https://api.devnet.solana.com";

export const EMPTY_USER = "11111111111111111111111111111111";

export const PROGRAM_ID = "FJ3uHfHezA5aWZcuaMPq9hvVidnV4w8LxGEY7W1RRKfS";
export const MARGIN_GROUP = "2W9rPudFxKnnjvuQZM5PXA4xqkzCDtgADFqQsNi2XqDt";
export const ADMIN_WALLET = new PublicKey("84spPZ5P48hHURprjTZAaDGSMV6h3R6ivNeCyP7TugCc");
export const BANK_SIZE = 1864;
export const ACCOUNT_SIZE = 2312;
export const TOKENS = [
    {
        tokenName: "Solana",
        tokenSymbol: "SOL",
        tokenMint: "11111111111111111111111111111111",
        decimal: 9
    },
    {
        tokenName: "USD Coin",
        tokenSymbol: "USDC",
        tokenMint: "5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7",
        decimal: 2
    },
    {
        tokenName: "SOL",
        tokenSymbol: "SOL",
        tokenMint: "J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix",
        decimal: 2
    },
]

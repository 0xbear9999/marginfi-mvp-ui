import * as anchor from "@coral-xyz/anchor";
import {
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
} from '@solana/web3.js';
import { BN } from "@coral-xyz/anchor";
import { Marginfi } from "./bearfi";
const idl = require("./bearfi.json");
import { AccountMeta } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { solConnection } from "../utils/util";
import { RafflePool } from "../utils/type";
import { AnchorWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import {
    PROGRAM_ID,
    BANK_SIZE,
    EMPTY_USER,
    TOKENS,
    ACCOUNT_SIZE
} from "../config"
import { createTransaction } from "../api/transaction";
import { tokenProgram } from "@metaplex-foundation/js";

function wrappedI80F48ToFloat(uint8Array: any) {
    if (uint8Array.length !== 16) {
        throw new Error('Invalid WrappedI80F48 array length');
    }

    // Extract the integer part (80 bits) and the fractional part (48 bits)
    // JavaScript does not support native 80-bit integers, so we'll use BigInt
    let integerPart = BigInt(0);
    for (let i = 0; i < 10; i++) {
        integerPart = (integerPart << 8n) | BigInt(uint8Array[i]);
    }

    let fractionalPart = BigInt(0);
    for (let i = 10; i < 16; i++) {
        fractionalPart = (fractionalPart << 8n) | BigInt(uint8Array[i]);
    }

    // Convert the fractional part to a decimal
    const fractionalValue = Number(fractionalPart) / Math.pow(2, 48);

    // Combine integer and fractional parts
    const floatValue = Number(integerPart) + fractionalValue;

    return floatValue;
}
export const liquidateAccount = async (
    wallet: AnchorWallet,
    margin_group: PublicKey,
    margin_account: PublicKey,
    liab_margin_account: PublicKey,
    bank_pk: PublicKey,
    liabBank: PublicKey,
    amount: number,
    tokenProgram: PublicKey,
    remaining_accounts: AccountMeta[]
) => {
    let provider = new anchor.AnchorProvider(solConnection, wallet as anchor.Wallet, { skipPreflight: true })
    const program = new anchor.Program<Marginfi>(idl, provider);
    const txHash = await program.methods.lendingAccountLiquidate(new BN(amount)).accounts({
        marginfiGroup: margin_group,
        assetBank: bank_pk,
        liabBank: liabBank,
        liquidatorMarginfiAccount: margin_account,
        signer: wallet.publicKey,
        liquidateeMarginfiAccount: liab_margin_account,
        tokenProgram: tokenProgram,
    }).remainingAccounts(remaining_accounts).rpc();
    console.log(txHash);
}
export const repayAccount = async (
    wallet: AnchorWallet,
    margin_group: PublicKey,
    margin_account: PublicKey,
    token_program: PublicKey,
    bank_pk: PublicKey,
    amount: number,
    remaining_accounts: AccountMeta[]
) => {
    let provider = new anchor.AnchorProvider(solConnection, wallet as anchor.Wallet, { skipPreflight: true })
    const program = new anchor.Program<Marginfi>(idl, provider);
    const tokenAccount = await getAssociatedTokenAccount(wallet.publicKey, token_program);
    const txHash = await program.methods.lendingAccountRepay(new BN(amount), false).accounts({
        marginfiGroup: margin_group,
        marginfiAccount: margin_account,
        tokenProgram: TOKEN_PROGRAM_ID,
        bank: bank_pk,
        signer: wallet.publicKey,
        signerTokenAccount: tokenAccount,
    }).remainingAccounts(remaining_accounts).rpc();
    console.log(txHash);
}
export const borrowAccount = async (
    wallet: AnchorWallet,
    margin_group: PublicKey,
    margin_account: PublicKey,
    token_program: PublicKey,
    bank_pk: PublicKey,
    amount: number,
    remaining_accounts: AccountMeta[]
) => {

    let provider = new anchor.AnchorProvider(solConnection, wallet as anchor.Wallet, { skipPreflight: true })
    const program = new anchor.Program<Marginfi>(idl, provider);
    const tokenAccount = await getAssociatedTokenAccount(wallet.publicKey, token_program);
    const txHash = await program.methods.lendingAccountBorrow(new BN(amount)).accounts({
        marginfiGroup: margin_group,
        marginfiAccount: margin_account,
        tokenProgram: TOKEN_PROGRAM_ID,
        bank: bank_pk,
        signer: wallet.publicKey,
        destinationTokenAccount: tokenAccount,
    }).remainingAccounts(remaining_accounts).rpc();
    console.log(txHash);
}

export const withdrawAccount = async (
    wallet: AnchorWallet,
    margin_group: PublicKey,
    margin_account: PublicKey,
    token_program: PublicKey,
    bank_pk: PublicKey,
    amount: number,
    remaining_accounts: AccountMeta[]
) => {

    let provider = new anchor.AnchorProvider(solConnection, wallet as anchor.Wallet, { skipPreflight: true })
    const program = new anchor.Program<Marginfi>(idl, provider);
    const tokenAccount = await getAssociatedTokenAccount(wallet.publicKey, token_program);
    const txHash = await program.methods.lendingAccountWithdraw(new BN(amount), false).accounts({
        marginfiGroup: margin_group,
        marginfiAccount: new PublicKey(margin_account),
        tokenProgram: TOKEN_PROGRAM_ID,
        bank: bank_pk,
        signer: wallet.publicKey,
        destinationTokenAccount: tokenAccount,
    }).remainingAccounts(remaining_accounts).rpc();

    console.log(txHash);
}

export const depositAccount = async (
    wallet: AnchorWallet,
    margin_group: PublicKey,
    margin_account: PublicKey,
    token_program: PublicKey,
    bank_pk: PublicKey,
    amount: number,
) => {
    let provider = new anchor.AnchorProvider(solConnection, wallet as anchor.Wallet, { skipPreflight: true })
    const program = new anchor.Program<Marginfi>(idl, provider);
    const tokenAccount = await getAssociatedTokenAccount(wallet.publicKey, token_program);

    const txHash = await program.methods.lendingAccountDeposit(new BN(amount)).accounts({
        marginfiGroup: margin_group,
        marginfiAccount: margin_account,
        signer: wallet.publicKey,
        bank: bank_pk,
        signerTokenAccount: tokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
    }).rpc();
    console.log(txHash);
}
export const initAccount = async (
    wallet: AnchorWallet,
    margin_group: PublicKey
) => {
    let provider = new anchor.AnchorProvider(solConnection, wallet as anchor.Wallet, { skipPreflight: true })
    const program = new anchor.Program<Marginfi>(idl, provider);
    const margin_account = anchor.web3.Keypair.generate();
    const txHash = await program.methods.marginfiAccountInitialize().accounts({
        marginfiGroup: margin_group,
        marginfiAccount: margin_account.publicKey,
        authority: wallet.publicKey,
        feePayer: wallet.publicKey
    }).signers([margin_account]).rpc();
    console.log(txHash, margin_account.publicKey);
}

export const closeAccount = async (
    wallet: AnchorWallet,
    margin_account: PublicKey
) => {
    let provider = new anchor.AnchorProvider(solConnection, wallet as anchor.Wallet, { skipPreflight: true })
    const program = new anchor.Program<Marginfi>(idl, provider);
    const txHash = await program.methods.marginfiAccountClose().accounts({
        marginfiAccount: margin_account,
        authority: wallet.publicKey,
        feePayer: wallet.publicKey
    }).rpc();
    console.log(txHash);
}

export const closeBalance = async (
    wallet: AnchorWallet,
    margin_group: PublicKey,
    margin_account: PublicKey,
    bank_pk: PublicKey
) => {
    let provider = new anchor.AnchorProvider(solConnection, wallet as anchor.Wallet, { skipPreflight: true })
    const program = new anchor.Program<Marginfi>(idl, provider);
    const txHash = await program.methods.lendingAccountCloseBalance().accounts({
        marginfiGroup: margin_group,
        marginfiAccount: margin_account,
        signer: wallet.publicKey,
        bank: bank_pk,
    }).rpc();
    console.log(txHash);
}

export const getMarginAccount = async (
    authority: PublicKey,
    margin_group: PublicKey
) => {
    console.log(authority.toBase58())
    let cloneWindow: any = window;
    let provider = new anchor.AnchorProvider(solConnection, cloneWindow['solana'], anchor.AnchorProvider.defaultOptions())
    const program = new anchor.Program<Marginfi>(idl, provider);
    let marginAccounts = await solConnection.getProgramAccounts(
        program.programId,
        {
            filters: [
                {
                    dataSize: ACCOUNT_SIZE
                },
                {
                    memcmp: {
                        "offset": 8,
                        "bytes": margin_group.toBase58()
                    },
                },
                {
                    memcmp: {
                        "offset": 40,
                        "bytes": authority.toBase58()
                    },
                }
            ]
        }
    );
    //const marginAccount = marginAccounts.map(e => e.pubkey.toBase58() == margin_account.toBase58());
    let lendData: any = [];
    // const accounts = marginAccounts.filter(e => e.pubkey.toBase58() == margin_account.toBase58());
    if (!marginAccounts.length)
        return null;
    let account;
    if (marginAccounts[1] && marginAccounts[1].pubkey.toBase58() == "3kK9mTFnTUKn2pg2vNJc2mcNPFdaCgjQFJxUowJiUGw8")
        account = marginAccounts[1];
    else
        account = marginAccounts[0];

    const marginData = account.account.data;
    let offset = 72;
    while (1) {
        if (marginData[offset] == 0)
            break;
        let l_data = {
            bank_pk: new PublicKey(marginData.subarray(offset + 1, offset + 1 + 32)).toBase58(),
            asset_share: wrappedI80F48ToFloat(marginData.subarray(offset + 40, offset + 40 + 16).reverse()),
            lia_share: wrappedI80F48ToFloat(marginData.subarray(offset + 56, offset + 56 + 16).reverse()),
            fee_share: wrappedI80F48ToFloat(marginData.subarray(offset + 72, offset + 72 + 16).reverse()),
            last_update: marginData.readBigInt64LE(offset + 88)
        }
        lendData.push(l_data)
        offset += 104;
    }
    return { lendData, pubKey: account.pubkey.toBase58() };
}

export const getBanks = async (
    margin_group: PublicKey
) => {
    try {
        let cloneWindow: any = window;
        let provider = new anchor.AnchorProvider(solConnection, cloneWindow['solana'], anchor.AnchorProvider.defaultOptions())
        const program = new anchor.Program<Marginfi>(idl, provider);
        const banks = (await program.account.bank.all())
            .filter(e => {
                return e.account.group.toBase58() == margin_group.toBase58()
            });
        console.log(banks);
        let poolAccounts = await solConnection.getProgramAccounts(
            program.programId,
            {
                filters: [
                    {
                        dataSize: BANK_SIZE
                    },
                    {
                        memcmp: {
                            "offset": 8 + 32 + 1,
                            "bytes": margin_group.toBase58()
                        }
                    }
                ]
            }
        );
        // poolAccounts.map(e => console.log(new PublicKey(e.account.data.subarray(112, 112 + 32)).toBase58())) // vault deposit
        // poolAccounts.map(e => console.log(new PublicKey(e.account.data.subarray(146, 146 + 32)).toBase58())) // vault liablity
        // poolAccounts.map(e => console.log(new PublicKey(e.account.data.subarray(200, 200 + 32)).toBase58())) // vault fee        
        // poolAccounts.map(e => console.log(e.account.data.readBigInt64LE(360))) // deposit limit
        // poolAccounts.map(e => console.log(e.account.data.readBigInt64LE(776))) // borrow limit
        // 608 operational state
        // 609 oracle setup flag
        // poolAccounts.map(e => console.log(new PublicKey(e.account.data.subarray(610, 610 + 32)).toBase58())) // oracle price
        // poolAccounts.map(e => console.log(wrappedI80F48ToFloat(e.account.data.subarray(256, 256 + 16).reverse()))) // total borrow
        // poolAccounts.map(e => console.log(wrappedI80F48ToFloat(e.account.data.subarray(272, 272 + 16).reverse()))) // total deposit
        const data = poolAccounts.map(e => {
            return {
                bank_pk: e.pubkey,
                vault_deposit: new PublicKey(e.account.data.subarray(112, 112 + 32)).toBase58(),
                vault_liability: new PublicKey(e.account.data.subarray(146, 146 + 32)).toBase58(),
                vault_fee: new PublicKey(e.account.data.subarray(200, 200 + 32)).toBase58(),
                deposit_limit: e.account.data.readBigInt64LE(360),
                borrow_limit: e.account.data.readBigInt64LE(776),
                oracle_price: new PublicKey(e.account.data.subarray(610, 610 + 32)).toBase58(),
                total_borrow: wrappedI80F48ToFloat(e.account.data.subarray(256, 256 + 16).reverse()),
                total_deposit: wrappedI80F48ToFloat(e.account.data.subarray(272, 272 + 16).reverse()),
                token_mint: new PublicKey(e.account.data.subarray(8, 8 + 32)).toBase58(),
                token_decimal: e.account.data.readInt8(40)
            }
        })
        return data;
        // console.log(poolAccounts);
    } catch (error) {
        console.log(error);
    }
    return [];
}

const getAssociatedTokenAccount = async (ownerPubkey: PublicKey, mintPk: PublicKey): Promise<PublicKey> => {
    let associatedTokenAccountPubkey = (await PublicKey.findProgramAddressSync(
        [
            ownerPubkey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            mintPk.toBuffer(), // mint address
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    ))[0];
    return associatedTokenAccountPubkey;
}

export const getATokenAccountsNeedCreate = async (
    connection: anchor.web3.Connection,
    walletAddress: anchor.web3.PublicKey,
    owner: anchor.web3.PublicKey,
    nfts: anchor.web3.PublicKey[],
) => {
    let instructions = [], destinationAccounts = [];
    for (const mint of nfts) {
        const destinationPubkey = await getAssociatedTokenAccount(owner, mint);
        let response = await connection.getAccountInfo(destinationPubkey);
        if (!response) {
            const createATAIx = createAssociatedTokenAccountInstruction(
                destinationPubkey,
                walletAddress,
                owner,
                mint,
            );
            instructions.push(createATAIx);
        }
        destinationAccounts.push(destinationPubkey);
        // if (walletAddress != owner) {
        //     const userAccount = await getAssociatedTokenAccount(walletAddress, mint);
        //     response = await connection.getAccountInfo(userAccount);
        //     if (!response) {
        //         const createATAIx = createAssociatedTokenAccountInstruction(
        //             userAccount,
        //             walletAddress,
        //             owner,
        //             mint,
        //         );
        //         instructions.push(createATAIx);
        //     }
        // }
    }
    return {
        instructions,
        destinationAccounts,
    };
}

export const createAssociatedTokenAccountInstruction = (
    associatedTokenAddress: anchor.web3.PublicKey,
    payer: anchor.web3.PublicKey,
    walletAddress: anchor.web3.PublicKey,
    splTokenMintAddress: anchor.web3.PublicKey
) => {
    const keys = [
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
        { pubkey: walletAddress, isSigner: false, isWritable: false },
        { pubkey: splTokenMintAddress, isSigner: false, isWritable: false },
        {
            pubkey: anchor.web3.SystemProgram.programId,
            isSigner: false,
            isWritable: false,
        },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        {
            pubkey: anchor.web3.SYSVAR_RENT_PUBKEY,
            isSigner: false,
            isWritable: false,
        },
    ];
    return new anchor.web3.TransactionInstruction({
        keys,
        programId: ASSOCIATED_TOKEN_PROGRAM_ID,
        data: Buffer.from([]),
    });
}

'use client'
import Header from "../components/layout/header";
import Filters from "../components/sub-layout/filters";
import { useContext, useEffect, useState } from "react";
import { TodoContext } from "../third-provider";
import { initAccount, depositAccount, closeAccount, closeBalance, liquidateAccount, withdrawAccount, borrowAccount, getBanks, getMarginAccount, repayAccount } from "../solana/transaction";
import { PublicKey } from "@metaplex-foundation/js";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { solConnection } from "../utils/util";
import { Space, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { getPythProgramKeyForCluster, PythHttpClient, PythCluster, PriceData } from "@pythnetwork/client";
import { TOKENS } from "../config";
import { AccountMeta } from "@solana/web3.js";
import { getConfig, MarginfiAccountWrapper, MarginfiClient } from "@icesolution/marginfi-client-v2";
import { Wallet } from "@coral-xyz/anchor";

interface DataType {
  key: string;
  name: string;
  price: string;
  deposit: string;
  borrow: string;
  limit: string;
  bank_pk: string;
  token_mint: string;
  token_decimal: number;
}
const margin_group_pub = "CZs1Ysrwwt6pdV7Jt6iVDKKjwWVZa66FYTwRMrGCovk4";
export default function Home() {
  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <a>{text}</a>,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
    },
    {
      title: 'Total Deposit',
      dataIndex: 'deposit',
      key: 'deposit',
    },
    {
      title: 'Total Borrow',
      dataIndex: 'borrow',
      key: 'borrow',
    },
    {
      title: 'Limit',
      dataIndex: 'limit',
      key: 'limit',
    },
    {
      title: 'Action',
      key: 'action',
      render: (data, record) => {
        return (
          <Space size="middle">
            <a onClick={() => handleAction('Supply', record)}>Supply</a>
            <a onClick={() => handleAction('Repay', data)}>Repay</a>
            <a onClick={() => handleAction('Borrow', data)}>Borrow</a>
            <a onClick={() => handleAction('Withdraw', data)}>Withdraw</a>
            <a onClick={() => handleAction('Liquidate', data)}>Liquidate</a>
            <a onClick={() => handleAction('Close', data)}>Close</a>
          </Space>
        );
      },
    },
  ];
  const wallet = useAnchorWallet();
  const [data, setData] = useState<DataType[]>([]);
  const [pubKey, setPubKey] = useState<string>("");
  const [banks, setBanks] = useState<any[]>([]);
  const [lendData, setLendData] = useState<any[]>([]);
  const [actionAmount, setActionAmount] = useState<number>(0);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActionAmount(Number(e.target.value));
  };


  const func = async () => {

    // const account = MarginfiAccountWrapper.fetch(wallet, solConnection);
    // const accounts = await account.getAllMarginfiAccountAddresses();
    // console.log(accounts);    
    const config = getConfig("dev");
    config.groupPk = new PublicKey("CZs1Ysrwwt6pdV7Jt6iVDKKjwWVZa66FYTwRMrGCovk4");

    const client = await MarginfiClient.fetch(config, wallet as Wallet, solConnection);
    const wrapper = await client.getMarginfiAccountsForAuthority(wallet?.publicKey);    
    // const wrapper = MarginfiAccountWrapper.fetch(new PublicKey("6jEURvM5pocbsV9X8fnUMKWhvGogLNWJnn2bvipZtgeh"), client);
    // (await wrapper).deposit(100, new PublicKey("GxgkzB56C9yBuFP8aJ3cGXkexo7CxfofwEbADEKGaCrU"));
    // const balances = (await wrapper).balances;
    // console.log(balances);


    const banks = await getBanks(new PublicKey(margin_group_pub));
    setBanks(banks);

    // Pyth Orcale Get
    const pythKey = getPythProgramKeyForCluster('pythtest-crosschain');
    const pythClient = new PythHttpClient(solConnection, pythKey);

    let marginAccountData: any;
    if (wallet && wallet.publicKey) {
      marginAccountData = await getMarginAccount(wallet.publicKey, new PublicKey(margin_group_pub));
      if (marginAccountData == null) {
        setPubKey("");
      } else {
        setPubKey(marginAccountData.pubKey);
        setLendData(marginAccountData.lendData);
      }
      console.log(marginAccountData);
    } else {
      console.error("Wallet not connected");
    }
    const newData = await Promise.all(banks.map(async (bank, index) => {
      const price_data: PriceData[] = await pythClient.getAssetPricesFromAccounts([new PublicKey(bank.oracle_price)]);
      // console.log(price_data[0].priceComponents[1].aggregate.price, price_data[0].priceComponents[1].publisher.toBase58());
      const token = TOKENS.find(e => e.tokenMint == bank.oracle_price);
      const lend_data = marginAccountData?.lendData.find((e: any) => e.bank_pk == bank.bank_pk.toBase58());
      const dec = 10 ** bank.token_decimal;
      return {
        key: index.toString(),
        name: token?.tokenName ?? 'Unknown',
        oracle_key: bank.oracle_price,
        price: price_data[0].aggregate.price.toString(),
        deposit: (bank.total_deposit / dec).toFixed(2).toString() + " (" + (lend_data ? (lend_data.asset_share / 10 ** bank.token_decimal).toFixed(2) : 0 / dec).toString() + ")",
        borrow: (bank.total_borrow / dec).toFixed(2).toString() + " (" + (lend_data ? (lend_data.lia_share / 10 ** bank.token_decimal).toFixed(2) : 0 / dec).toString() + ")",
        limit: bank.deposit_limit.toString(),
        bank_pk: bank.bank_pk.toBase58(),
        token_mint: bank.token_mint,
        token_decimal: bank.token_decimal
      }
    }));
    newData.map(e => console.log(e.bank_pk, e.oracle_key, e.token_mint))
    setData(newData);
  }
  useEffect(() => {
    func();
  }, [])

  useEffect(() => {
    func();
  }, [wallet])

  const handleAction = async (action: string, data: DataType) => {
    if (!wallet)
      return;
    let remaining_accounts: AccountMeta[] = [];
    lendData.map((lend: any) => {
      let bank = banks.find(e => e.bank_pk == lend.bank_pk);
      remaining_accounts.push({
        pubkey: new PublicKey(lend.bank_pk),
        isSigner: false,
        isWritable: false
      })
      remaining_accounts.push({
        pubkey: new PublicKey(bank.oracle_price),
        isSigner: false,
        isWritable: false
      })
    })

    //add changed bank
    let bank = banks.find(e => e.bank_pk == data.bank_pk);
    remaining_accounts.push({
      pubkey: new PublicKey(bank.bank_pk),
      isSigner: false,
      isWritable: false
    })
    remaining_accounts.push({
      pubkey: new PublicKey(bank.oracle_price),
      isSigner: false,
      isWritable: false
    })

    switch (action) {
      case 'Supply':
        await depositAccount(
          wallet,
          new PublicKey(margin_group_pub),
          new PublicKey(pubKey),
          new PublicKey(data.token_mint),
          new PublicKey(data.bank_pk),
          actionAmount * 10 ** data.token_decimal
        );
        break;
      case 'Repay':
        await repayAccount(
          wallet,
          new PublicKey(margin_group_pub),
          new PublicKey(pubKey),
          new PublicKey(data.token_mint),
          new PublicKey(data.bank_pk),
          actionAmount * 10 ** data.token_decimal,
          remaining_accounts
        );
        break;
      case 'Borrow':
        await borrowAccount(
          wallet,
          new PublicKey(margin_group_pub),
          new PublicKey(pubKey),
          new PublicKey(data.token_mint),
          new PublicKey(data.bank_pk),
          actionAmount * 10 ** data.token_decimal,
          remaining_accounts
        );
        break;
      case 'Withdraw':
        await withdrawAccount(
          wallet,
          new PublicKey(margin_group_pub),
          new PublicKey(pubKey),
          new PublicKey(data.token_mint),
          new PublicKey(data.bank_pk),
          actionAmount * 10 ** data.token_decimal,
          remaining_accounts
        );
        break;
      case 'Liquidate':
        let remaining_accounts2: AccountMeta[] = [];
        remaining_accounts2.push({
          pubkey: new PublicKey("EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw "),
          isSigner: false,
          isWritable: false
        })
        remaining_accounts2.push({
          pubkey: new PublicKey("EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw "),
          isSigner: false,
          isWritable: false
        })
        await liquidateAccount(
          wallet,
          new PublicKey(margin_group_pub),
          new PublicKey(pubKey),
          new PublicKey("ALEnsx2AizjDfRYLucTYzDpcfBpxfwD8UN54Cm7CFqN6"), // third account for liquidate
          new PublicKey(data.bank_pk), // get token for selected row from liquidatee collateral
          new PublicKey("GmQmdK4TL2AizrpWcj5vJqkm7ukQ5HUh9HERHvViXK7g"),  // spend liquidatee's borrow token 
          actionAmount * 10 ** data.token_decimal,
          new PublicKey("GAKS74QSGdt4tN4SLH6bHhJfAucYu3e8Dwf6hRRcJaU1"),
          remaining_accounts2
        );
        break;
      case 'Close':
        await closeBalance(
          wallet,
          new PublicKey(margin_group_pub),
          new PublicKey(pubKey),
          new PublicKey(data.bank_pk)
        );
        break;
    }
    func();
  };
  return (
    <main className="flex min-h-screen flex-col items-center s-welcome">
      <Header />
      <div style={{ "paddingTop": "200px", "display": "flex", "flexDirection": "column", "alignItems": "center" }}>
        {/* Input for amount */}
        <div className="mb-4">
          <label htmlFor="actionAmount" className="block text-sm font-medium text-gray-700">
            Amount for Supply/Repay/Borrow/Withdraw:
          </label>
          <input
            type="number"
            id="actionAmount"
            value={actionAmount}
            onChange={handleAmountChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="Enter amount"
          />
        </div>
        <p>Your MarginAccount Pubkey: {pubKey}</p>
        <button onClick={async () => {
          if (!wallet) return;
          if (pubKey == "")
            await initAccount(wallet, new PublicKey(margin_group_pub))
          else
            closeAccount(wallet, new PublicKey(pubKey))
        }
        }>{pubKey != "" ? "Close Account" : "Init Account"}</button>
        <Table columns={columns} dataSource={data} />
      </div>
    </main>
  );
}

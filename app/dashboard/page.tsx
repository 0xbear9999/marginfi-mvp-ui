'use client'
import Header from "../components/layout/header";
import Filters from "../components/sub-layout/filters";
import { useContext, useEffect, useState } from "react";
import { TodoContext } from "../third-provider";
import { initAccount, depositAccount, withdrawAccount, borrowAccount, getBanks, getMarginAccount } from "../solana/transaction";
import { PublicKey } from "@metaplex-foundation/js";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { solConnection } from "../utils/util";
import { Space, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { getPythProgramKeyForCluster, PythHttpClient, PythCluster, PriceData } from "@pythnetwork/client";
import { TOKENS } from "../config";
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
const margin_group_pub = "xSKVMWvLuX4vnsf1NqzAyeJBKqsXuM4qky9GWH4Ltq8";
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
          </Space>
        );
      },
    },
  ];
  const wallet = useAnchorWallet();
  const [data, setData] = useState<DataType[]>([]);
  const [pubKey, setPubKey] = useState<string>("");
  useEffect(() => {
    const func = async () => {
      const banks = await getBanks(new PublicKey(margin_group_pub));

      // Pyth Orcale Get
      const pythKey = getPythProgramKeyForCluster('pythtest-crosschain');
      const pythClient = new PythHttpClient(solConnection, pythKey);
      let marginAccountData: any;
      if (wallet && wallet.publicKey) {
        marginAccountData = await getMarginAccount(wallet.publicKey, new PublicKey(margin_group_pub), new PublicKey("3kK9mTFnTUKn2pg2vNJc2mcNPFdaCgjQFJxUowJiUGw8"));
        setPubKey(marginAccountData.pubKey);
      } else {
        console.error("Wallet not connected");
      }
      setData(await Promise.all(banks.map(async (bank, index) => {
        const price_data: PriceData[] = await pythClient.getAssetPricesFromAccounts([new PublicKey(bank.oracle_price)]);
        const token = TOKENS.find(e => e.tokenMint == bank.oracle_price);
        const lend_data = marginAccountData.lendData.find((e: any) => e.bank_pk == bank.bank_pk.toBase58());
        const dec = 10 ** bank.token_decimal;
        return {
          key: index.toString(),
          name: token?.tokenName ?? 'Unknown',
          price: price_data[0].aggregate.price.toString(),
          deposit: (bank.total_deposit / dec).toString() + " (" + (lend_data ? lend_data.asset_share : 0 / dec).toString() + ")",
          borrow: (bank.total_borrow / dec).toString() + " (" + (lend_data ? lend_data.lia_share : 0 / dec).toString() + ")",
          limit: bank.deposit_limit.toString(),
          bank_pk: bank.bank_pk.toBase58(),
          token_mint: bank.token_mint,
          token_decimal: bank.token_decimal
        }
      })))
    }
    func();
  }, [])

  const handleAction = (action: string, data: DataType) => {
    if (!wallet)
      return;
    switch (action) {
      case 'Supply':
        depositAccount(
          wallet,
          new PublicKey(margin_group_pub),
          new PublicKey(pubKey),
          new PublicKey(data.token_mint),
          new PublicKey(data.bank_pk),
          20 * 10 ** data.token_decimal
        );
        break;
      case 'Repay':
        // Call repay function with number
        break;
      case 'Borrow':
        // Call borrow function with number
        break;
      case 'Withdraw':
        // Call withdraw function with number
        break;
    }
  };
  const onDeposit = async () => {

  }
  return (
    <main className="flex min-h-screen flex-col items-center s-welcome">
      <Header />
      <div style={{ "paddingTop": "200px" }}>
        <Table columns={columns} dataSource={data} />
      </div>
      <button onClick={() => { onDeposit(); }}>ASD</button>
    </main>
  );
}

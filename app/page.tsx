'use client';
import Image from "next/image";
import S_Button from "./components/common/button";
import { useRouter } from "next/navigation";
export default function Home() {
  const router = useRouter();
  return (
    <main className="flex min-h-screen flex-col items-center justify-around p-24 s-welcome">
      <S_Button b_name="Raffle" color="#DBEF60" width="153px" height="47px" click={()=>{router.push("/dashboard")}}/>      
    </main>
  );
}

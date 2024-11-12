import Link from 'next/link';
import DefaultLayout from "@/components/Layouts/simple";
import "@/css/style.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TÂCHETY",
  description: "Collaborative App",
};
export default async function Home() {

 
  return (
    <DefaultLayout>
   <div >
      <h1>Hello !</h1>
      <p>Welcome to TÂCHETY App.</p>
      <Link href="/login">
      
          <button>Login</button>
      
      </Link>
      </div>
    </DefaultLayout>
 
  );
}
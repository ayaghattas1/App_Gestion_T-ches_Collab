// "use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
//import "./globals.css";
import { AuthProvider } from './Providers'
import '@/css/media.css';
import "@/css/style.css";
import "@/css/satoshi.css";
import "jsvectormap/dist/css/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import Loader from "@/components/common/Loader";
import React, { useEffect, useState } from "react";

//const [loading, setLoading] = useState<boolean>(true);




const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "TÂCHETY",
//   description: "Collaborative App",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <AuthProvider>
        { children}
        </AuthProvider>
        </body>
    </html>
  );
}
// "use client";
// import "jsvectormap/dist/css/jsvectormap.css";
// import "flatpickr/dist/flatpickr.min.css";
// import "@/css/satoshi.css";
// import "@/css/style.css";
// import React, { useEffect, useState } from "react";
// import Loader from "@/components/common/Loader";

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [loading, setLoading] = useState<boolean>(true);

//   // const pathname = usePathname();

//   useEffect(() => {
//     setTimeout(() => setLoading(false), 1000);
//   }, []);

//   return (
//     <html lang="en">
//       <body suppressHydrationWarning={true}>
//         <div className="dark:bg-boxdark-2 dark:text-bodydark">
//           {loading ? <Loader /> : children}
//         </div>
//       </body>
//     </html>
//   );
// }

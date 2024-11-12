// pages/_app.tsx
"use client";
import { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import '@/css/media.css';
import "@/css/style.css";
import "@/css/satoshi.css";
import "jsvectormap/dist/css/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import Sidebar from "@/components/Sidebar";
import React, { useState, ReactNode } from "react";
import { useRouter } from 'next/router';
import Header from "@/components/Header";
import RootLayout from '@/app/layout';


function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const pageStyle = {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '10px',
    width: '100%', // Ensures the div takes full width
  };

  const columnStyle = {
    borderRadius: '25px',
    margin: '8px',
    // background: '#e2e2e2',
    padding: '10px',
  width: '900px' // Adjust width as necessary for each column
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (

    // Wraps the entire application with the SessionProvider and pass the session prop
    <SessionProvider session={session}>
      
      <div className="flex h-screen overflow-hidden">
        <Sidebar  sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-1 flex-col overflow-y-auto ">
       
  <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
  <main>
  <div style={pageStyle}>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
              <div style={columnStyle}>
                      <Component {...pageProps} />
            </div>
            </div>
            </div>
          </main>
     </div>
      </div> 
      
     


    </SessionProvider>
  );
}

export default MyApp;

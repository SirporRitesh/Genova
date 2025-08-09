import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import BootstrapClient from "../components/BootstrapClient";
import AuthWrapper from "./components/AuthWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChatClone - Mobile ChatGPT Clone",
  description: "A mobile-first ChatGPT clone built with Next.js, Bootstrap, and AI APIs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link 
          rel="stylesheet" 
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />
      </head>
      <body className={inter.className}>
        <AuthWrapper>
          {children}
        </AuthWrapper>
        <BootstrapClient />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UserProvider } from './context/UserContext';
import Nav from "../Components/nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Typanime",
  description: "Amuse toi à saisir les synopsis et des citations de tes animés préférées",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>
          <Nav></Nav>
          <div className="pt-24">
            {children}
          </div>
        </UserProvider>
      </body>
    </html>
  );
}

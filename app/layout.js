import { Newsreader } from "next/font/google";
import "./globals.css";
import localFont from "next/font/local";
import Providers from "@/providers";
import FloatingThemeToggleExpanded from "@/components/common/theme-toggle";

const news = Newsreader({
  variable: "--font-new",
  subsets: ["latin"],
});

const satoshi = localFont({
  src: "./fonts/Satoshi-Black.otf",
  variable: "--font-sato",
});

export const metadata = {
  title: "LEAD CHRISTIAN DISCIPLESHIP",
  description: "Making Disciples of Jesus, Our First Priority",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${news.variable} ${satoshi.variable} antialiased`}>
        <Providers>
          {children}
          {/* <FloatingThemeToggleExpanded position="bottom-left" /> */}
        </Providers>
      </body>
    </html>
  );
}

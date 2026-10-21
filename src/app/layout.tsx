import type { Metadata } from "next";
import { Questrial, Quicksand } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const questrial = Questrial({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-questrial",
  display: "swap",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GL Glow — Multi-Store Admin Portal",
  description: "Enterprise multi-tenant administrative portal for GL Glow & store branches",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${questrial.variable} ${quicksand.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#faf9f6] text-black">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}

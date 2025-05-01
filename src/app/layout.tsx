import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import {
  ClerkSignedIn,
  ClerkSignedOut,
  ClerkSignInButton,
  ClerkSignUpButton,
  ClerkUserButton
} from '../components/auth/ClerkClientComponents';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CA Guru AI",
  description: "AI-powered assistant for CA students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          suppressHydrationWarning
        >
          <header className="flex justify-end items-center p-4 gap-4 h-16">
            <ClerkSignedOut>
              <ClerkSignInButton />
              <ClerkSignUpButton />
            </ClerkSignedOut>
            <ClerkSignedIn>
              <ClerkUserButton />
            </ClerkSignedIn>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

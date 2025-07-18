"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/hooks/authContext";
import { useUserChannel } from "@/hooks/channelContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { hasChannel, channelLoading } = useUserChannel(user?.uid as string);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const publicRoutes = ["/signin", "/signup"];
    if (loading) return; 

    if (!user && !publicRoutes.includes(pathname)) {
      router.push("/signin");
    }
  }, [user, loading, pathname, router]);

  useEffect(() => {
    const channelOnly = [
      "/channel",
      "/createCourse",
      "/manageCourse",
      "/manageQuestions",
      "/questionPortal",
    ];

    if (channelLoading) return;

    const basePath = "/" + pathname.split("/")[1];

    if (!hasChannel && channelOnly.includes(basePath)) {
      router.push("/createChannel");
    }
  }, [pathname, router, channelLoading, hasChannel]);
  
  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1>Loading...</h1>
      </div>
    );
  }

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <AuthWrapper>{children}</AuthWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}

"use client";

import { AuthProvider, useAuth } from "@/hooks/authContext";
import { useRouter, usePathname } from "next/navigation";
import React, { useEffect } from "react";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { useUserChannel } from "@/hooks/userChannel";

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { hasChannel, loading: channelLoading } = useUserChannel();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const publicRoutes = ["/signin", "/signup"];
    const onlyAllowedWhenNoChannel = ["/createchannel"];

    if (authLoading || channelLoading) return;

    if (!user) {
      if (!publicRoutes.includes(pathname)) {
        router.push("/signin");
      }
    } else {
      if (!hasChannel) {
        if (!onlyAllowedWhenNoChannel.includes(pathname)) {
          router.push("/createchannel");
        }
      } else {
        if (publicRoutes.includes(pathname)) {
          router.push("/");
        }
      }
    }
  }, [user, authLoading, hasChannel, channelLoading, pathname, router]);

  if (authLoading || channelLoading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1>Loading...</h1>
      </div>
    );
  }

  const publicRoutes = ["/signin", "/signup"];
  const isPublicRoute = publicRoutes.includes(pathname);

  if (
    isPublicRoute ||
    !user ||
    (!hasChannel && pathname === "/createchannel")
  ) {
    return <>{children}</>;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <title>StudyBits</title>
      <body>
        <AuthProvider>
          <AuthWrapper>{children}</AuthWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}

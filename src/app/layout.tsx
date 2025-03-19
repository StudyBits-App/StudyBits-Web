"use client";

import { AuthProvider, useAuth } from '@/hooks/authContext';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import "./globals.css";
import Sidebar from '@/components/Sidebar';

function AuthWrapper({ children }: {children: React.ReactNode}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const publicRoutes = ['/signin', '/signup']; 
    if (!loading) {
      if (!user && !publicRoutes.includes(pathname)) {
          router.push('/signin');
      } else if (user && publicRoutes.includes(pathname)) {
          router.push('/');
      }
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1>Loading...</h1>
      </div>
    );
  }

  const isPublicRoute = ['/signin', '/signup'].includes(pathname);
  
  if (isPublicRoute || !user) {
    return <>{children}</>;
  }
  
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default function RootLayout({ children } : {children : React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AuthWrapper>{children}</AuthWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
'use client'
import React, { useEffect } from "react";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import { ProjectProvider } from "./contexts/ProjectContext";
import { EventProvider } from "./contexts/EventContext";
import { Layout } from "./components/Layout";
import { ToastContainer } from './components/ToastContainer';
import { initializeTheme } from "./utils/themeUtils";
import { Suspense } from 'react'
import Loading from './loading'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize theme from localStorage or system preference
  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <html lang="en">
      <link rel="icon" href="./favicon.ico"/>
      <body className="bg-background text-foreground min-h-screen flex flex-col">
        <AuthProvider>
          <WorkspaceProvider>
            <ProjectProvider>
              <EventProvider>
                <Layout className="flex flex-grow">
                  <main className="flex-1 overflow-y-auto">
                    <Suspense fallback={<Loading />}>
                      <ToastContainer />
                      {children}
                    </Suspense>
                  </main>
                </Layout>
              </EventProvider>
            </ProjectProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

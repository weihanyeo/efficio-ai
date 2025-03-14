import React from "react";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import { ProjectProvider } from "./contexts/ProjectContext";
import { EventProvider } from "./contexts/EventContext";
import { Layout } from "./components/Layout";

export const metadata = {
  title: "Efficio AI",
  description: "Productivity application powered by AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0D0D0D] text-white min-h-screen flex flex-col">
        <AuthProvider>
          <WorkspaceProvider>
            <ProjectProvider>
              <EventProvider>
                <Layout className="flex flex-grow">
                  <main className="flex-1 bg-[#0D0D0D] overflow-y-auto">
                    {children}
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

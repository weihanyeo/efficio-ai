import React from "react";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import { ProjectProvider } from "./contexts/ProjectContext";
import { EventProvider } from "./contexts/EventContext";
import { Sidebar } from "./components/Sidebar";
import { CopilotPanel } from "./components/CopilotPanel";
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
                  {/* <Sidebar className="w-64 bg-[#1A1A1A] border-r border-gray-800" /> */}
                  <main className="flex-1 bg-[#0D0D0D] overflow-y-auto">
                    {children}
                  </main>
                  {/* <CopilotPanel className="w-80 bg-[#1A1A1A] border-l border-gray-800" /> */}
                </Layout>
              </EventProvider>
            </ProjectProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

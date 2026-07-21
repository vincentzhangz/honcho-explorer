import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { AppErrorBoundary } from "@/components/app-error-boundary";
import { ConnectionScreen } from "@/components/connection/connection-screen";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/spinner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HonchoProvider, useHoncho } from "@/context/honcho-context";
import { PeerDetailPage } from "@/pages/peer-detail";
import { PeersPage } from "@/pages/peers";
import { SearchPage } from "@/pages/search";
import { SessionDetailPage } from "@/pages/session-detail";
import { SessionsPage } from "@/pages/sessions";
import { SettingsPage } from "@/pages/settings";
import { WorkspacesPage } from "@/pages/workspaces";

function AppRoutes() {
  const { loading, ready } = useHoncho();

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-6" aria-label="Loading" />
      </div>
    );
  }

  if (!ready) {
    return <ConnectionScreen />;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/workspaces" replace />} />
        <Route path="workspaces" element={<WorkspacesPage />} />
        <Route path="peers" element={<PeersPage />} />
        <Route path="peers/:peerId" element={<PeerDetailPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="sessions/:sessionId" element={<SessionDetailPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/workspaces" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <AppErrorBoundary>
          <HonchoProvider>
            <BrowserRouter>
              <AppRoutes />
              <Toaster position="bottom-right" closeButton duration={3500} />
            </BrowserRouter>
          </HonchoProvider>
        </AppErrorBoundary>
      </TooltipProvider>
    </ThemeProvider>
  );
}

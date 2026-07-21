import { Link, Outlet, useLocation, useParams } from "react-router";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHoncho } from "@/context/honcho-context";
import { resolveBaseUrl } from "@/lib/settings";

function ShellBreadcrumbs() {
  const location = useLocation();
  const { peerId, sessionId } = useParams();
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const root = segments[0];
  const rootLabel =
    root === "workspaces"
      ? "Workspaces"
      : root === "peers"
        ? "Peers"
        : root === "sessions"
          ? "Sessions"
          : root === "search"
            ? "Search"
            : root === "settings"
              ? "Settings"
              : root;

  const detailId =
    root === "peers" && peerId
      ? decodeURIComponent(peerId)
      : root === "sessions" && sessionId
        ? decodeURIComponent(sessionId)
        : null;

  if (!detailId && segments.length === 1) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{rootLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  if (!detailId) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link to={`/${root}`} />}>
            {rootLabel}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="max-w-[240px] truncate font-mono text-xs">
            {detailId}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function AppShell() {
  const { settings } = useHoncho();
  const baseUrl = resolveBaseUrl(settings);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger aria-label="Toggle sidebar" />
          <Separator orientation="vertical" className="h-4" />
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <ShellBreadcrumbs />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {settings.mode === "cloud" ? "Cloud" : "Self-hosted"}
            </Badge>
            <Tooltip>
              <TooltipTrigger className="hidden max-w-[200px] cursor-default truncate font-mono text-xs text-muted-foreground sm:inline">
                {settings.workspaceId}
              </TooltipTrigger>
              <TooltipContent>
                Workspace {settings.workspaceId} · {baseUrl}
              </TooltipContent>
            </Tooltip>
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 p-4 md:gap-5 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
